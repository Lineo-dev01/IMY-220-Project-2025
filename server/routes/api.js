const express = require('express');
const { ObjectId, GridFSBucket } = require('mongodb');
const { isMember, isOwner, restoreFileVersion, isValidObjectId } = require('../db/db.js');
const router = express.Router();
const multer = require('multer');
const upload = multer();

async function getDb() {
  const { connect } = require('../db/db');
  return await connect();
}


router.post('/login', async (req, res) => {
  const db = await getDb();
  const user = await db.collection('users').findOne({
    email: req.body.email,
    password: req.body.password
  });
  if (user) {
    res.setHeader('Set-Cookie', `userId=${user._id}; HttpOnly; Path=/; SameSite=Lax`);
    res.json(user);
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

router.post('/register', async (req, res) => {
  const db = await getDb();
  const result = await db.collection('users').insertOne({
    email: req.body.email,
    password: req.body.password,
    name: '',
    friends: [],
    projects: [],
    checkins: 0,
    isAdmin: false
  });
  res.setHeader('Set-Cookie', `userId=${result.insertedId}; HttpOnly; Path=/; SameSite=Lax`);
  res.json({ _id: result.insertedId });
});

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'userId=; Max-Age=0; Path=/; HttpOnly');
  res.json({ message: 'Logged out' });
});

router.get('/user', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  res.json(user || {});
});

router.get('/project/types', async (req, res) => {
  if (!req.user) return res.status(401).send('Unauthorized');
  const types = await db.collection('projectTypes').find().toArray();
  res.json(types);
});

router.get('/activity', async (req, res) => {
  const db = await getDb();
  const type = req.query.type || 'global';
  const sortField = req.query.sort || 'activity._id';

  let cursor;
  if (type === 'local') {
    const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
    if (!userId) return res.status(401).json({ error: 'Login required' });

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { isValidObjectId } = require('../db/db');
    const validFriendIds = (user.friends || [])
      .filter(id => isValidObjectId(id))
      .map(id => new ObjectId(id));

    const validProjectIds = (user.projects || [])
      .filter(id => isValidObjectId(id))
      .map(id => new ObjectId(id));

    if (validProjectIds.length === 0 && validFriendIds.length === 0) {
      return res.json([]);
    }

    cursor = db.collection('projects').find({
      $or: [
        { _id: { $in: validProjectIds } },
        { members: { $in: [new ObjectId(userId), ...validFriendIds] } }
      ]
    });
  } else {
    cursor = db.collection('projects').find({});
  }

  try {
    const projects = await cursor.sort({ [sortField]: -1 }).toArray();
    const activities = projects.flatMap(p => 
      (p.activity || []).map(a => ({
        ...a,
        project: { _id: p._id, name: p.name, image: p.image },
        userId: p.members[0]
      }))
    );
    res.json(activities);
  } catch (err) {
    console.error('Activity error:', err);
    res.status(500).json({ error: 'Failed to load activity' });
  }
});

router.get('/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ users: [], projects: [] });

  const db = await getDb();
  const users = await db.collection('users').find({
    name: { $regex: q, $options: 'i' }
  }).toArray();

  const projects = await db.collection('projects').find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { hashtags: q },
      { 'activity.message': { $regex: q, $options: 'i' } },
      { type: { $regex: q, $options: 'i' } }
    ]
  }).toArray();

  res.json({ users, projects });
});

router.get('/autocomplete', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json([]);

  const db = await getDb();
  const users = await db.collection('users').find({
    name: { $regex: `^${q}`, $options: 'i' }
  }).limit(5).toArray();

  const projects = await db.collection('projects').find({
    name: { $regex: `^${q}`, $options: 'i' }
  }).limit(5).toArray();

  res.json([...users.map(u => u.name), ...projects.map(p => p.name)]);
});

router.get('/profile', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  const db = await getDb();
  const profile = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  res.json(profile || {});
});

router.put('/profile', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  const db = await getDb();
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: req.body }
  );
  res.json({ message: 'Profile updated' });
});

router.get('/projects', async (req, res) => {
  const db = await getDb();
  const projects = await db.collection('projects').find().toArray();
  res.json(projects);
});


