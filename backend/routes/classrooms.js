const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/classrooms
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT cl.*, u.name AS teacher_name, COUNT(c.id) AS child_count
      FROM classrooms cl
      LEFT JOIN users u ON cl.teacher_id = u.id
      LEFT JOIN children c ON c.classroom_id = cl.id
      GROUP BY cl.id, u.name
      ORDER BY cl.name
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
