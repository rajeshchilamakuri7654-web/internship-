import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if it's not in static mock mode
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Client-Side Mock Database Fallback (for static hosting like GitHub Pages)
const getInitialState = () => ({
  users: [
    { id: '1111', name: 'Sarah Johnson', email: 'admin@daycare.com', role: 'admin' },
    { id: '2222', name: 'Michael Chen', email: 'teacher@daycare.com', role: 'teacher' },
    { id: '4444', name: 'Lisa Williams', email: 'parent@daycare.com', role: 'parent' },
  ],
  classrooms: [
    { id: 'c1', name: 'Sunflower Room' },
    { id: 'c2', name: 'Rainbow Room' },
    { id: 'c3', name: 'Star Room' },
  ],
  children: [
    { id: 'ch1', name: 'Emma Williams', age: 4, gender: 'female', classroom_name: 'Sunflower Room', parent_name: 'Lisa Williams', parent_contact: '+1-555-0101', notes: 'Very active child. Loves art.', risk_level: 'high', allergies: [{ id: 'a1', allergen_name: 'Peanuts', severity: 'high', symptoms: 'Anaphylaxis, hives', notes: 'Carries EpiPen.' }] },
    { id: 'ch2', name: 'Lucas Brown', age: 3, gender: 'male', classroom_name: 'Sunflower Room', parent_name: 'James Brown', parent_contact: '+1-555-0102', notes: 'Shy at first.', risk_level: 'medium', allergies: [{ id: 'a2', allergen_name: 'Dairy', severity: 'medium', symptoms: 'Stomach pain', notes: 'Lactose intolerant.' }] },
    { id: 'ch3', name: 'Olivia Davis', age: 5, gender: 'female', classroom_name: 'Rainbow Room', parent_name: 'Karen Davis', parent_contact: '+1-555-0103', notes: 'Loves reading.', risk_level: 'low', allergies: [] },
  ],
  meals: [
    { id: 'm1', name: 'Peanut Butter Sandwich', meal_type: 'lunch', ingredients: 'bread, peanut butter, jelly', description: 'Classic PB&J' },
    { id: 'm2', name: 'Mac and Cheese', meal_type: 'lunch', ingredients: 'macaroni, cheddar cheese, milk', description: 'Creamy mac and cheese' },
    { id: 'm3', name: 'Fresh Fruit Salad', meal_type: 'snack', ingredients: 'apple, banana, grapes', description: 'Mixed fruits' },
  ],
  meal_assignments: [
    { id: 'ma1', meal_id: 'm3', meal_name: 'Fresh Fruit Salad', meal_type: 'snack', classroom_id: 'c1', classroom_name: 'Sunflower Room', assigned_date: new Date().toISOString().split('T')[0] },
    { id: 'ma2', meal_id: 'm2', meal_name: 'Mac and Cheese', meal_type: 'lunch', classroom_id: 'c1', classroom_name: 'Sunflower Room', assigned_date: new Date().toISOString().split('T')[0] },
  ],
  alerts: [
    { id: 'al1', title: 'Peanut Warning for Emma Williams', severity: 'high', type: 'blocked', child_name: 'Emma Williams', classroom_name: 'Sunflower Room', created_at: new Date().toISOString(), is_read: false },
  ],
  notifications: [
    { id: 'n1', title: 'Welcome to AllergyGuard', message: 'Safety first!', created_at: new Date().toISOString(), is_read: false },
  ],
  approval_requests: []
});

