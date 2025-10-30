const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');

const uri = process.env.MONGO_URI;
let client;
let database;

async function connect() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    database = client.db('imy220db');
    await insertTestData();
  }
  return database;
}

async function insertTestData() {
  const users = database.collection('users');
  const projects = database.collection('projects');
  const discussions = database.collection('discussions');
  const friendRequests = database.collection('friendRequests');

  const userData = [
    { email: 'test@test.com', password: 'test1234', name: 'User 1', checkins: 1, isAdmin: true },
    { email: 'user2@test.com', password: 'pass2123', name: 'User 2', checkins: 0 },
    { email: 'user3@test.com', password: 'pass3123', name: 'User 3', checkins: 0 },
    { email: 'user4@test.com', password: 'pass4123', name: 'User 4', checkins: 0 },
    { email: 'user5@test.com', password: 'pass5123', name: 'User 5', checkins: 0 },
    { email: 'user6@test.com', password: 'pass6123', name: 'User 6', checkins: 0 },
    { email: 'user7@test.com', password: 'pass7123', name: 'User 7', checkins: 0 },
    { email: 'user8@test.com', password: 'pass8123', name: 'User 8', checkins: 0 },
  ];

  const userIds = [];

  for (let i = 0; i < userData.length; i++) {
    const u = userData[i];
    const result = await users.findOneAndUpdate(
      { email: u.email },
      {
        $setOnInsert: {
          password: u.password,
          name: u.name,
          friends: [],
          projects: [],
          checkins: u.checkins,
          isAdmin: u.isAdmin || false,
          languages: [{ name: 'JavaScript', count: 5 }, { name: 'Python', count: 3 }]
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const id = result.value?._id || (await users.findOne({ email: u.email }))._id;
    userIds.push(id);
  }

  await users.updateOne(
    { email: 'test@test.com' },
    { $set: { friends: [userIds[1], userIds[2]] } }
  );

  if ((await projects.countDocuments()) === 0) {
    const projIds = [];

    for (let i = 1; i <= 10; i++) {
      const proj = {
        name: `Project ${i}`,
        description: `Description for Project ${i}`,
        status: 'checkedIn',
        checkedOutBy: null,
        members: [userIds[0]],
        hashtags: ['#js', '#python'],
        activity: [{ _id: new Date().toISOString(), message: `Project ${i} created` }],
        files: [],
        type: 'General',
        version: '1.0.0',
        createdAt: new Date(),
      };
      const result = await projects.insertOne(proj);
      projIds.push(result.insertedId);

      for (let j = 1; j <= 2; j++) {
        proj.activity.push({
          _id: new Date().toISOString(),
          message: `Check-in ${j} for Project ${i}`,
        });
      }
      await projects.updateOne(
        { _id: result.insertedId },
        { $set: { activity: proj.activity } }
      );
    }

    await users.updateOne(
      { email: 'test@test.com' },
      { $push: { projects: projIds[0] } }
    );

    await users.updateOne(
      { email: 'test@test.com' },
      { $inc: { checkins: 1 } }
    );

    await discussions.insertOne({
      projectId: projIds[0],
      user: userIds[0],
      message: 'First discussion',
      timestamp: new Date(),
    });

    await friendRequests.insertOne({
      from: userIds[1],
      to: userIds[0],
      status: 'pending',
    });
  }
}

async function isMember(db, userId, projectId) {
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
  return project && project.members.some(m => m.toString() === userId);
}

async function isOwner(db, userId, projectId) {
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
  return project && project.checkedOutBy?.toString() === userId;
}

async function restoreFileVersion(db, projectId, versionId) {
  const bucket = new GridFSBucket(db);
  const file = await db.collection('fs.files').findOne({
    _id: new ObjectId(versionId),
    'metadata.projectId': new ObjectId(projectId)
  });

  if (!file) return;

  const downloadStream = bucket.openDownloadStream(new ObjectId(versionId));
  const chunks = [];

  for await (const chunk of downloadStream) {
    chunks.push(chunk);
  }

  const fileContent = Buffer.concat(chunks);

  await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    {
      $push: {
        files: {
          _id: new ObjectId(),
          filename: file.filename,
          version: file.metadata.version,
          restoredFrom: versionId,
          content: fileContent
        }
      }
    }
  );
}

async function isValidObjectId(id) {
  return id && /^[a-fA-F0-9]{24}$/.test(id);
}

module.exports = { connect, isMember, isOwner, restoreFileVersion, isValidObjectId };
