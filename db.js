const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://test-user:test-password@librarycluster.bczk72y.mongodb.net/DBExample?retryWrites=true&w=majority&appName=LibraryCluster';

let db;
async function connectDB() {
  if (db) return db;
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db('DBExample');
  return db;
}

// Badge definitions
const badges = {
  firstCommit: 'First Commit',
  explorer: 'Explorer',
  uploader: 'Uploader',
  downloader: 'Downloader',
  socialCoder: 'Social Coder',
  teamPlayer: 'Team Player',
  activeContributor: 'Active Contributor',
  projectCollector: 'Project Collector',
  communityBuilder: 'Community Builder',
  archivist: 'Archivist'
};

// Award badges
async function awardBadges(userId) {
  const db = await connectDB();
  const user = await getUserById(userId);
  if (!user) return;

  const updates = [];

  // First-time badges
  if (user.projectCreationCount === 1 && !user.badges.includes(badges.firstCommit)) updates.push(badges.firstCommit);
  if (user.checkoutCount === 1 && !user.badges.includes(badges.explorer)) updates.push(badges.explorer);
  if (user.checkinCount === 1 && !user.badges.includes(badges.uploader)) updates.push(badges.uploader);
  if (user.downloadCount === 1 && !user.badges.includes(badges.downloader)) updates.push(badges.downloader);

  // Threshold badges
  if (user.checkinCount >= 10 && !user.badges.includes(badges.activeContributor)) updates.push(badges.activeContributor);
  if (user.downloadCount >= 10 && !user.badges.includes(badges.archivist)) updates.push(badges.archivist);
  if (user.projects.length >= 5 && !user.badges.includes(badges.projectCollector)) updates.push(badges.projectCollector);
  if (user.friends.length >= 5 && !user.badges.includes(badges.communityBuilder)) updates.push(badges.communityBuilder);

  if (updates.length > 0) {
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { badges: { $each: updates } } }
    );
  }
}

// Seed initial data
async function seedData() {
  const db = await connectDB();
  const usersCollection = db.collection('users');
  const projectsCollection = db.collection('projects');

  await usersCollection.deleteMany({});
  await projectsCollection.deleteMany({});

  const user1 = await usersCollection.insertOne({
    username: 'user1',
    email: 'user1@example.com',
    password: 'pass123',
    aboutMe: 'I love coding!',
    joinedDate: new Date(),
    birthday: new Date('1990-01-01'),
    job: 'Developer',
    badges: ['Team Player'],
    proficiencies: ['JavaScript', 'Python'],
    projects: [],
    activity: [],
    socialMedias: [
      { type: 'github', url: 'https://github.com/user1' },
      { type: 'linkedin', url: 'https://linkedin.com/in/user1' }
    ],
    friends: [],
    profileImage: '/images/user1.jpg',
    projectCreationCount: 1,
    checkoutCount: 0,
    checkinCount: 2,
    downloadCount: 0
  });

  const user2 = await usersCollection.insertOne({
    username: 'user2',
    email: 'user2@example.com',
    password: 'pass456',
    aboutMe: 'Web enthusiast',
    joinedDate: new Date(),
    birthday: new Date('1995-05-05'),
    job: 'Designer',
    badges: [],
    proficiencies: ['HTML', 'CSS'],
    projects: [],
    activity: [],
    socialMedias: [{ type: 'twitter', url: 'https://twitter.com/user2' }],
    friends: [],
    profileImage: '/images/user2.jpg',
    projectCreationCount: 0,
    checkoutCount: 1,
    checkinCount: 0,
    downloadCount: 0
  });

  // Add friends
  await addFriend(user1.insertedId.toString(), user2.insertedId.toString());

  // Projects
  const project1 = await projectsCollection.insertOne({
    name: 'Project Alpha',
    description: 'A web app',
    programmingLanguages: ['JavaScript', 'HTML'],
    type: 'web',
    version: '1.0',
    creationDate: new Date(),
    image: '/images/project1.jpg',
    status: 'checked_in',
    hashtags: ['React', 'API', 'Framework'],
    owner: user1.insertedId,
    members: [user1.insertedId, user2.insertedId],
    activity: [
      { userId: user1.insertedId, action: 'check_in', message: 'Initial commit', timestamp: new Date() },
      { userId: user2.insertedId, action: 'check_out', message: 'Starting updates', timestamp: new Date() }
    ],
    files: [
      { name: 'index.js', type: 'javascript', lastUpdated: new Date() },
      { name: 'style.css', type: 'css', lastUpdated: new Date() }
    ]
  });

  const project2 = await projectsCollection.insertOne({
    name: 'Project Beta',
    description: 'Mobile tool',
    programmingLanguages: ['Swift'],
    type: 'mobile application',
    version: '0.1',
    creationDate: new Date(),
    image: '/images/project2.jpg',
    hashtags: ['Swift', 'Mobile'],
    status: 'checked_in',
    owner: user2.insertedId,
    members: [user2.insertedId],
    activity: [
      { userId: user2.insertedId, action: 'check_in', message: 'First version', timestamp: new Date() }
    ],
    files: [{ name: 'app.swift', type: 'swift', lastUpdated: new Date() }]
  });

  // Link projects to users
  await usersCollection.updateOne({ _id: user1.insertedId }, { $push: { projects: project1.insertedId } });
  await usersCollection.updateOne({ _id: user2.insertedId }, { $push: { projects: { $each: [project1.insertedId, project2.insertedId] } } });

  // Award initial badges
  await awardBadges(user1.insertedId.toString());
  await awardBadges(user2.insertedId.toString());
}

