const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const { type, severity, is_read, child_id } = req.query;
    let where = []; let params = []; let idx = 1;

    if (type) { where.push(`al.type = $${idx++}`); params.push(type); }
    if (severity) { where.push(`al.severity = $${idx++}`); params.push(severity); }
    if (is_read !== undefined) { where.push(`al.is_read = $${idx++}`); params.push(is_read === 'true'); }
    if (child_id) { where.push(`al.child_id = $${idx++}`); params.push(child_id); }

    const result = await pool.query(`
      SELECT al.*, c.name AS child_name, c.classroom_id,
        m.name AS meal_name, cl.name AS classroom_name
      FROM alerts al
      LEFT JOIN children c ON al.child_id = c.id
      LEFT JOIN meal_assignments ma ON al.meal_assignment_id = ma.id
      LEFT JOIN meals m ON ma.meal_id = m.id
      LEFT JOIN classrooms cl ON c.classroom_id = cl.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY al.created_at DESC
      LIMIT 100
    `, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const result = await pool.query(
      'UPDATE alerts SET is_read = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/alerts/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await pool.query('UPDATE alerts SET is_read = true WHERE is_read = false');
    res.json({ message: 'All alerts marked as read' });
  } catch (err) { next(err); }
});

// POST /api/alerts (manual alert)
router.post('/', async (req, res, next) => {
  try {
    const { child_id, type, title, message, severity } = req.body;
    const result = await pool.query(
      'INSERT INTO alerts (child_id, type, title, message, severity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [child_id || null, type || 'info', title, message, severity || 'low']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/alerts/daily-summary — daily digest stats
router.get('/daily-summary', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await pool.query(
      `SELECT type, severity, COUNT(*) as count FROM alerts WHERE created_at >= $1 GROUP BY type, severity`,
      [today.toISOString()]
    );
    const allToday = await pool.query(
      `SELECT al.*, c.name AS child_name FROM alerts al LEFT JOIN children c ON al.child_id = c.id WHERE al.created_at >= $1 ORDER BY al.created_at DESC LIMIT 50`,
      [today.toISOString()]
    );
    const rows = result.rows;
    res.json({
      total: rows.reduce((s, r) => s + parseInt(r.count), 0),
      blocked: rows.filter(r => r.type === 'blocked').reduce((s, r) => s + parseInt(r.count), 0),
      warnings: rows.filter(r => r.type === 'warning').reduce((s, r) => s + parseInt(r.count), 0),
      by_severity: rows,
      alerts: allToday.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
