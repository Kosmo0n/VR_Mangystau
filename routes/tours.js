const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET / — Барлық турларды алу
router.get('/', (req, res) => {
  try {
    const tours = db.prepare(
      'SELECT id, name, slug, short_description, image_url, location FROM tours'
    ).all();

    res.json({ success: true, tours });
  } catch (error) {
    console.error('Турларды алу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

// GET /:slug — Турды slug бойынша алу
router.get('/:slug', (req, res) => {
  try {
    const tour = db.prepare('SELECT * FROM tours WHERE slug = ?').get(req.params.slug);

    if (!tour) {
      return res.status(404).json({ success: false, message: 'Тур табылмады' });
    }

    // JSON өрістерін парсинг жасау
    try {
      tour.facts = tour.facts ? JSON.parse(tour.facts) : [];
    } catch {
      tour.facts = [];
    }

    try {
      tour.gallery = tour.gallery ? JSON.parse(tour.gallery) : [];
    } catch {
      tour.gallery = [];
    }

    res.json({ success: true, tour });
  } catch (error) {
    console.error('Тур алу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

module.exports = router;