// ---------- USERS ----------
async function getUsers() {
  const db = await connectDB();
  return db.collection('users').find({}).toArray();
}

/*async function getUserById(id) {
  const db = await connectDB();
  return db.collection('users').findOne({ _id: new ObjectId(id) });
}*/
async function getUserById(id) {
  const db = await connectDB();
  if (!ObjectId.isValid(id)) return null;
  return db.collection('users').findOne({ _id: new ObjectId(id) });
}

async function createUser(userData) {
  const db = await connectDB();
  const usersCollection = db.collection('users');

  const user = {
    username: userData.username,
    email: userData.email,
    password: userData.password,
    aboutMe: '',
    joinedDate: new Date(),
    birthday: null,
    job: '',
    badges: [],
    proficiencies: [],
    projects: [],
    activity: [],
    socialMedias: [],
    friends: [],
    profileImage: '',
    projectCreationCount: 0,
    checkoutCount: 0,
    checkinCount: 0,
    downloadCount: 0
  };

  const result = await usersCollection.insertOne(user);
  return { ...user, _id: result.insertedId };
}

async function updateUser(id, updates) {
  const db = await connectDB();
  return db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: updates });
}

/*
async function deleteUser(id) {
  const db = await connectDB();
  return db.collection('users').deleteOne({ _id: new ObjectId(id) });
}*/
async function deleteUser(id) {
  const db = await connectDB();

  // Remove this user from other users' friends arrays
  await db.collection('users').updateMany(
    { friends: new ObjectId(id) },
    { $pull: { friends: new ObjectId(id) } }
  );

  // Delete the user
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  return result; // returns { acknowledged: true, deletedCount: 0 or 1 }
}

/*async function addFriend(userId, friendId) {
  const db = await connectDB();
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $addToSet: { friends: new ObjectId(friendId) } });
  await db.collection('users').updateOne({ _id: new ObjectId(friendId) }, { $addToSet: { friends: new ObjectId(userId) } });

  // First friend badge
  const user = await getUserById(userId);
  if (user.friends.length === 1 && !user.badges.includes(badges.socialCoder)) {
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $addToSet: { badges: badges.socialCoder } });
  }
  const friend = await getUserById(friendId);
  if (friend.friends.length === 1 && !friend.badges.includes(badges.socialCoder)) {
    await db.collection('users').updateOne({ _id: new ObjectId(friendId) }, { $addToSet: { badges: badges.socialCoder } });
  }

  await awardBadges(userId);
  await awardBadges(friendId);
}*/
async function addFriend(userId, friendId) {
  const db = await connectDB();

  // Ensure valid ObjectIds
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(friendId)) {
    throw new Error('Invalid userId or friendId');
  }

  // Add to each user's friends array
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $addToSet: { friends: new ObjectId(friendId) } }
  );
  await db.collection('users').updateOne(
    { _id: new ObjectId(friendId) },
    { $addToSet: { friends: new ObjectId(userId) } }
  );

  // Re-fetch users after update
  const user = await getUserById(userId);
  const friend = await getUserById(friendId);

  // Award first friend badge
  if (user.friends.length === 1 && !user.badges.includes(badges.socialCoder)) {
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { badges: badges.socialCoder } }
    );
  }

  if (friend.friends.length === 1 && !friend.badges.includes(badges.socialCoder)) {
    await db.collection('users').updateOne(
      { _id: new ObjectId(friendId) },
      { $addToSet: { badges: badges.socialCoder } }
    );
  }

  await awardBadges(userId);
  await awardBadges(friendId);

  return { message: 'Friend added' };
}

