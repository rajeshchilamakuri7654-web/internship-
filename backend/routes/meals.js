const express = require('express');
const { body, param } = require('express-validator');
const { pool } = require('../models/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

// GET /api/meals
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT m.*, u.name AS created_by_name
      FROM meals m LEFT JOIN users u ON m.created_by = u.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/meals/:id
router.get('/:id', param('id').matches(/^[a-zA-Z0-9-]{36}$/), validate, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM meals WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Meal not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/meals
router.post('/', adminOnly, [
  body('name').trim().notEmpty().isLength({ max: 150 }),
  body('meal_type').isIn(['breakfast', 'lunch', 'snack', 'dinner']),
  body('ingredients').isArray({ min: 1 }),
  body('ingredients.*').trim().notEmpty().toLowerCase(),
  body('description').optional().trim(),
  validate,
], async (req, res, next) => {
  try {
    const { name, meal_type, ingredients, description } = req.body;
    const normalizedIngredients = ingredients.map(i => i.trim().toLowerCase());
    const result = await pool.query(
      'INSERT INTO meals (name, meal_type, ingredients, description, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, meal_type, normalizedIngredients, description || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/meals/:id
router.put('/:id', adminOnly, param('id').matches(/^[a-zA-Z0-9-]{36}$/), [
  body('name').optional().trim().notEmpty(),
  body('meal_type').optional().isIn(['breakfast', 'lunch', 'snack', 'dinner']),
  body('ingredients').optional().isArray({ min: 1 }),
  body('description').optional().trim(),
  validate,
], async (req, res, next) => {
  try {
    const fields = ['name', 'meal_type', 'ingredients', 'description'];
    const updates = []; const values = []; let idx = 1;
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(f === 'ingredients' ? req.body[f].map(i => i.trim().toLowerCase()) : req.body[f]);
      }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE meals SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Meal not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/meals/:id
router.delete('/:id', adminOnly, param('id').matches(/^[a-zA-Z0-9-]{36}$/), validate, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM meals WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Meal not found' });
    res.json({ message: 'Meal deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