router.post('/project', upload.any(), async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  if (!userId) return res.status(401).json({ error: 'Login required' });

  try {
    const db = await getDb();

    const hashtags = [];
    if (req.body.hashtags) {
      if (Array.isArray(req.body.hashtags)) {
        hashtags.push(...req.body.hashtags);
      } else {
        hashtags.push(req.body.hashtags);
      }
    }

    const proj = {
      name: req.body.name,
      description: req.body.description,
      status: 'checkedIn',
      checkedOutBy: null,
      members: [new ObjectId(userId)],
      hashtags: hashtags.map(t => t.startsWith('#') ? t : `#${t}`),
      activity: [{ _id: new Date().toISOString(), message: 'Project created' }],
      files: [],
      type: req.body.type || 'General',
      version: req.body.version || '1.0.0'
    };

    const result = await db.collection('projects').insertOne(proj);
    const projectId = result.insertedId;

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $push: { projects: projectId } }
    );

    res.json({ _id: projectId, ...proj });
  } catch (err) {
    console.error('Project creation error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/project/:id', async (req, res) => {
  const db = await getDb();
  const project = await db.collection('projects').findOne({ _id: new ObjectId(req.params.id) });
  if (project) {
    res.json(project);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

router.put('/project/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  if (await isOwner(db, userId, req.params.id)) {
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ message: 'Project updated' });
  } else {
    res.status(403).json({ error: 'Only owner can edit' });
  }
});

router.delete('/project/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  const project = await db.collection('projects').findOne({ _id: new ObjectId(req.params.id) });

  if (user?.isAdmin || (project && project.members.some(m => m.toString() === userId))) {
    await db.collection('projects').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Project deleted' });
  } else {
    res.status(403).json({ error: 'Admin or member required' });
  }
});

router.post('/project/:id/members', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const friend = await db.collection('users').findOne({ email: req.body.email });

  if (await isMember(db, userId, req.params.id) && friend) {
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { members: new ObjectId(friend._id) } }
    );
    res.json({ message: 'Member added' });
  } else {
    res.status(403).json({ error: 'Not allowed or user not found' });
  }
});

router.delete('/project/:id/members/:memberId', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  if (await isOwner(db, userId, req.params.id)) {
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $pull: { members: new ObjectId(req.params.memberId) } }
    );
    res.json({ message: 'Member removed' });
  } else {
    res.status(403).json({ error: 'Owner only' });
  }
});

router.put('/project/:id/owner', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const newOwner = await db.collection('users').findOne({ email: req.body.email });

  if (await isOwner(db, userId, req.params.id) && newOwner) {
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { checkedOutBy: new ObjectId(newOwner._id) } }
    );
    res.json({ message: 'Owner changed' });
  } else {
    res.status(403).json({ error: 'Not owner or user not found' });
  }
});

router.post('/project/checkout/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const project = await db.collection('projects').findOne({
    _id: new ObjectId(req.params.id),
    status: 'checkedIn'
  });

  if (project && await isMember(db, userId, req.params.id)) {
    await db.collection('projects').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'checkedOut', checkedOutBy: new ObjectId(userId) } }
    );
    res.json({ message: 'Checked out' });
  } else {
    res.status(403).json({ error: 'Not allowed' });
  }
});

router.post('/project/checkin/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const bucket = new GridFSBucket(db);
  const project = await db.collection('projects').findOne({
    _id: new ObjectId(req.params.id),
    checkedOutBy: new ObjectId(userId)
  });

  if (!project) return res.status(403).json({ error: 'Not checked out by you' });

  for (const f of req.body.files || []) {
    const buffer = Buffer.from(f.data.split(',')[1], 'base64');
    await new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(f.name, {
        metadata: { projectId: new ObjectId(req.params.id), version: req.body.version }
      });
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      uploadStream.end(buffer);
    });
  }

  await db.collection('projects').updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: { status: 'checkedIn', checkedOutBy: null },
      $push: { activity: { _id: new Date().toISOString(), message: req.body.message } }
    }
  );
  res.json({ message: 'Checked in' });
});

router.get('/project/versions/:id', async (req, res) => {
  const db = await getDb();
  const files = await db.collection('fs.files').find({
    'metadata.projectId': new ObjectId(req.params.id)
  }).toArray();
  res.json(files.map(f => ({
    _id: f._id,
    version: f.metadata.version,
    filename: f.filename
  })));
});

