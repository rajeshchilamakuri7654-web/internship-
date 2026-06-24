const express = require('express');
const { body, query, param } = require('express-validator');
const { pool } = require('../models/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

// GET /api/children
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().escape(),
  query('classroom_id').optional().matches(/^[a-zA-Z0-9-]{36}$/),
  query('risk_level').optional().isIn(['low', 'medium', 'high']),
  validate,
], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, classroom_id, risk_level } = req.query;

    let whereClause = [];
    let params = [];
    let idx = 1;

    if (search) {
      whereClause.push(`(c.name ILIKE $${idx} OR c.parent_name ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (classroom_id) {
      whereClause.push(`c.classroom_id = $${idx}`); params.push(classroom_id); idx++;
    }
    if (risk_level) {
      whereClause.push(`c.risk_level = $${idx}`); params.push(risk_level); idx++;
    }

    const where = whereClause.length ? `WHERE ${whereClause.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM children c ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT c.*, cl.name AS classroom_name,
        (SELECT COUNT(*) FROM allergies a WHERE a.child_id = c.id) AS allergy_count,
        (SELECT json_agg(json_build_object('id', a.id, 'type', a.type, 'name', a.name, 'severity', a.severity))
         FROM allergies a WHERE a.child_id = c.id) AS allergies
      FROM children c
      LEFT JOIN classrooms cl ON c.classroom_id = cl.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

// GET /api/children/:id
router.get('/:id', param('id').matches(/^[a-zA-Z0-9-]{36}$/), validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const childResult = await pool.query(`
      SELECT c.*, cl.name AS classroom_name
      FROM children c LEFT JOIN classrooms cl ON c.classroom_id = cl.id
      WHERE c.id = $1
    `, [id]);

    if (childResult.rows.length === 0) return res.status(404).json({ error: 'Child not found' });

    const [allergies, emergencyContacts, medicines, recentAlerts] = await Promise.all([
      pool.query('SELECT * FROM allergies WHERE child_id = $1 ORDER BY severity DESC', [id]),
      pool.query('SELECT * FROM emergency_contacts WHERE child_id = $1 ORDER BY is_primary DESC', [id]),
      pool.query('SELECT * FROM medicines WHERE child_id = $1', [id]),
      pool.query('SELECT * FROM alerts WHERE child_id = $1 ORDER BY created_at DESC LIMIT 10', [id]),
    ]);

    res.json({
      ...childResult.rows[0],
      allergies: allergies.rows,
      emergency_contacts: emergencyContacts.rows,
      medicines: medicines.rows,
      recent_alerts: recentAlerts.rows,
    });
  } catch (err) { next(err); }
});

// POST /api/children
router.post('/', adminOnly, [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('age').isInt({ min: 0, max: 18 }),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('classroom_id').optional().matches(/^[a-zA-Z0-9-]{36}$/),
  body('parent_name').optional().trim().isLength({ max: 100 }),
  body('parent_contact').optional().trim().isLength({ max: 20 }),
  body('notes').optional().trim(),
  body('risk_level').optional().isIn(['low', 'medium', 'high']),
  validate,
], async (req, res, next) => {
  try {
    const { name, age, gender, classroom_id, parent_name, parent_contact, notes, risk_level } = req.body;
    const result = await pool.query(`
      INSERT INTO children (name, age, gender, classroom_id, parent_name, parent_contact, notes, risk_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, age, gender || null, classroom_id || null, parent_name || null, parent_contact || null, notes || null, risk_level || 'low']);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/children/:id
router.put('/:id', adminOnly, param('id').matches(/^[a-zA-Z0-9-]{36}$/), [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('age').optional().isInt({ min: 0, max: 18 }),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('classroom_id').optional().matches(/^[a-zA-Z0-9-]{36}$/),
  body('parent_name').optional().trim(),
  body('parent_contact').optional().trim(),
  body('notes').optional().trim(),
  body('risk_level').optional().isIn(['low', 'medium', 'high']),
  validate,
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = ['name', 'age', 'gender', 'classroom_id', 'parent_name', 'parent_contact', 'notes', 'risk_level'];
    const updates = [];
    const values = [];
    let idx = 1;

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);

    const result = await pool.query(
      `UPDATE children SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Child not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/children/:id
router.delete('/:id', adminOnly, param('id').matches(/^[a-zA-Z0-9-]{36}$/), validate, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM children WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Child not found' });
    res.json({ message: 'Child deleted successfully' });
  } catch (err) { next(err); }
});

// POST /api/children/:id/allergies
router.post('/:id/allergies', adminOnly, [
  param('id').matches(/^[a-zA-Z0-9-]{36}$/),
  body('type').isIn(['food', 'medicine', 'environmental']),
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('severity').isIn(['low', 'medium', 'high']),
  body('symptoms').optional().trim(),
  body('notes').optional().trim(),
  validate,
], async (req, res, next) => {
  try {
    const { type, name, severity, symptoms, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO allergies (child_id, type, name, severity, symptoms, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.params.id, type, name, severity, symptoms || null, notes || null]
    );
    // Update child risk level based on highest severity allergy
    const highest = await pool.query(
      `SELECT MAX(CASE severity WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END) as max_sev FROM allergies WHERE child_id = $1`,
      [req.params.id]
    );
    const riskMap = { 3: 'high', 2: 'medium', 1: 'low' };
    const newRisk = riskMap[highest.rows[0].max_sev] || 'low';
    await pool.query('UPDATE children SET risk_level = $1 WHERE id = $2', [newRisk, req.params.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/children/:id/allergies/:allergyId
router.delete('/:id/allergies/:allergyId', adminOnly, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM allergies WHERE id = $1 AND child_id = $2', [req.params.allergyId, req.params.id]);
    res.json({ message: 'Allergy deleted' });
  } catch (err) { next(err); }
});

// POST /api/children/:id/emergency-contacts
router.post('/:id/emergency-contacts', adminOnly, [
  param('id').matches(/^[a-zA-Z0-9-]{36}$/),
  body('name').trim().notEmpty(),
  body('relationship').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('is_primary').optional().isBoolean(),
  body('medical_notes').optional().trim(),
  validate,
], async (req, res, next) => {
  try {
    const { name, relationship, phone, email, is_primary, medical_notes } = req.body;
    if (is_primary) {
      await pool.query('UPDATE emergency_contacts SET is_primary = false WHERE child_id = $1', [req.params.id]);
    }
    const result = await pool.query(
      'INSERT INTO emergency_contacts (child_id, name, relationship, phone, email, is_primary, medical_notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.params.id, name, relationship, phone, email || null, is_primary || false, medical_notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
