const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log('Test API:', req.method, req.url);
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
  next();
});

app.all('*', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    env: { 
      mongodb: !!process.env.MONGODB_URI, 
      jwt: !!process.env.JWT_SECRET 
    },
    path: req.url
  });
});

module.exports = (req, res) => {
  app(req, res);
};