const getDb = () => {
  const db = localStorage.getItem('allergyguard_db');
  if (!db) {
    const initial = getInitialState();
    localStorage.setItem('allergyguard_db', JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(db);
};

const saveDb = (state: any) => {
  localStorage.setItem('allergyguard_db', JSON.stringify(state));
};

const handleMockRequest = async (config: any) => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const data = config.data ? JSON.parse(config.data) : null;
  const db = getDb();

  let responseData: any = null;
  let status = 200;

  if (url.includes('/auth/login')) {
    const { email, password } = data || {};
    if (email === 'admin@daycare.com' && password === 'admin123') {
      responseData = { token: 'mock-jwt-token-admin', user: { id: '1111', name: 'Sarah Johnson', email: 'admin@daycare.com', role: 'admin' } };
    } else if (email === 'teacher@daycare.com' && password === 'admin123') {
      responseData = { token: 'mock-jwt-token-teacher', user: { id: '2222', name: 'Michael Chen', email: 'teacher@daycare.com', role: 'teacher' } };
    } else if (email === 'parent@daycare.com' && password === 'admin123') {
      responseData = { token: 'mock-jwt-token-parent', user: { id: '4444', name: 'Lisa Williams', email: 'parent@daycare.com', role: 'parent' } };
    } else {
      status = 401;
      responseData = { error: 'Invalid email or password' };
    }
  }

  else if (url.includes('/dashboard')) {
    responseData = {
      stats: {
        total_children: db.children.length,
        allergic_children: db.children.filter((c: any) => c.allergies?.length > 0).length,
        active_alerts: db.alerts.filter((a: any) => !a.is_read).length,
        safety_score: 98,
      },
      allergy_distribution: [
        { severity: 'high', count: db.children.filter((c: any) => c.risk_level === 'high').length },
        { severity: 'medium', count: db.children.filter((c: any) => c.risk_level === 'medium').length },
        { severity: 'low', count: db.children.filter((c: any) => c.risk_level === 'low').length },
      ],
      classroom_stats: db.classrooms.map((cls: any) => ({
        name: cls.name,
        child_count: db.children.filter((c: any) => c.classroom_name === cls.name).length,
        allergic_count: db.children.filter((c: any) => c.classroom_name === cls.name && c.allergies?.length > 0).length,
      }))
    };
  }

  else if (url.includes('/children')) {
    if (method === 'get') {
      responseData = db.children;
    } else if (method === 'post') {
      const newChild = {
        id: 'ch_' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        age: parseInt(data.age),
        gender: data.gender,
        classroom_name: db.classrooms.find((c: any) => c.id === data.classroom_id)?.name || 'Sunflower Room',
        parent_name: data.parent_name,
        parent_contact: data.parent_contact,
        notes: data.notes,
        risk_level: data.risk_level || 'low',
        allergies: []
      };
      db.children.push(newChild);
      saveDb(db);
      responseData = newChild;
    }
  }

  else if (url.includes('/meals')) {
    if (method === 'get') {
      responseData = db.meals;
    } else if (method === 'post') {
      const newMeal = {
        id: 'm_' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        meal_type: data.meal_type,
        ingredients: data.ingredients,
        description: data.description
      };
      db.meals.push(newMeal);
      saveDb(db);
      responseData = newMeal;
    }
  }

  else if (url.includes('/meal-assignments')) {
    if (method === 'get') {
      responseData = db.meal_assignments;
    } else if (method === 'post') {
      const meal = db.meals.find((m: any) => m.id === data.meal_id);
      const classroom = db.classrooms.find((c: any) => c.id === data.classroom_id);
      const newAssignment = {
        id: 'ma_' + Math.random().toString(36).substr(2, 9),
        meal_id: data.meal_id,
        meal_name: meal?.name || 'Meal',
        meal_type: meal?.meal_type || 'lunch',
        classroom_id: data.classroom_id,
        classroom_name: classroom?.name || 'Sunflower Room',
        assigned_date: data.assigned_date
      };

      // Auto-trigger alerts if there are allergen conflicts!
      const allergicChildren = db.children.filter((c: any) => c.classroom_name === classroom?.name && c.allergies?.length > 0);
      allergicChildren.forEach((child: any) => {
        child.allergies.forEach((allg: any) => {
          if (meal?.ingredients?.toLowerCase().includes(allg.allergen_name.toLowerCase())) {
            const newAlert = {
              id: 'al_' + Math.random().toString(36).substr(2, 9),
              title: `${allg.allergen_name} Warning for ${child.name}`,
              severity: allg.severity,
              type: allg.severity === 'high' ? 'blocked' : 'warning',
              child_name: child.name,
              classroom_name: classroom?.name || 'Sunflower Room',
              created_at: new Date().toISOString(),
              is_read: false
            };
            db.alerts.unshift(newAlert);
          }
        });
      });

      db.meal_assignments.push(newAssignment);
      saveDb(db);
      responseData = newAssignment;
    }
  }

  else if (url.includes('/alerts/daily-summary')) {
    responseData = {
      total: db.alerts.length,
      blocked: db.alerts.filter((a: any) => a.type === 'blocked').length,
      warnings: db.alerts.filter((a: any) => a.type === 'warning').length,
      by_severity: [
        { type: 'blocked', severity: 'high', count: db.alerts.filter((a: any) => a.severity === 'high').length },
        { type: 'warning', severity: 'medium', count: db.alerts.filter((a: any) => a.severity === 'medium').length }
      ]
    };
  }

  else if (url.includes('/alerts')) {
    if (method === 'get') {
      responseData = db.alerts;
    }
  }

  else if (url.includes('/classrooms')) {
    responseData = db.classrooms;
  }

  else if (url.includes('/notifications')) {
    responseData = db.notifications;
  }

  else if (url.includes('/analytics')) {
    responseData = {
      total_allergy_records: db.children.reduce((acc: number, c: any) => acc + (c.allergies?.length || 0), 0),
      allergen_distribution: [
        { name: 'Peanuts', percentage: 40, count: 2 },
        { name: 'Dairy', percentage: 20, count: 1 },
        { name: 'Eggs', percentage: 20, count: 1 }
      ],
      classroom_distribution: db.classrooms.map((c: any) => ({
        name: c.name,
        child_count: db.children.filter((ch: any) => ch.classroom_name === c.name).length,
        allergic_count: db.children.filter((ch: any) => ch.classroom_name === c.name && ch.allergies?.length > 0).length
      }))
    };
  }

  else if (url.includes('/parent/my-child')) {
    responseData = {
      child: db.children[0]
    };
  }

  else if (url.includes('/parent/approval-requests/')) {
    if (method === 'patch') {
      const parts = url.split('/');
      const reqId = parts[parts.length - 1] || parts[parts.length - 2];
      const req = db.approval_requests.find((r: any) => r.id === reqId);
      if (req) {
        req.status = data.status;
        req.reviewed_at = new Date().toISOString();
        if (data.status === 'approved') {
          const child = db.children.find((c: any) => c.id === req.child_id);
          if (child) {
            child.allergies.push({
              id: 'a_' + Math.random().toString(36).substr(2, 9),
              allergen_name: req.allergy_name,
              severity: req.severity,
              symptoms: req.symptoms,
              notes: req.notes
            });
            child.risk_level = req.severity;
          }
        }
        saveDb(db);
      }
      responseData = req;
    }
  }

  else if (url.includes('/parent/approval-requests')) {
    if (method === 'get') {
      responseData = db.approval_requests;
    }
  }

  else if (url.includes('/parent/allergy-request')) {
    const newReq = {
      id: 'req_' + Math.random().toString(36).substr(2, 9),
      child_id: 'ch1',
      parent_id: '4444',
      allergy_name: data.allergy_name,
      severity: data.severity,
      symptoms: data.symptoms,
      notes: data.notes,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    db.approval_requests.push(newReq);
    saveDb(db);
    responseData = newReq;
  }

  return {
    data: responseData,
    status: status,
    statusText: status === 200 ? 'OK' : 'Unauthorized',
    headers: {},
    config,
    request: {}
  };
};

// Override the Axios default adapter to execute static mocks on static hosting
const defaultAdapter = api.defaults.adapter;

api.defaults.adapter = async (config) => {
  const isStaticDeploy = window.location.hostname.includes('github.io') || 
                         window.location.hostname.includes('vercel.app') || 
                         window.location.hostname.includes('netlify.app') ||
                         window.location.search.includes('mock=true');

  if (isStaticDeploy && !import.meta.env.VITE_API_URL) {
    return handleMockRequest(config);
  }

  if (typeof defaultAdapter === 'function') {
    return defaultAdapter(config);
  }

  if (Array.isArray(defaultAdapter)) {
    const resolvedAdapter = (axios as any).getAdapter(config.adapter || api.defaults.adapter);
    return resolvedAdapter(config);
  }

  const xhrAdapter = (axios as any).defaults.adapter;
  if (typeof xhrAdapter === 'function') {
    return xhrAdapter(config);
  }

  throw new Error('No default adapter found in Axios');
};

export default api;
