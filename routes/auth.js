const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/db');

// POST /register — Тіркелу
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Валидация
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Атыңызды енгізіңіз' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email енгізіңіз' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Email форматы дұрыс емес' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Құпия сөз кемінде 6 таңбадан тұруы керек' });
    }

    // Email бойынша тексеру
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim());
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Бұл email бұрыннан тіркелген' });
    }

    // Құпия сөзді хэштеу
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Пайдаланушыны қосу
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name.trim(), email.trim(), hashedPassword);

    const user = { id: result.lastInsertRowid, name: name.trim(), email: email.trim() };

    // Сессияны орнату
    req.session.userId = user.id;

    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error('Тіркелу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

// POST /login — Кіру
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email енгізіңіз' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Құпия сөзді енгізіңіз' });
    }

    // Пайдаланушыны табу
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email немесе құпия сөз қате' });
    }

    // Құпия сөзді тексеру
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email немесе құпия сөз қате' });
    }

    // Сессияны орнату
    req.session.userId = user.id;

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Кіру қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

// POST /logout — Шығу
router.post('/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Шығу кезінде қате орын алды' });
      }
      res.json({ success: true, message: 'Сәтті шықтыңыз' });
    });
  } catch (error) {
    console.error('Шығу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

// GET /me — Ағымдағы пайдаланушы
router.get('/me', (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ success: false, message: 'Жүйеге кірмегенсіз' });
    }

    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.session.userId);
    if (!user) {
      return res.json({ success: false, message: 'Пайдаланушы табылмады' });
    }

    // Тест нәтижелерін алу
    const testResults = db.prepare(`
      SELECT tr.*, c.title as course_title, c.slug as course_slug
      FROM test_results tr
      JOIN courses c ON c.id = tr.course_id
      WHERE tr.user_id = ?
      ORDER BY tr.completed_at DESC
    `).all(req.session.userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        testResults
      }
    });
  } catch (error) {
    console.error('Пайдаланушы деректерін алу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

module.exports = router;
