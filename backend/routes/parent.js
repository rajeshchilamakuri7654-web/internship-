const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../models/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

// GET /api/parent/my-child — child data linked to the logged-in parent
router.get('/my-child', async (req, res, next) => {
  try {
    const linkResult = await pool.query('SELECT * FROM parent_child_links WHERE parent_id = $1', [req.user.id]);
    if (!linkResult.rows.length) return res.status(404).json({ error: 'No child linked to this account' });

    const childId = linkResult.rows[0].child_id;
    const today = new Date().toISOString().split('T')[0];

    // Get child info first to get classroom_id
    const childResult = await pool.query(
      `SELECT c.*, cl.name AS classroom_name FROM children c LEFT JOIN classrooms cl ON c.classroom_id = cl.id WHERE c.id = $1`,
      [childId]
    );
    if (!childResult.rows.length) return res.status(404).json({ error: 'Child not found' });
    const child = childResult.rows[0];

    const [allergiesResult, mealsResult, alertsResult] = await Promise.all([
      pool.query('SELECT * FROM allergies WHERE child_id = $1 ORDER BY severity DESC', [childId]),
      pool.query(
        `SELECT ma.*, m.name AS meal_name, m.meal_type FROM meal_assignments ma JOIN meals m ON ma.meal_id = m.id WHERE ma.assigned_date = $1 AND ma.classroom_id = $2`,
        [today, child.classroom_id]
      ),
      pool.query('SELECT * FROM alerts WHERE child_id = $1 ORDER BY created_at DESC LIMIT 10', [childId]),
    ]);

    res.json({
      child,
      allergies: allergiesResult.rows,
      todays_meals: mealsResult.rows,
      recent_alerts: alertsResult.rows,
    });
  } catch (err) { next(err); }
});

// POST /api/parent/allergy-request — parent submits an allergy update request
router.post('/allergy-request', [
  body('child_id').notEmpty(),
  body('allergy_name').trim().notEmpty(),
  body('severity').optional().isIn(['low', 'medium', 'high']),
  validate,
], async (req, res, next) => {
  try {
    const { child_id, allergy_name, severity, symptoms, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO approval_requests (parent_id, child_id, allergy_name, severity, symptoms, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, child_id, allergy_name, severity || 'medium', symptoms || '', notes || '', 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/parent/approval-requests — admin views all pending requests
router.get('/approval-requests', adminOnly, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM approval_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { next(err); }
});

// PATCH /api/parent/approval-requests/:id — admin approves or rejects
router.patch('/approval-requests/:id', adminOnly, [
  body('status').isIn(['approved', 'rejected']),
  validate,
], async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE approval_requests SET status = $1, reviewed_by = $2, reviewed_at = $3 WHERE id = $4 RETURNING *`,
      [status, req.user.id, new Date().toISOString(), req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found' });

    // If approved, auto-create the allergy record
    if (status === 'approved') {
      const req_data = result.rows[0];
      await pool.query(
        `INSERT INTO allergies (child_id, type, name, severity, symptoms, notes) VALUES ($1, 'food', $2, $3, $4, $5)`,
        [req_data.child_id, req_data.allergy_name, req_data.severity, req_data.symptoms, `Approved from parent request. ${req_data.notes}`]
      );
    }

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
