const express = require('express');
const { body } = require('express-validator');
const { pool } = require('../models/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { checkMealSafety } = require('../utils/allergyEngine');

const router = express.Router();
router.use(authMiddleware);

// POST /api/meal-assignments
router.post('/', adminOnly, [
  body('meal_id').matches(/^[a-zA-Z0-9-]{36}$/),
  body('classroom_id').matches(/^[a-zA-Z0-9-]{36}$/),
  body('assigned_date').isISO8601().toDate(),
  body('notes').optional().trim(),
  validate,
], async (req, res, next) => {
  try {
    const { meal_id, classroom_id, assigned_date, notes } = req.body;

    // Get meal
    const mealResult = await pool.query('SELECT * FROM meals WHERE id = $1', [meal_id]);
    if (!mealResult.rows.length) return res.status(404).json({ error: 'Meal not found' });
    const meal = mealResult.rows[0];

    // Get children in classroom with their allergies
    const childrenResult = await pool.query(`
      SELECT c.id, c.name, c.risk_level,
        json_agg(json_build_object('name', a.name, 'severity', a.severity, 'type', a.type)) FILTER (WHERE a.id IS NOT NULL) AS allergies
      FROM children c
      LEFT JOIN allergies a ON a.child_id = c.id AND a.type = 'food'
      WHERE c.classroom_id = $1
      GROUP BY c.id, c.name, c.risk_level
    `, [classroom_id]);

    // Create assignment
    const assignResult = await pool.query(
      'INSERT INTO meal_assignments (meal_id, classroom_id, assigned_date, assigned_by, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [meal_id, classroom_id, assigned_date, req.user.id, notes || null]
    );
    const assignment = assignResult.rows[0];

    // Run safety checks for each child
    const safetyResults = [];
    const alertsToCreate = [];

    for (const child of childrenResult.rows) {
      const childAllergies = child.allergies || [];
      const safety = checkMealSafety(meal.ingredients, childAllergies);
      safetyResults.push({ child_id: child.id, child_name: child.name, ...safety });

      if (safety.status !== 'safe') {
        alertsToCreate.push({
          child_id: child.id,
          assignment_id: assignment.id,
          type: safety.status === 'blocked' ? 'blocked' : 'warning',
          title: safety.status === 'blocked'
            ? `⛔ BLOCKED: ${meal.name} is unsafe for ${child.name}`
            : `⚠️ WARNING: ${meal.name} may affect ${child.name}`,
          message: safety.notes,
          severity: safety.status === 'blocked' ? 'high' : 'medium',
        });
      }
    }

    // Bulk insert alerts
    for (const alert of alertsToCreate) {
      await pool.query(
        'INSERT INTO alerts (child_id, meal_assignment_id, type, title, message, severity) VALUES ($1, $2, $3, $4, $5, $6)',
        [alert.child_id, alert.assignment_id, alert.type, alert.title, alert.message, alert.severity]
      );
    }

    // Create notification for admin
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [req.user.id,
        `Meal "${meal.name}" assigned`,
        `${alertsToCreate.length} alert(s) generated for this assignment.`,
        alertsToCreate.length > 0 ? 'warning' : 'success']
    );

    res.status(201).json({
      assignment,
      safety_results: safetyResults,
      alerts_generated: alertsToCreate.length,
    });
  } catch (err) { next(err); }
});

// GET /api/meal-assignments
router.get('/', async (req, res, next) => {
  try {
    const { classroom_id, date } = req.query;
    let where = []; let params = []; let idx = 1;

    if (classroom_id) { where.push(`ma.classroom_id = $${idx++}`); params.push(classroom_id); }
    if (date) { where.push(`ma.assigned_date = $${idx++}`); params.push(date); }

    const result = await pool.query(`
      SELECT ma.*, m.name AS meal_name, m.meal_type, m.ingredients, cl.name AS classroom_name, u.name AS assigned_by_name
      FROM meal_assignments ma
      JOIN meals m ON ma.meal_id = m.id
      LEFT JOIN classrooms cl ON ma.classroom_id = cl.id
      LEFT JOIN users u ON ma.assigned_by = u.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY ma.assigned_date DESC, ma.created_at DESC
      LIMIT 50
    `, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/meal-assignments/check-safety
router.post('/check-safety', [
  body('meal_id').matches(/^[a-zA-Z0-9-]{36}$/),
  body('child_id').matches(/^[a-zA-Z0-9-]{36}$/),
  validate,
], async (req, res, next) => {
  try {
    const { meal_id, child_id } = req.body;
    const [mealR, allergiesR] = await Promise.all([
      pool.query('SELECT * FROM meals WHERE id = $1', [meal_id]),
      pool.query("SELECT * FROM allergies WHERE child_id = $1 AND type = 'food'", [child_id]),
    ]);
    if (!mealR.rows.length) return res.status(404).json({ error: 'Meal not found' });
    const safety = checkMealSafety(mealR.rows[0].ingredients, allergiesR.rows);
    res.json({ meal: mealR.rows[0].name, ...safety });
  } catch (err) { next(err); }
});

module.exports = router;
