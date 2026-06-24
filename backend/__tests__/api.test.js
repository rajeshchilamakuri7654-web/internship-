// API Integration Tests - require a test database
// Run with: npm test
// Set TEST_DATABASE_URL in .env.test for isolated testing

const request = require('supertest');
const app = require('../server');

// Mock DB for testing without live DB
jest.mock('../models/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require('../models/db');

describe('Auth API', () => {
  test('POST /api/auth/login - rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login - rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login - returns 401 for non-existent user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('Children API - Auth Guard', () => {
  test('GET /api/children - requires authentication', async () => {
    const res = await request(app).get('/api/children');
    expect(res.status).toBe(401);
  });

  test('POST /api/children - requires authentication', async () => {
    const res = await request(app)
      .post('/api/children')
      .send({ name: 'Test Child', age: 4 });
    expect(res.status).toBe(401);
  });
});

describe('Meals API - Auth Guard', () => {
  test('GET /api/meals - requires authentication', async () => {
    const res = await request(app).get('/api/meals');
    expect(res.status).toBe(401);
  });
});

describe('Dashboard API - Auth Guard', () => {
  test('GET /api/dashboard - requires authentication', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });
});

describe('Health Check', () => {
  test('GET /health - returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