async function removeFriend(userId, friendId) {
  const db = await connectDB();
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $pull: { friends: new ObjectId(friendId) } });
  await db.collection('users').updateOne({ _id: new ObjectId(friendId) }, { $pull: { friends: new ObjectId(userId) } });
}

// ---------- PROJECTS ----------
async function getProjects() {
  const db = await connectDB();
  return db.collection('projects').find({}).toArray();
}
async function getProjectById(id) {
  const db = await connectDB();
  return db.collection('projects').findOne({ _id: new ObjectId(id) });
}
async function createProject(projectData) {
  const db = await connectDB();
  const result = await db.collection('projects').insertOne(projectData);
  await db.collection('users').updateOne({ _id: new ObjectId(projectData.owner) }, { $inc: { projectCreationCount: 1 }, $push: { projects: result.insertedId } });
  await awardBadges(projectData.owner.toString());
  return result;
}
async function updateProject(id, updates) {
  const db = await connectDB();
  return db.collection('projects').updateOne({ _id: new ObjectId(id) }, { $set: updates });
}
/*async function deleteProject(id) {
  const db = await connectDB();
  return db.collection('projects').deleteOne({ _id: new ObjectId(id) });
}*/
async function deleteProject(projectId, userId) {
  const db = await connectDB();
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');

  if (project.owner.toString() !== userId.toString()) {
    throw new Error('Only the owner can delete this project');
  }

  // Remove project from members' project lists
  await db.collection('users').updateMany(
    { _id: { $in: project.members } },
    { $pull: { projects: new ObjectId(projectId) } }
  );

  return db.collection('projects').deleteOne({ _id: new ObjectId(projectId) });
}


/*async function checkoutProject(id, userId) {
  const db = await connectDB();
  const result = await db.collection('projects').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: 'checked_out' }, $push: { activity: { userId: new ObjectId(userId), action: 'check_out', message: '', timestamp: new Date() } } }
  );
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $inc: { checkoutCount: 1 } });
  await awardBadges(userId);
  return result;
}*/
async function checkoutProject(id, userId) {
  const db = await connectDB();
  const project = await db.collection('projects').findOne({ _id: new ObjectId(id) });

  if (!project) throw new Error('Project not found');

  // Check if user is a member
  if (!project.members.map(m => m.toString()).includes(userId.toString()) && project.owner.toString() !== userId.toString()) {
    throw new Error('Only project members can check out this project');
  }

  // Check if already checked out
  if (project.status === 'checked_out') {
    if (project.checkedOutBy && project.checkedOutBy.toString() === userId.toString()) {
      throw new Error('Project already checked out by you');
    } else {
      throw new Error('Project is already checked out by another user');
    }
  }

  // Update project to checked out
  const result = await db.collection('projects').updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { status: 'checked_out', checkedOutBy: new ObjectId(userId) },
      $push: { activity: { userId: new ObjectId(userId), action: 'check_out', message: '', timestamp: new Date() } }
    }
  );

  // Update user stats
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $inc: { checkoutCount: 1 } });
  await awardBadges(userId);

  return result;
}

/*async function checkinProject(id, userId, message, updatedFiles) {
  const db = await connectDB();
  const result = await db.collection('projects').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: 'checked_in' }, $push: { activity: { userId: new ObjectId(userId), action: 'check_in', message, timestamp: new Date() } }, $set: { 'files.$[file].lastUpdated': new Date() } },
    { arrayFilters: [{ 'file.name': { $in: updatedFiles.map(f => f.name) } }] }
  );
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $inc: { checkinCount: 1 } });
  await awardBadges(userId);
  return result;
}*/
async function checkinProject(projectId, userId, message, updatedFiles) {
  const db = await connectDB();
  const project = await getProjectById(projectId);

  if (project.status === 'checked_in') {
    throw new Error('Project is already checked in');
  }

  if (!project.checkedOutBy.equals(new ObjectId(userId))) {
    throw new Error('Only the user who checked out the project can check it back in');
  }

    await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    { 
        $set: { 
        status: 'checked_in', 
        checkedOutBy: null,
        'files.$[file].lastUpdated': new Date()
        },
        $push: { 
        activity: { userId: new ObjectId(userId), action: 'check_in', message, timestamp: new Date() } 
        }
    },
    { arrayFilters: [{ 'file.name': { $in: updatedFiles.map(f => f.name) } }] }
    );


  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $inc: { checkinCount: 1 } }
  );

  await awardBadges(userId);

  return { message: 'Project checked in successfully' };
}

