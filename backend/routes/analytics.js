const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/analytics — allergen distribution + classroom breakdown
router.get('/', async (req, res, next) => {
  try {
    const [allergenDist, classroomDist, allergyTotal] = await Promise.all([
      pool.query(`SELECT name, COUNT(*) as count FROM allergies WHERE type = 'food' GROUP BY name ORDER BY count DESC`),
      pool.query(`SELECT cl.name, COUNT(c.id) as child_count,
          COUNT(DISTINCT a.child_id) as allergic_count
        FROM classrooms cl
        LEFT JOIN children c ON c.classroom_id = cl.id
        LEFT JOIN allergies a ON a.child_id = c.id AND a.type = 'food'
        GROUP BY cl.id, cl.name`),
      pool.query(`SELECT COUNT(*) as total FROM allergies WHERE type = 'food'`),
    ]);

    const total = parseInt(allergyTotal.rows[0]?.total || 0);
    const allergens = allergenDist.rows.map(r => ({
      name: r.name,
      count: parseInt(r.count),
      percentage: total > 0 ? Math.round((parseInt(r.count) / total) * 100) : 0,
    }));

    res.json({
      allergen_distribution: allergens,
      classroom_distribution: classroomDist.rows,
      total_allergy_records: total,
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/trends — monthly enrollment + alert severity breakdown
router.get('/trends', async (req, res, next) => {
  try {
    const [enrollment, alertSeverity] = await Promise.all([
      pool.query(`SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count FROM children GROUP BY month ORDER BY month`),
      pool.query(`SELECT severity, COUNT(*) as count FROM alerts WHERE created_at >= $1 GROUP BY severity`,
        [new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()]),
    ]);

    res.json({
      monthly_enrollment: enrollment.rows,
      alert_severity: alertSeverity.rows,
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/weekly-safety — meal safety summary for current week
router.get('/weekly-safety', async (req, res, next) => {
  try {
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const startStr = monday.toISOString().split('T')[0];
    const endStr = friday.toISOString().split('T')[0];

    const [assignments, blockedCount, recentAlerts] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total_assignments FROM meal_assignments WHERE assigned_date >= $1 AND assigned_date <= $2`, [startStr, endStr]),
      pool.query(`SELECT COUNT(*) as blocked_count FROM alerts WHERE type = 'blocked' AND created_at >= $1`, [monday.toISOString()]),
      pool.query(`SELECT al.*, c.name AS child_name FROM alerts al LEFT JOIN children c ON al.child_id = c.id WHERE al.created_at >= $1 ORDER BY al.created_at DESC LIMIT 20`, [monday.toISOString()]),
    ]);

    const total = parseInt(assignments.rows[0]?.total_assignments || 0);
    const blocked = parseInt(blockedCount.rows[0]?.blocked_count || 0);
    const warnings = recentAlerts.rows.filter(a => a.type === 'warning').length;

    res.json({
      week_start: startStr,
      week_end: endStr,
      total_assignments: total,
      blocked_meals: blocked,
      warning_meals: warnings,
      safe_meals: Math.max(0, total - blocked),
      recent_alerts: recentAlerts.rows.slice(0, 10),
    });
  } catch (err) { next(err); }
});

module.exports = router;
