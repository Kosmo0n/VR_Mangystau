const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /:courseId/questions — Курс сұрақтарын алу (дұрыс жауаптарсыз)
router.get('/:courseId/questions', (req, res) => {
  try {
    let course = null;
    const numericId = parseInt(req.params.courseId);
    if (!isNaN(numericId)) {
      course = db.prepare('SELECT id, title, slug FROM courses WHERE id = ?').get(numericId);
    }
    if (!course) {
      course = db.prepare('SELECT id, title, slug FROM courses WHERE slug = ?').get(req.params.courseId);
    }

    if (!course) {
      return res.status(404).json({ success: false, message: 'Курс табылмады' });
    }

    const questions = db.prepare(
      'SELECT id, question, option_a, option_b, option_c, option_d, order_num FROM test_questions WHERE course_id = ? ORDER BY order_num'
    ).all(course.id);

    res.json({ success: true, course, questions });
  } catch (error) {
    console.error('Сұрақтарды алу қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

// POST /:courseId/submit — Тест жауаптарын тапсыру
router.post('/:courseId/submit', (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, message: 'Жауаптар көрсетілмеген' });
    }

    let course = null;
    const numericId = parseInt(req.params.courseId);
    if (!isNaN(numericId)) {
      course = db.prepare('SELECT id, title FROM courses WHERE id = ?').get(numericId);
    }
    if (!course) {
      course = db.prepare('SELECT id, title FROM courses WHERE slug = ?').get(req.params.courseId);
    }

    if (!course) {
      return res.status(404).json({ success: false, message: 'Курс табылмады' });
    }

    const courseId = course.id;

    // Дұрыс жауаптарды алу
    const questions = db.prepare(
      'SELECT id, correct_answer FROM test_questions WHERE course_id = ? ORDER BY order_num'
    ).all(courseId);

    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: 'Бұл курс үшін сұрақтар жоқ' });
    }

    // Жауаптарды тексеру
    let score = 0;
    const total = questions.length;
    const results = [];

    for (const question of questions) {
      const userAnswer = answers[question.id] || answers[String(question.id)];
      const correct = userAnswer === question.correct_answer;
      if (correct) score++;

      results.push({
        questionId: question.id,
        correct,
        userAnswer: userAnswer || null,
        correctAnswer: question.correct_answer
      });
    }

    const percentage = Math.round((score / total) * 100);

    // Егер пайдаланушы кірген болса, нәтижені сақтау
    if (req.session && req.session.userId) {
      const stmt = db.prepare(
        'INSERT INTO test_results (user_id, course_id, score, total, percentage) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(req.session.userId, courseId, score, total, percentage);
    }

    res.json({
      success: true,
      score,
      total,
      percentage,
      results
    });
  } catch (error) {
    console.error('Тест тапсыру қатесі:', error);
    res.status(500).json({ success: false, message: 'Сервер қатесі' });
  }
});

module.exports = router;
