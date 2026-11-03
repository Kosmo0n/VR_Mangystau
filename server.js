const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files with HTML extension support
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Session configuration
app.use(session({
  secret: 'vr-mangystau-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 күн
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tours', require('./routes/tours'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/inquiries', require('./routes/inquiries'));

// Fallback for clean URLs to HTML files or index
app.get('*', (req, res) => {
  const cleanPath = req.path.replace(/^\//, '');
  const possibleHtml = path.join(__dirname, 'public', cleanPath + '.html');
  const fs = require('fs');
  if (fs.existsSync(possibleHtml)) {
    return res.sendFile(possibleHtml);
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`VR Mangystau сервері іске қосылды: http://localhost:${PORT}`);
});
