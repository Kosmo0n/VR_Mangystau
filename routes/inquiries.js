const express = require('express');
const router = express.Router();
const db = require('../db/db');

// POST / — Жаңа сұрау жіберу
router.post('/', (req, res) => {
  try {
    const { name, email, direction, message } = req.body;

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

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Хабарлама енгізіңіз' });
    }

    const stmt = db.prepare(
      'INSERT INTO inquiries (name, email, direction, message) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name.trim(), email.trim(), direction || null, message.trim());

    res.status(201).json({
      success: true,
      message: 'Сұрауыңыз сәтті жіберілді',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Сұрау жіберу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

module.exports = router;
