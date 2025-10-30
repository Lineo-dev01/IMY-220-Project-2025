require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const apiRouter = require('./routes/api');
const path = require('path');
const { connect } = require('./db/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(express.json());

app.use('/api', apiRouter);

app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

connect().then(() => {
  console.log('MongoDB connected & test data ready');
}).catch(err => {
  console.error('MongoDB connection failed:', err);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));