async function addMemberToProject(projectId, userId) {
  const db = await connectDB();
  await db.collection('projects').updateOne({ _id: new ObjectId(projectId) }, { $addToSet: { members: new ObjectId(userId) } });
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $addToSet: { projects: new ObjectId(projectId) } });
  const user = await getUserById(userId);
  if (user.projects.length === 1 && !user.badges.includes(badges.teamPlayer)) {
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $addToSet: { badges: badges.teamPlayer } });
  }
  await awardBadges(userId);
}

async function removeMemberFromProject(projectId, ownerId, memberId) {
  const db = await connectDB();
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');

  if (project.owner.toString() !== ownerId.toString()) {
    throw new Error('Only the owner can remove a member');
  }

  if (memberId.toString() === ownerId.toString()) {
    throw new Error('Owner cannot be removed');
  }

  await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    { $pull: { members: new ObjectId(memberId) } }
  );

  await db.collection('users').updateOne(
    { _id: new ObjectId(memberId) },
    { $pull: { projects: new ObjectId(projectId) } }
  );

  return { message: 'Member removed' };
}

async function downloadFile(projectId, fileName, userId) {
  const db = await connectDB();
  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $inc: { downloadCount: 1 } });
  await db.collection('projects').updateOne({ _id: new ObjectId(projectId) }, { $push: { activity: { userId: new ObjectId(userId), action: 'download', message: `Downloaded ${fileName}`, timestamp: new Date() } } });
  await awardBadges(userId);
  return { message: 'File downloaded' };
}

// ---------- ACTIVITY ----------
async function getLocalActivity(userId) {
  const db = await connectDB();
  const user = await getUserById(userId);
  const projects = await db.collection('projects').find({ _id: { $in: user.projects.map(id => new ObjectId(id)) } }).toArray();
  const activities = projects.flatMap(p => p.activity.map(a => ({ ...a, projectId: p._id, projectImage: p.image })));
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}
async function getGlobalActivity() {
  const projects = await getProjects();
  const activities = projects.flatMap(p => p.activity.map(a => ({ ...a, projectId: p._id, projectImage: p.image })));
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

// ---------- SEARCH ----------
/*async function search(query, type) {
  const db = await connectDB();
  if (type === 'users') {
    return db.collection('users').find({
      $or: [{ username: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }]
    }).toArray();
  } else if (type === 'projects') {
    return db.collection('projects').find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { type: { $regex: query, $options: 'i' } },
        { programmingLanguages: { $regex: query, $options: 'i' } }
      ]
    }).toArray();
  } else if (type === 'checkins') {
    return db.collection('projects').aggregate([
      { $unwind: '$activity' },
      { $match: { 'activity.message': { $regex: query, $options: 'i' } } },
      { $project: { activity: 1 } }
    ]).toArray();
  }
}*/
async function search(query, type) {
  const db = await connectDB();
  const regex = { $regex: query, $options: 'i' }; // case-insensitive search

  let results = [];

  if (type === 'users' || type === 'all') {
    const users = await db.collection('users').find({
      $or: [{ username: regex }, { email: regex }, { job: regex }]
    }).toArray();
    results = results.concat(users.map(u => ({ ...u, _resultType: 'user' })));
  }

  if (type === 'projects' || type === 'all') {
    const projects = await db.collection('projects').find({
      $or: [
        { name: regex },
        { type: regex },
        { programmingLanguages: regex },
        { description: regex },
        { hashtags: regex }
      ]
    }).toArray();
    results = results.concat(projects.map(p => ({ ...p, _resultType: 'project' })));
  }

  if (type === 'checkins' || type === 'all') {
    const checkins = await db.collection('projects').aggregate([
      { $unwind: '$activity' },
      { $match: { 'activity.message': regex } },
      { $project: { projectId: '$_id', projectName: '$name', activity: 1 } }
    ]).toArray();
    results = results.concat(checkins.map(c => ({ ...c.activity, projectId: c.projectId, projectName: c.projectName, _resultType: 'checkin' })));
  }

  return results;
}


module.exports = {
  connectDB,
  seedData,
  // Users
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  addFriend,
  removeFriend,
  // Projects
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  checkoutProject,
  checkinProject,
  addMemberToProject,
  removeMemberFromProject,
  downloadFile,
  // Activity
  getLocalActivity,
  getGlobalActivity,
  // Search
  search
};