const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET / — Барлық курстарды алу
router.get('/', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY id').all();

    // Әр курс үшін сабақ санын қосу
    const coursesWithCount = courses.map(course => {
      const lessonCount = db.prepare(
        'SELECT COUNT(*) as count FROM lessons WHERE course_id = ?'
      ).get(course.id);
      return { ...course, lessonCount: lessonCount.count };
    });

    res.json({ success: true, courses: coursesWithCount });
  } catch (error) {
    console.error('Курстарды алу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

// GET /:slug — Курсты slug бойынша алу (сабақтарымен)
router.get('/:slug', (req, res) => {
  try {
    const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(req.params.slug);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Курс табылмады' });
    }

    const lessons = db.prepare(
      'SELECT id, course_id, title, order_num, image_url FROM lessons WHERE course_id = ? ORDER BY order_num'
    ).all(course.id);

    // Егер пайдаланушы кірген болса, прогрессін алу
    let progress = [];
    if (req.session && req.session.userId) {
      progress = db.prepare(
        'SELECT lesson_id, completed FROM lesson_progress WHERE user_id = ? AND lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)'
      ).all(req.session.userId, course.id);
    }

    res.json({
      success: true,
      course: {
        ...course,
        lessons,
        progress
      }
    });
  } catch (error) {
    console.error('Курс алу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

// GET /:slug/lessons/:lessonOrder — Белгілі бір сабақты алу
router.get('/:slug/lessons/:lessonOrder', (req, res) => {
  try {
    const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(req.params.slug);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Курс табылмады' });
    }

    const lesson = db.prepare(
      'SELECT * FROM lessons WHERE course_id = ? AND order_num = ?'
    ).get(course.id, parseInt(req.params.lessonOrder));

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Сабақ табылмады' });
    }

    // Барлық сабақтар тізімін алу (навигация үшін)
    const allLessons = db.prepare(
      'SELECT id, title, order_num FROM lessons WHERE course_id = ? ORDER BY order_num'
    ).all(course.id);

    // Прогресс
    let completed = false;
    if (req.session && req.session.userId) {
      const prog = db.prepare(
        'SELECT completed FROM lesson_progress WHERE user_id = ? AND lesson_id = ?'
      ).get(req.session.userId, lesson.id);
      completed = prog ? !!prog.completed : false;
    }

    res.json({
      success: true,
      course: { id: course.id, title: course.title, slug: course.slug },
      lesson: { ...lesson, completed },
      allLessons
    });
  } catch (error) {
    console.error('Сабақ алу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

// POST /:courseId/progress — Сабақ прогрессін сақтау
router.post('/:courseId/progress', (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'Жүйеге кіру қажет' });
    }

    const { lessonId } = req.body;
    const courseId = parseInt(req.params.courseId);

    if (!lessonId) {
      return res.status(400).json({ success: false, message: 'Сабақ ID көрсетілмеген' });
    }

    // Сабақтың осы курсқа тиесілі екенін тексеру
    const lesson = db.prepare(
      'SELECT id FROM lessons WHERE id = ? AND course_id = ?'
    ).get(lessonId, courseId);

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Сабақ табылмады' });
    }

    // Прогрессті сақтау немесе жаңарту
    const stmt = db.prepare(`
      INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed = 1, completed_at = CURRENT_TIMESTAMP
    `);
    stmt.run(req.session.userId, lessonId);

    res.json({ success: true, message: 'Прогресс сақталды' });
  } catch (error) {
    console.error('Прогресс сақтау қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

module.exports = router;