router.post('/project/:id/rollback', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const versionId = req.query.version;

  if (!versionId) return res.status(400).json({ error: 'Version ID required' });
  if (!(await isOwner(db, userId, req.params.id))) {
    return res.status(403).json({ error: 'Owner only' });
  }

  await restoreFileVersion(db, req.params.id, versionId);
  await db.collection('projects').updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { status: 'checkedIn', checkedOutBy: null } }
  );

  const updated = await db.collection('projects').findOne({ _id: new ObjectId(req.params.id) });
  res.json({ message: 'Rolled back', project: updated });
});

router.post('/project/types', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId), isAdmin: true });

  if (!user) return res.status(403).json({ error: 'Admin only' });
  await db.collection('projectTypes').insertOne({ type: req.body.type });
  res.json({ message: 'Type added' });
});

router.get('/discussion/:id', async (req, res) => {
  const db = await getDb();
  const messages = await db.collection('discussions').find({
    projectId: new ObjectId(req.params.id)
  }).toArray();
  res.json(messages);
});

router.post('/discussion/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  if (!userId) return res.status(401).json({ error: 'Login required' });

  const db = await getDb();
  const result = await db.collection('discussions').insertOne({
    projectId: new ObjectId(req.params.id),
    user: new ObjectId(userId),
    message: req.body.message,
    timestamp: new Date()
  });
  res.json(result);
});

router.post('/friend/request', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const friend = await db.collection('users').findOne({ email: req.body.email });

  if (friend && userId) {
    await db.collection('friendRequests').insertOne({
      from: new ObjectId(userId),
      to: new ObjectId(friend._id),
      status: 'pending'
    });
    res.json({ message: 'Request sent' });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

router.post('/friend/accept/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const request = await db.collection('friendRequests').findOne({
    _id: new ObjectId(req.params.id),
    to: new ObjectId(userId),
    status: 'pending'
  });

  if (request) {
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $push: { friends: request.from } }
    );
    await db.collection('users').updateOne(
      { _id: request.from },
      { $push: { friends: new ObjectId(userId) } }
    );
    await db.collection('friendRequests').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'accepted' } }
    );
    res.json({ message: 'Friend accepted' });
  } else {
    res.status(403).json({ error: 'Invalid request' });
  }
});

router.delete('/friend/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  if (!userId) return res.status(401).json({ error: 'Login required' });

  const db = await getDb();
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { friends: new ObjectId(req.params.id) } }
  );
  await db.collection('users').updateOne(
    { _id: new ObjectId(req.params.id) },
    { $pull: { friends: new ObjectId(userId) } }
  );
  res.json({ message: 'Unfriended' });
});

router.delete('/admin/user/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const admin = await db.collection('users').findOne({ _id: new ObjectId(userId), isAdmin: true });
  if (admin) {
    await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'User deleted' });
  } else {
    res.status(403).json({ error: 'Admin only' });
  }
});

router.delete('/admin/project/:id', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  const db = await getDb();
  const admin = await db.collection('users').findOne({ _id: new ObjectId(userId), isAdmin: true });
  if (admin) {
    await db.collection('projects').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Project deleted' });
  } else {
    res.status(403).json({ error: 'Admin only' });
  }
});

router.get('/file/:id', async (req, res) => {
  const db = await getDb();
  const bucket = new GridFSBucket(db);
  const file = await db.collection('fs.files').findOne({ _id: new ObjectId(req.params.id) });

  if (!file) return res.status(404).json({ error: 'File not found' });

  const mimeType = file.contentType || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);

  const downloadStream = bucket.openDownloadStream(new ObjectId(req.params.id));
  downloadStream.pipe(res);
});

router.delete('/user', async (req, res) => {
  const userId = req.headers.cookie?.match(/userId=([^;]+)/)?.[1];
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const projects = await db.collection('projects').find({ checkedOutBy: new ObjectId(userId) }).toArray();
  for (const proj of projects) {
    const admin = await db.collection('users').findOne({ isAdmin: true, _id: { $ne: new ObjectId(userId) } });
    if (admin) {
      await db.collection('projects').updateOne(
        { _id: proj._id },
        { $set: { checkedOutBy: admin._id } }
      );
    }
  }

  await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
  await db.collection('projects').deleteMany({ members: new ObjectId(userId) });

  res.setHeader('Set-Cookie', 'userId=; Max-Age=0; Path=/; HttpOnly');
  res.json({ message: 'Account deleted' });
});

module.exports = router;