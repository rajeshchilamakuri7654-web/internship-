const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalChildren,
      childrenWithAllergies,
      highRiskChildren,
      todayMeals,
      recentAlerts,
      allergyDistribution,
      classroomStats,
      recentActivity,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM children'),
      pool.query("SELECT COUNT(DISTINCT child_id) FROM allergies WHERE type = 'food'"),
      pool.query("SELECT COUNT(*) FROM children WHERE risk_level = 'high'"),
      pool.query(`
        SELECT ma.*, m.name AS meal_name, m.meal_type, cl.name AS classroom_name
        FROM meal_assignments ma
        JOIN meals m ON ma.meal_id = m.id
        LEFT JOIN classrooms cl ON ma.classroom_id = cl.id
        WHERE ma.assigned_date = $1
        ORDER BY ma.created_at DESC
      `, [today]),
      pool.query(`
        SELECT al.*, c.name AS child_name
        FROM alerts al LEFT JOIN children c ON al.child_id = c.id
        WHERE al.is_read = false
        ORDER BY al.created_at DESC LIMIT 5
      `),
      pool.query(`
        SELECT severity, COUNT(*) as count
        FROM allergies WHERE type = 'food'
        GROUP BY severity
      `),
      pool.query(`
        SELECT cl.name, COUNT(c.id) as child_count,
          COUNT(DISTINCT a.child_id) as allergic_count
        FROM classrooms cl
        LEFT JOIN children c ON c.classroom_id = cl.id
        LEFT JOIN allergies a ON a.child_id = c.id AND a.type = 'food'
        GROUP BY cl.id, cl.name
      `),
      pool.query(`
        SELECT 'alert' AS activity_type, title AS description, created_at
        FROM alerts ORDER BY created_at DESC LIMIT 5
      `),
    ]);

    res.json({
      stats: {
        total_children: parseInt(totalChildren.rows[0].count),
        children_with_allergies: parseInt(childrenWithAllergies.rows[0].count),
        high_risk_children: parseInt(highRiskChildren.rows[0].count),
        today_meals: todayMeals.rows.length,
        unread_alerts: recentAlerts.rows.length,
      },
      today_meals: todayMeals.rows,
      recent_alerts: recentAlerts.rows,
      allergy_distribution: allergyDistribution.rows,
      classroom_stats: classroomStats.rows,
      recent_activity: recentActivity.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
