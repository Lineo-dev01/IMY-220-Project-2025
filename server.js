const express = require('express');
const cors = require('cors');
const {
  connectDB,
  seedData,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  addFriend,
  removeFriend,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  checkoutProject,
  checkinProject,
  getLocalActivity,
  getGlobalActivity,
  search,
  addMemberToProject,
  downloadFile
} = require('./db');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

seedData()
  .then(() => console.log('Data seeded'))
  .catch(err => console.error('Seed error:', err));

const loggedInUsers = [];

/* ---------------- AUTH ROUTES ---------------- */
app.post('/api/signup', async (req, res) => {
  try {
    const result = await createUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

/*app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUsers()
      .then(users => users.find(u => u.email === email && u.password === password));
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ userId: user._id }); // Return ID or token
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});*/
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUsers()
      .then(users => users.find(u => u.email === email && u.password === password));
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (!loggedInUsers.includes(user._id.toString())) {
      loggedInUsers.push(user._id.toString());
    }

    res.json({ userId: user._id, loggedInUsers });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/*app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});*/
app.post('/api/logout', async (req, res) => {
  const { userId } = req.body;
  const index = loggedInUsers.indexOf(userId);
  if (index > -1) loggedInUsers.splice(index, 1);
  res.json({ message: 'Logged out', loggedInUsers });
});

/* ---------------- USER ROUTES ---------------- */
app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/*app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});*/
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    await updateUser(req.params.id, req.body);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

/*
app.delete('/api/users/:id', async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});*/
app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await deleteUser(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.post('/api/users/:id/friends', async (req, res) => {
  try {
    await addFriend(req.params.id, req.body.friendId);
    res.json({ message: 'Friend added' });
  } catch (err) {
    res.status(500).json({ error: 'Add friend failed' });
  }
});

app.delete('/api/users/:id/friends/:friendId', async (req, res) => {
  try {
    await removeFriend(req.params.id, req.params.friendId);
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: 'Remove friend failed' });
  }
});

app.get('/api/users/:id/projects', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const dbProjects = await getProjects();
    const userProjects = dbProjects.filter(p =>
      p.owner.toString() === userId.toString() ||
      p.members.map(m => m.toString()).includes(userId.toString())
    );

    res.json(userProjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get user projects' });
  }
});

/* ---------------- PROJECT ROUTES ---------------- */
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const result = await createProject(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Create failed' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    await updateProject(req.params.id, req.body);
    res.json({ message: 'Project updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

/*app.delete('/api/projects/:id', async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});*/
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { userId } = req.body; 
    const result = await deleteProject(req.params.id, userId);
    res.json({ message: 'Project deleted', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/*app.post('/api/projects/:id/checkout', async (req, res) => {
  try {
    await checkoutProject(req.params.id, req.body.userId);
    res.json({ message: 'Checked out' });
  } catch (err) {
    res.status(500).json({ error: 'Checkout failed' });
  }
});*/
app.post('/api/projects/:id/checkout', async (req, res) => {
  try {
    await checkoutProject(req.params.id, req.body.userId);
    res.json({ message: 'Checked out' });
  } catch (err) {
    console.error(err); 
    res.status(400).json({ error: err.message }); 
  }
});

/*app.post('/api/projects/:id/checkin', async (req, res) => {
  try {
    const { userId, message, updatedFiles } = req.body;
    await checkinProject(req.params.id, userId, message, updatedFiles);
    res.json({ message: 'Checked in' });
  } catch (err) {
    res.status(500).json({ error: 'Checkin failed' });
  }
});*/
app.post('/api/projects/:id/checkin', async (req, res) => {
  try {
    const { userId, message, updatedFiles } = req.body;
    await checkinProject(req.params.id, userId, message, updatedFiles);
    res.json({ message: 'Checked in' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/projects/:id/members', async (req, res) => {
  try {
    const { userId } = req.body;
    await addMemberToProject(req.params.id, userId);
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: 'Add member failed' });
  }
});

app.delete('/api/projects/:id/members/:memberId', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await removeMemberFromProject(req.params.id, userId, req.params.memberId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id/files/:fileName', async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await downloadFile(req.params.id, req.params.fileName, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

/* ---------------- ACTIVITY ROUTES ---------------- */
app.get('/api/activity/local', async (req, res) => {
  try {
    const activities = await getLocalActivity(req.query.userId);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get local activity' });
  }
});

app.get('/api/activity/global', async (req, res) => {
  try {
    const activities = await getGlobalActivity();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get global activity' });
  }
});

/* ---------------- SEARCH ROUTE ---------------- */
/*app.get('/api/search', async (req, res) => {
  try {
    const { query, type } = req.query;
    const results = await search(query, type);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});*/
app.get('/api/search', async (req, res) => {
  try {
    const { query = '', type = 'all' } = req.query;
    const results = await search(query, type);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});


/* ---------------- START SERVER ---------------- */
app.listen(5000, async () => {
  await connectDB();
  console.log('Server running on port 5000');
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

/*res.sendFile(path.join(__dirname, 'project_files', fileName));*/