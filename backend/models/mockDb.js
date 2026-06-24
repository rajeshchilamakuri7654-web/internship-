const crypto = require('crypto');

// In-Memory Database State
const state = {
  users: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Sarah Johnson',
      email: 'admin@daycare.com',
      password_hash: '$2a$12$yELkSiRmuBNNpqJzRBMb3u8Wct9x1GviqiFT6gJL.46u0H87YN4RK', // password: admin123
      role: 'admin',
      created_at: new Date('2026-01-01T00:00:00Z')
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Michael Chen',
      email: 'teacher@daycare.com',
      password_hash: '$2a$12$yELkSiRmuBNNpqJzRBMb3u8Wct9x1GviqiFT6gJL.46u0H87YN4RK', // password: admin123
      role: 'teacher',
      created_at: new Date('2026-01-01T00:00:00Z')
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Rajesh Chilamakuri',
      email: 'rajeshchilamakuri7654@gmail.com',
      password_hash: '$2a$12$7D2qKwz1LXCNZGJ/x4zmB.M8.jb0F4UhVnGBRvSKJizTdLYmyGEqG', // password: 121212
      role: 'admin',
      created_at: new Date('2026-06-17T00:00:00Z')
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Lisa Williams',
      email: 'parent@daycare.com',
      password_hash: '$2a$12$yELkSiRmuBNNpqJzRBMb3u8Wct9x1GviqiFT6gJL.46u0H87YN4RK', // password: admin123
      role: 'parent',
      created_at: new Date('2026-01-01T00:00:00Z')
    }
  ],
  classrooms: [
    { id: 'aaaa0000-0000-0000-0000-000000000001', name: 'Sunflower Room', teacher_id: '22222222-2222-2222-2222-222222222222' },
    { id: 'aaaa0000-0000-0000-0000-000000000002', name: 'Rainbow Room', teacher_id: '22222222-2222-2222-2222-222222222222' },
    { id: 'aaaa0000-0000-0000-0000-000000000003', name: 'Star Room', teacher_id: '22222222-2222-2222-2222-222222222222' }
  ],
  children: [
    { id: 'cccc0000-0000-0000-0000-000000000001', name: 'Emma Williams', age: 4, gender: 'female', classroom_id: 'aaaa0000-0000-0000-0000-000000000001', parent_name: 'Lisa Williams', parent_contact: '+1-555-0101', notes: 'Very active child. Loves art.', risk_level: 'high', created_at: new Date('2026-06-01T08:00:00Z') },
    { id: 'cccc0000-0000-0000-0000-000000000002', name: 'Lucas Brown', age: 3, gender: 'male', classroom_id: 'aaaa0000-0000-0000-0000-000000000001', parent_name: 'James Brown', parent_contact: '+1-555-0102', notes: 'Shy at first, warms up quickly.', risk_level: 'medium', created_at: new Date('2026-06-02T09:30:00Z') },
    { id: 'cccc0000-0000-0000-0000-000000000003', name: 'Olivia Davis', age: 5, gender: 'female', classroom_id: 'aaaa0000-0000-0000-0000-000000000002', parent_name: 'Karen Davis', parent_contact: '+1-555-0103', notes: 'Loves reading and singing.', risk_level: 'low', created_at: new Date('2026-06-03T10:00:00Z') },
    { id: 'cccc0000-0000-0000-0000-000000000004', name: 'Noah Martinez', age: 4, gender: 'male', classroom_id: 'aaaa0000-0000-0000-0000-000000000002', parent_name: 'Carlos Martinez', parent_contact: '+1-555-0104', notes: 'Very energetic. Needs extra supervision during meals.', risk_level: 'high', created_at: new Date('2026-06-04T11:00:00Z') },
    { id: 'cccc0000-0000-0000-0000-000000000005', name: 'Ava Wilson', age: 3, gender: 'female', classroom_id: 'aaaa0000-0000-0000-0000-000000000003', parent_name: 'Susan Wilson', parent_contact: '+1-555-0105', notes: 'Picky eater but loves fruits.', risk_level: 'medium', created_at: new Date('2026-06-05T14:00:00Z') },
    { id: 'cccc0000-0000-0000-0000-000000000006', name: 'Ethan Taylor', age: 5, gender: 'male', classroom_id: 'aaaa0000-0000-0000-0000-000000000003', parent_name: 'Robert Taylor', parent_contact: '+1-555-0106', notes: 'No known health issues.', risk_level: 'low', created_at: new Date('2026-06-06T15:30:00Z') }
  ],
  allergies: [
    { id: 'a1', child_id: 'cccc0000-0000-0000-0000-000000000001', type: 'food', name: 'Peanuts', severity: 'high', symptoms: 'Anaphylaxis, hives, difficulty breathing', notes: 'Carries EpiPen. Do NOT serve any peanut products.', created_at: new Date() },
    { id: 'a2', child_id: 'cccc0000-0000-0000-0000-000000000001', type: 'food', name: 'Tree Nuts', severity: 'high', symptoms: 'Hives, swelling', notes: 'Avoid all tree nuts including cashews, almonds, walnuts.', created_at: new Date() },
    { id: 'a3', child_id: 'cccc0000-0000-0000-0000-000000000002', type: 'food', name: 'Dairy', severity: 'medium', symptoms: 'Stomach pain, bloating, diarrhea', notes: 'Lactose intolerant. Use dairy-free alternatives.', created_at: new Date() },
    { id: 'a4', child_id: 'cccc0000-0000-0000-0000-000000000002', type: 'environmental', name: 'Pollen', severity: 'low', symptoms: 'Sneezing, runny nose', notes: 'Antihistamine as needed.', created_at: new Date() },
    { id: 'a5', child_id: 'cccc0000-0000-0000-0000-000000000004', type: 'food', name: 'Shellfish', severity: 'high', symptoms: 'Hives, vomiting, anaphylaxis', notes: 'EpiPen required. No seafood of any kind.', created_at: new Date() },
    { id: 'a6', child_id: 'cccc0000-0000-0000-0000-000000000004', type: 'food', name: 'Gluten', severity: 'medium', symptoms: 'Stomach cramps, bloating', notes: 'Celiac disease. Strict gluten-free diet required.', created_at: new Date() },
    { id: 'a7', child_id: 'cccc0000-0000-0000-0000-000000000005', type: 'food', name: 'Eggs', severity: 'medium', symptoms: 'Hives, stomach upset', notes: 'Avoid eggs in all forms.', created_at: new Date() },
    { id: 'a8', child_id: 'cccc0000-0000-0000-0000-000000000005', type: 'medicine', name: 'Penicillin', severity: 'high', symptoms: 'Severe rash, anaphylaxis', notes: 'Must notify doctor before any medication.', created_at: new Date() },
    { id: 'a9', child_id: 'cccc0000-0000-0000-0000-000000000001', type: 'medicine', name: 'Aspirin', severity: 'medium', symptoms: 'Rash, wheezing', notes: 'Use paracetamol instead.', created_at: new Date() }
  ],
  emergency_contacts: [
    { id: 'ec1', child_id: 'cccc0000-0000-0000-0000-000000000001', name: 'Lisa Williams', relationship: 'Mother', phone: '+1-555-0101', email: 'lisa.w@email.com', is_primary: true, medical_notes: 'EpiPen location: red bag in childs cubby. Call 911 first then parent.', created_at: new Date() },
    { id: 'ec2', child_id: 'cccc0000-0000-0000-0000-000000000001', name: 'David Williams', relationship: 'Father', phone: '+1-555-0111', email: 'david.w@email.com', is_primary: false, medical_notes: null, created_at: new Date() },
    { id: 'ec3', child_id: 'cccc0000-0000-0000-0000-000000000002', name: 'James Brown', relationship: 'Father', phone: '+1-555-0102', email: 'james.b@email.com', is_primary: true, medical_notes: 'Lactase drops in lunch bag if needed.', created_at: new Date() },
    { id: 'ec4', child_id: 'cccc0000-0000-0000-0000-000000000004', name: 'Carlos Martinez', relationship: 'Father', phone: '+1-555-0104', email: 'carlos.m@email.com', is_primary: true, medical_notes: 'EpiPen in blue pouch. Child is aware of his allergy.', created_at: new Date() },
    { id: 'ec5', child_id: 'cccc0000-0000-0000-0000-000000000005', name: 'Susan Wilson', relationship: 'Mother', phone: '+1-555-0105', email: 'susan.w@email.com', is_primary: true, medical_notes: 'No eggs in any form.', created_at: new Date() },
    { id: 'ec6', child_id: 'cccc0000-0000-0000-0000-000000000003', name: 'Karen Davis', relationship: 'Mother', phone: '+1-555-0103', email: 'karen.d@email.com', is_primary: true, medical_notes: null, created_at: new Date() },
    { id: 'ec7', child_id: 'cccc0000-0000-0000-0000-000000000006', name: 'Robert Taylor', relationship: 'Father', phone: '+1-555-0106', email: 'robert.t@email.com', is_primary: true, medical_notes: null, created_at: new Date() }
  ],
  medicines: [
    { id: 'm1', child_id: 'cccc0000-0000-0000-0000-000000000001', name: 'EpiPen (Epinephrine)', dosage: '0.15mg', frequency: 'Emergency use only', notes: 'Stored in red bag in cubby. Use immediately if anaphylaxis suspected.', created_at: new Date() },
    { id: 'm2', child_id: 'cccc0000-0000-0000-0000-000000000004', name: 'EpiPen (Epinephrine)', dosage: '0.15mg', frequency: 'Emergency use only', notes: 'Stored in blue pouch in teachers desk.', created_at: new Date() },
    { id: 'm3', child_id: 'cccc0000-0000-0000-0000-000000000005', name: 'Antihistamine (Cetirizine)', dosage: '5mg', frequency: 'Once daily if needed', notes: 'Give only if parent notifies staff.', created_at: new Date() }
  ],
  meals: [
    { id: 'mmmm0000-0000-0000-0000-000000000001', name: 'Peanut Butter Sandwich', meal_type: 'lunch', ingredients: ['bread', 'peanut butter', 'jelly'], description: 'Classic PB&J sandwich', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date('2026-06-01T08:00:00Z') },
    { id: 'mmmm0000-0000-0000-0000-000000000002', name: 'Mac and Cheese', meal_type: 'lunch', ingredients: ['macaroni', 'cheddar cheese', 'milk', 'butter', 'flour'], description: 'Creamy macaroni and cheese', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date('2026-06-01T08:01:00Z') },
    { id: 'mmmm0000-0000-0000-0000-000000000003', name: 'Fresh Fruit Salad', meal_type: 'snack', ingredients: ['apple', 'banana', 'grapes', 'orange', 'strawberry'], description: 'Mixed seasonal fruits', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date('2026-06-01T08:02:00Z') },
    { id: 'mmmm0000-0000-0000-0000-000000000004', name: 'Chicken Rice Bowl', meal_type: 'lunch', ingredients: ['chicken breast', 'white rice', 'carrots', 'peas', 'olive oil', 'salt'], description: 'Healthy chicken and rice', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date('2026-06-01T08:03:00Z') },
    { id: 'mmmm0000-0000-0000-0000-000000000005', name: 'Scrambled Eggs with Toast', meal_type: 'breakfast', ingredients: ['eggs', 'butter', 'whole wheat bread', 'salt', 'pepper'], description: 'Fluffy scrambled eggs', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date('2026-06-01T08:04:00Z') },
    { id: 'mmmm0000-0000-0000-0000-000000000006', name: 'Pasta with Tomato Sauce', meal_type: 'lunch', ingredients: ['pasta', 'tomato sauce', 'olive oil', 'garlic', 'basil', 'parmesan cheese'], description: 'Simple pasta marinara', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date('2026-06-01T08:05:00Z') },
    { id: 'mmmm0000-0000-0000-0000-000000000007', name: 'Veggie Wrap', meal_type: 'lunch', ingredients: ['whole wheat tortilla', 'lettuce', 'tomato', 'cucumber', 'hummus', 'bell pepper'], description: 'Fresh veggie wrap with hummus', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date('2026-06-01T08:06:00Z') },
    { id: 'mmmm0000-0000-0000-0000-000000000008', name: 'Oatmeal with Berries', meal_type: 'breakfast', ingredients: ['oats', 'milk', 'blueberries', 'honey', 'cinnamon'], description: 'Warm oatmeal with fresh berries', created_by: '11111111-1111-1111-1111-111111111111', created_at: new Date('2026-06-01T08:07:00Z') }
  ],
  meal_assignments: [
    { id: 'ma1', meal_id: 'mmmm0000-0000-0000-0000-000000000003', classroom_id: 'aaaa0000-0000-0000-0000-000000000001', assigned_date: new Date().toISOString().split('T')[0], assigned_by: '11111111-1111-1111-1111-111111111111', notes: 'Morning snack', created_at: new Date() },
    { id: 'ma2', meal_id: 'mmmm0000-0000-0000-0000-000000000004', classroom_id: 'aaaa0000-0000-0000-0000-000000000001', assigned_date: new Date().toISOString().split('T')[0], assigned_by: '11111111-1111-1111-1111-111111111111', notes: 'Lunch', created_at: new Date() },
    { id: 'ma3', meal_id: 'mmmm0000-0000-0000-0000-000000000005', classroom_id: 'aaaa0000-0000-0000-0000-000000000002', assigned_date: new Date().toISOString().split('T')[0], assigned_by: '11111111-1111-1111-1111-111111111111', notes: 'Breakfast', created_at: new Date() },
    { id: 'ma4', meal_id: 'mmmm0000-0000-0000-0000-000000000007', classroom_id: 'aaaa0000-0000-0000-0000-000000000003', assigned_date: new Date().toISOString().split('T')[0], assigned_by: '11111111-1111-1111-1111-111111111111', notes: 'Lunch', created_at: new Date() }
  ],
  alerts: [],
  notifications: [],
  parent_child_links: [
    { id: 'pcl1', parent_id: '44444444-4444-4444-4444-444444444444', child_id: 'cccc0000-0000-0000-0000-000000000001', created_at: new Date() }
  ],
  approval_requests: []
};

// Initial alerts generation for seed assignments
(() => {
  const { checkMealSafety } = require('../utils/allergyEngine');
  state.meal_assignments.forEach(ma => {
    const meal = state.meals.find(m => m.id === ma.meal_id);
    const childrenInClass = state.children.filter(c => c.classroom_id === ma.classroom_id);
    childrenInClass.forEach(child => {
      const childAllergies = state.allergies.filter(a => a.child_id === child.id && a.type === 'food');
      const safety = checkMealSafety(meal.ingredients, childAllergies);
      if (safety.status !== 'safe') {
        state.alerts.push({
          id: crypto.randomUUID(),
          child_id: child.id,
          meal_assignment_id: ma.id,
          type: safety.status === 'blocked' ? 'blocked' : 'warning',
          title: safety.status === 'blocked'
            ? `⛔ BLOCKED: ${meal.name} is unsafe for ${child.name}`
            : `⚠️ WARNING: ${meal.name} may affect ${child.name}`,
          message: safety.notes,
          severity: safety.status === 'blocked' ? 'high' : 'medium',
          is_read: false,
          created_at: new Date()
        });
      }
    });
  });
})();

// Helper to filter children
function filterChildren(params, hasSearch, hasClassroom, hasRisk) {
  let list = [...state.children];
  let pIdx = 0;
  if (hasSearch) {
    const rawSearch = params[pIdx++];
    const s = (rawSearch ? rawSearch.replace(/%/g, '') : '').toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(s) || (c.parent_name && c.parent_name.toLowerCase().includes(s)));
  }
  if (hasClassroom) {
    const cid = params[pIdx++];
    list = list.filter(c => c.classroom_id === cid);
  }
  if (hasRisk) {
    const rl = params[pIdx++];
    list = list.filter(c => c.risk_level === rl);
  }
  return list;
}

// In-Memory pool query implementation
async function query(text, params = []) {
  const normalizedSql = text.replace(/\s+/g, ' ').trim();

  try {
    // ----------------------------------------------------
    // USERS QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT \* FROM users WHERE email = \$1/i)) {
      const email = params[0] ? params[0].toLowerCase() : '';
      const rows = state.users.filter(u => u.email.toLowerCase() === email);
      return { rows };
    }

    if (normalizedSql.match(/INSERT INTO users \(/i)) {
      const newUser = {
        id: crypto.randomUUID(),
        name: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3],
        created_at: new Date()
      };
      state.users.push(newUser);
      return { rows: [{ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }] };
    }

    if (normalizedSql.match(/SELECT id, name, email, role, created_at FROM users WHERE id = \$1/i)) {
      const rows = state.users.filter(u => u.id === params[0]);
      return { rows };
    }

    // ----------------------------------------------------
    // CHILDREN COUNT & SELECT QUERIES
    // ----------------------------------------------------
    if (normalizedSql.startsWith('SELECT COUNT(*) FROM children c')) {
      const hasSearch = normalizedSql.includes('ILIKE');
      const hasClassroom = normalizedSql.includes('c.classroom_id =');
      const hasRisk = normalizedSql.includes('c.risk_level =');
      const filtered = filterChildren(params, hasSearch, hasClassroom, hasRisk);
      return { rows: [{ count: filtered.length }] };
    }

    if (normalizedSql.includes('SELECT c.*, cl.name AS classroom_name') && normalizedSql.includes('FROM children c')) {
      const hasSearch = normalizedSql.includes('ILIKE');
      const hasClassroom = normalizedSql.split('c.classroom_id =').length > 2;
      const hasRisk = normalizedSql.includes('c.risk_level =');
      let filtered = filterChildren(params, hasSearch, hasClassroom, hasRisk);
      
      // Sort by created_at DESC
      filtered.sort((a, b) => b.created_at - a.created_at);
      
      // Limit and Offset
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      const paginated = (limit !== undefined && offset !== undefined) 
        ? filtered.slice(offset, offset + limit)
        : filtered;

      const rows = paginated.map(c => {
        const classroom = state.classrooms.find(cl => cl.id === c.classroom_id);
        const childAllergies = state.allergies.filter(a => a.child_id === c.id);
        return {
          ...c,
          classroom_name: classroom ? classroom.name : null,
          allergy_count: childAllergies.length,
          allergies: childAllergies.map(a => ({ id: a.id, type: a.type, name: a.name, severity: a.severity }))
        };
      });
      return { rows };
    }

    if (normalizedSql.match(/SELECT c\.\*, cl\.name AS classroom_name FROM children c LEFT JOIN classrooms cl ON c\.classroom_id = cl\.id WHERE c\.id = \$1/i)) {
      const child = state.children.find(c => c.id === params[0]);
      if (!child) return { rows: [] };
      const classroom = state.classrooms.find(cl => cl.id === child.classroom_id);
      return { rows: [{ ...child, classroom_name: classroom ? classroom.name : null }] };
    }

    if (normalizedSql.match(/SELECT COUNT\(\*\) FROM children$/i)) {
      return { rows: [{ count: state.children.length }] };
    }

    if (normalizedSql.match(/SELECT COUNT\(\*\) FROM children WHERE risk_level = 'high'/i)) {
      const count = state.children.filter(c => c.risk_level === 'high').length;
      return { rows: [{ count }] };
    }

    // ----------------------------------------------------
    // ALLERGIES QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT COUNT\(DISTINCT child_id\) FROM allergies/i)) {
      const uniqueChildIds = new Set(state.allergies.filter(a => a.type === 'food').map(a => a.child_id));
      return { rows: [{ count: uniqueChildIds.size }] };
    }

    if (normalizedSql.match(/SELECT \* FROM allergies WHERE child_id = \$1 AND type = 'food'/i)) {
      const rows = state.allergies.filter(a => a.child_id === params[0] && a.type === 'food');
      return { rows };
    }

    if (normalizedSql.match(/SELECT \* FROM allergies WHERE child_id = \$1 ORDER BY severity DESC/i)) {
      const rows = state.allergies
        .filter(a => a.child_id === params[0])
        .sort((a, b) => {
          const severityOrder = { high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        });
      return { rows };
    }

    if (normalizedSql.match(/SELECT MAX\(CASE severity WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END\) as max_sev FROM allergies WHERE child_id = \$1/i)) {
      const childAllergies = state.allergies.filter(a => a.child_id === params[0]);
      let maxSev = 0;
      childAllergies.forEach(a => {
        const val = a.severity === 'high' ? 3 : (a.severity === 'medium' ? 2 : 1);
        if (val > maxSev) maxSev = val;
      });
      return { rows: [{ max_sev: maxSev || null }] };
    }

    if (normalizedSql.match(/SELECT severity, COUNT\(\*\) as count FROM allergies WHERE type = 'food' GROUP BY severity/i)) {
      const counts = { low: 0, medium: 0, high: 0 };
      state.allergies.filter(a => a.type === 'food').forEach(a => {
        if (counts[a.severity] !== undefined) counts[a.severity]++;
      });
      const rows = Object.keys(counts).map(sev => ({ severity: sev, count: counts[sev].toString() }));
      return { rows };
    }

    // ----------------------------------------------------
    // EMERGENCY CONTACTS & MEDICINES & ALERTS (BY CHILD)
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT \* FROM emergency_contacts WHERE child_id = \$1 ORDER BY is_primary DESC/i)) {
      const rows = state.emergency_contacts
        .filter(ec => ec.child_id === params[0])
        .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      return { rows };
    }

    if (normalizedSql.match(/SELECT \* FROM medicines WHERE child_id = \$1/i)) {
      const rows = state.medicines.filter(m => m.child_id === params[0]);
      return { rows };
    }

    if (normalizedSql.match(/SELECT \* FROM alerts WHERE child_id = \$1 ORDER BY created_at DESC LIMIT 10/i)) {
      const rows = state.alerts
        .filter(a => a.child_id === params[0])
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 10);
      return { rows };
    }

    // ----------------------------------------------------
    // CHILDREN CRUD QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/INSERT INTO children/i)) {
      const newChild = {
        id: crypto.randomUUID(),
        name: params[0],
        age: params[1],
        gender: params[2],
        classroom_id: params[3],
        parent_name: params[4],
        parent_contact: params[5],
        notes: params[6],
        risk_level: params[7] || 'low',
        created_at: new Date()
      };
      state.children.push(newChild);
      return { rows: [newChild] };
    }

    if (normalizedSql.startsWith('UPDATE children SET')) {
      const setClause = normalizedSql.split(/SET/i)[1].split(/WHERE/i)[0];
      const updateFields = setClause.split(',').map(part => part.split('=')[0].trim());
      const idParam = params[params.length - 1];
      const child = state.children.find(c => c.id === idParam);
      if (!child) return { rows: [] };
      updateFields.forEach((field, i) => {
        child[field] = params[i];
      });
      return { rows: [child] };
    }

    if (normalizedSql.match(/UPDATE children SET risk_level = \$1 WHERE id = \$2/i)) {
      const child = state.children.find(c => c.id === params[1]);
      if (child) child.risk_level = params[0];
      return { rows: child ? [child] : [] };
    }

    if (normalizedSql.match(/DELETE FROM children WHERE id = \$1 RETURNING id/i)) {
      const id = params[0];
      const idx = state.children.findIndex(c => c.id === id);
      if (idx === -1) return { rows: [] };
      const deleted = state.children.splice(idx, 1)[0];
      state.allergies = state.allergies.filter(a => a.child_id !== id);
      state.emergency_contacts = state.emergency_contacts.filter(ec => ec.child_id !== id);
      state.medicines = state.medicines.filter(m => m.child_id !== id);
      return { rows: [{ id: deleted.id }] };
    }

    // ----------------------------------------------------
    // ALLERGIES CRUD QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/INSERT INTO allergies/i)) {
      const newAllergy = {
        id: crypto.randomUUID(),
        child_id: params[0],
        type: params[1],
        name: params[2],
        severity: params[3],
        symptoms: params[4],
        notes: params[5],
        created_at: new Date()
      };
      state.allergies.push(newAllergy);
      return { rows: [newAllergy] };
    }

    if (normalizedSql.match(/DELETE FROM allergies WHERE id = \$1 AND child_id = \$2/i)) {
      const id = params[0];
      const childId = params[1];
      state.allergies = state.allergies.filter(a => !(a.id === id && a.child_id === childId));
      return { rows: [] };
    }

    // ----------------------------------------------------
    // EMERGENCY CONTACTS CRUD QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/UPDATE emergency_contacts SET is_primary = false WHERE child_id = \$1/i)) {
      state.emergency_contacts
        .filter(ec => ec.child_id === params[0])
        .forEach(ec => ec.is_primary = false);
      return { rows: [] };
    }

    if (normalizedSql.match(/INSERT INTO emergency_contacts/i)) {
      const newContact = {
        id: crypto.randomUUID(),
        child_id: params[0],
        name: params[1],
        relationship: params[2],
        phone: params[3],
        email: params[4],
        is_primary: params[5],
        medical_notes: params[6],
        created_at: new Date()
      };
      state.emergency_contacts.push(newContact);
      return { rows: [newContact] };
    }

    // ----------------------------------------------------
    // MEALS CRUD QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT m\.\*, u\.name AS created_by_name FROM meals m LEFT JOIN users u ON m\.created_by = u\.id/i)) {
      const rows = [...state.meals]
        .sort((a, b) => b.created_at - a.created_at)
        .map(m => {
          const u = state.users.find(user => user.id === m.created_by);
          return { ...m, created_by_name: u ? u.name : null };
        });
      return { rows };
    }

    if (normalizedSql.match(/SELECT \* FROM meals WHERE id = \$1/i)) {
      const meal = state.meals.find(m => m.id === params[0]);
      return { rows: meal ? [meal] : [] };
    }

    if (normalizedSql.match(/INSERT INTO meals/i)) {
      const newMeal = {
        id: crypto.randomUUID(),
        name: params[0],
        meal_type: params[1],
        ingredients: params[2],
        description: params[3],
        created_by: params[4],
        created_at: new Date()
      };
      state.meals.push(newMeal);
      return { rows: [newMeal] };
    }

    if (normalizedSql.startsWith('UPDATE meals SET')) {
      const setClause = normalizedSql.split(/SET/i)[1].split(/WHERE/i)[0];
      const updateFields = setClause.split(',').map(part => part.split('=')[0].trim());
      const idParam = params[params.length - 1];
      const meal = state.meals.find(m => m.id === idParam);
      if (!meal) return { rows: [] };
      updateFields.forEach((field, i) => {
        meal[field] = params[i];
      });
      return { rows: [meal] };
    }

    if (normalizedSql.match(/DELETE FROM meals WHERE id = \$1 RETURNING id/i)) {
      const id = params[0];
      const idx = state.meals.findIndex(m => m.id === id);
      if (idx === -1) return { rows: [] };
      const deleted = state.meals.splice(idx, 1)[0];
      state.meal_assignments = state.meal_assignments.filter(ma => ma.meal_id !== id);
      return { rows: [{ id: deleted.id }] };
    }

    // ----------------------------------------------------
    // MEAL ASSIGNMENTS QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT c\.id, c\.name, c\.risk_level/i) && normalizedSql.includes('FROM children c LEFT JOIN allergies a')) {
      const cid = params[0];
      const childrenInClass = state.children.filter(c => c.classroom_id === cid);
      const rows = childrenInClass.map(c => {
        const childAllergies = state.allergies.filter(a => a.child_id === c.id && a.type === 'food');
        return {
          id: c.id,
          name: c.name,
          risk_level: c.risk_level,
          allergies: childAllergies.length > 0 ? childAllergies.map(a => ({ name: a.name, severity: a.severity, type: a.type })) : null
        };
      });
      return { rows };
    }

    if (normalizedSql.match(/INSERT INTO meal_assignments/i)) {
      const newAssign = {
        id: crypto.randomUUID(),
        meal_id: params[0],
        classroom_id: params[1],
        assigned_date: params[2] instanceof Date ? params[2].toISOString().split('T')[0] : params[2],
        assigned_by: params[3],
        notes: params[4],
        created_at: new Date()
      };
      state.meal_assignments.push(newAssign);
      return { rows: [newAssign] };
    }

    if (normalizedSql.match(/SELECT ma\.\*, m\.name AS meal_name/i)) {
      let list = [...state.meal_assignments];
      const hasClassroom = normalizedSql.split('ma.classroom_id =').length > 2;
      const hasDate = normalizedSql.includes('ma.assigned_date =');
      let pIdx = 0;
      if (hasClassroom) {
        const cid = params[pIdx++];
        list = list.filter(ma => ma.classroom_id === cid);
      }
      if (hasDate) {
        const d = params[pIdx++];
        list = list.filter(ma => ma.assigned_date === d);
      }

      list.sort((a, b) => {
        if (a.assigned_date !== b.assigned_date) {
          return b.assigned_date.localeCompare(a.assigned_date);
        }
        return b.created_at - a.created_at;
      });

      const limited = list.slice(0, 50);
      const rows = limited.map(ma => {
        const meal = state.meals.find(m => m.id === ma.meal_id);
        const classroom = state.classrooms.find(cl => cl.id === ma.classroom_id);
        const user = state.users.find(u => u.id === ma.assigned_by);
        return {
          ...ma,
          meal_name: meal ? meal.name : null,
          meal_type: meal ? meal.meal_type : null,
          ingredients: meal ? meal.ingredients : [],
          classroom_name: classroom ? classroom.name : null,
          assigned_by_name: user ? user.name : null
        };
      });
      return { rows };
    }

    // ----------------------------------------------------
    // ALERTS & NOTIFICATIONS QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/INSERT INTO alerts/i)) {
      const newAlert = {
        id: crypto.randomUUID(),
        child_id: params[0],
        meal_assignment_id: params[1],
        type: params[2],
        title: params[3],
        message: params[4],
        severity: params[5],
        is_read: false,
        created_at: new Date()
      };
      state.alerts.push(newAlert);
      return { rows: [newAlert] };
    }

    if (normalizedSql.match(/INSERT INTO notifications/i)) {
      const newNotif = {
        id: crypto.randomUUID(),
        user_id: params[0],
        title: params[1],
        message: params[2],
        type: params[3] || 'info',
        is_read: false,
        created_at: new Date()
      };
      state.notifications.push(newNotif);
      return { rows: [newNotif] };
    }

    if (normalizedSql.match(/SELECT al\.\*, c\.name AS child_name FROM alerts al/i)) {
      const list = state.alerts.filter(al => !al.is_read);
      list.sort((a, b) => b.created_at - a.created_at);
      const rows = list.slice(0, 5).map(al => {
        const child = state.children.find(c => c.id === al.child_id);
        return { ...al, child_name: child ? child.name : null };
      });
      return { rows };
    }

    if (normalizedSql.match(/SELECT al\.\*, c\.name AS child_name, c\.classroom_id/i)) {
      let list = [...state.alerts];
      const hasType = normalizedSql.includes('al.type =');
      const hasSeverity = normalizedSql.includes('al.severity =');
      const hasIsRead = normalizedSql.includes('al.is_read =');
      const hasChildId = normalizedSql.split('al.child_id =').length > 2;

      let pIdx = 0;
      if (hasType) {
        const val = params[pIdx++];
        list = list.filter(al => al.type === val);
      }
      if (hasSeverity) {
        const val = params[pIdx++];
        list = list.filter(al => al.severity === val);
      }
      if (hasIsRead) {
        const val = params[pIdx++];
        list = list.filter(al => al.is_read === val);
      }
      if (hasChildId) {
        const val = params[pIdx++];
        list = list.filter(al => al.child_id === val);
      }

      list.sort((a, b) => b.created_at - a.created_at);
      const rows = list.slice(0, 100).map(al => {
        const child = state.children.find(c => c.id === al.child_id);
        const classroom = child ? state.classrooms.find(cl => cl.id === child.classroom_id) : null;
        const ma = state.meal_assignments.find(m => m.id === al.meal_assignment_id);
        const meal = ma ? state.meals.find(m => m.id === ma.meal_id) : null;
        return {
          ...al,
          child_name: child ? child.name : null,
          classroom_id: child ? child.classroom_id : null,
          meal_name: meal ? meal.name : null,
          classroom_name: classroom ? classroom.name : null
        };
      });
      return { rows };
    }

    if (normalizedSql.match(/UPDATE alerts SET is_read = true WHERE id = \$1/i)) {
      const alert = state.alerts.find(al => al.id === params[0]);
      if (alert) alert.is_read = true;
      return { rows: alert ? [alert] : [] };
    }

    if (normalizedSql.match(/UPDATE alerts SET is_read = true WHERE is_read = false/i)) {
      state.alerts.filter(al => !al.is_read).forEach(al => al.is_read = true);
      return { rows: [] };
    }

    if (normalizedSql.match(/SELECT \* FROM notifications WHERE user_id = \$1/i)) {
      const list = state.notifications.filter(n => n.user_id === params[0]);
      list.sort((a, b) => b.created_at - a.created_at);
      return { rows: list.slice(0, 50) };
    }

    if (normalizedSql.match(/UPDATE notifications SET is_read = true WHERE id = \$1 AND user_id = \$2/i)) {
      const notif = state.notifications.find(n => n.id === params[0] && n.user_id === params[1]);
      if (notif) notif.is_read = true;
      return { rows: notif ? [notif] : [] };
    }

    if (normalizedSql.match(/UPDATE notifications SET is_read = true WHERE user_id = \$1 AND is_read = false/i)) {
      state.notifications.filter(n => n.user_id === params[0] && !n.is_read).forEach(n => n.is_read = true);
      return { rows: [] };
    }

    // ----------------------------------------------------
    // ACTIVITY LOG QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT 'alert' AS activity_type/i)) {
      const list = [...state.alerts];
      list.sort((a, b) => b.created_at - a.created_at);
      const rows = list.slice(0, 5).map(al => ({
        activity_type: 'alert',
        description: al.title,
        created_at: al.created_at
      }));
      return { rows };
    }

    // ----------------------------------------------------
    // CLASSROOMS QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT cl\.name, COUNT\(c\.id\) as child_count/i)) {
      const rows = state.classrooms.map(cl => {
        const clChildren = state.children.filter(c => c.classroom_id === cl.id);
        const childIds = clChildren.map(c => c.id);
        const allergicCount = new Set(
          state.allergies
            .filter(a => a.type === 'food' && childIds.includes(a.child_id))
            .map(a => a.child_id)
        ).size;
        return {
          name: cl.name,
          child_count: clChildren.length.toString(),
          allergic_count: allergicCount.toString()
        };
      });
      return { rows };
    }

    if (normalizedSql.match(/SELECT cl\.\*, u\.name AS teacher_name/i)) {
      const rows = state.classrooms.map(cl => {
        const teacher = state.users.find(u => u.id === cl.teacher_id);
        const childCount = state.children.filter(c => c.classroom_id === cl.id).length;
        return {
          ...cl,
          teacher_name: teacher ? teacher.name : null,
          child_count: childCount.toString()
        };
      });
      rows.sort((a, b) => a.name.localeCompare(b.name));
      return { rows };
    }

    // ----------------------------------------------------
    // ANALYTICS QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT name, COUNT\(\*\) as count FROM allergies WHERE type = 'food' GROUP BY name ORDER BY count DESC/i)) {
      const counts = {};
      state.allergies.filter(a => a.type === 'food').forEach(a => { counts[a.name] = (counts[a.name] || 0) + 1; });
      const rows = Object.entries(counts)
        .map(([name, count]) => ({ name, count: String(count) }))
        .sort((a, b) => parseInt(b.count) - parseInt(a.count));
      return { rows };
    }

    if (normalizedSql.match(/SELECT COUNT\(\*\) as total FROM allergies WHERE type = 'food'/i)) {
      const count = state.allergies.filter(a => a.type === 'food').length;
      return { rows: [{ total: count }] };
    }

    if (normalizedSql.match(/SELECT DATE_TRUNC\('month', created_at\) as month, COUNT\(\*\) as count FROM children GROUP BY month ORDER BY month/i)) {
      const counts = {};
      // Generate synthetic historical data for demonstration
      const months = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01'];
      const syntheticCounts = [2, 1, 3, 2, 1, state.children.length];
      const rows = months.map((m, i) => ({ month: new Date(m).toISOString(), count: String(syntheticCounts[i]) }));
      return { rows };
    }

    if (normalizedSql.match(/SELECT severity, COUNT\(\*\) as count FROM alerts WHERE created_at >= \$1 GROUP BY severity/i)) {
      const since = new Date(params[0]);
      const counts = {};
      state.alerts.filter(a => new Date(a.created_at) >= since).forEach(a => {
        counts[a.severity] = (counts[a.severity] || 0) + 1;
      });
      // Add some base counts for demo
      if (!counts.high) counts.high = 3;
      if (!counts.medium) counts.medium = 5;
      if (!counts.low) counts.low = 2;
      const rows = Object.entries(counts).map(([severity, count]) => ({ severity, count: String(count) }));
      return { rows };
    }

    if (normalizedSql.match(/SELECT COUNT\(\*\) as total_assignments FROM meal_assignments WHERE assigned_date >= \$1 AND assigned_date <= \$2/i)) {
      const start = params[0]; const end = params[1];
      const count = state.meal_assignments.filter(ma => ma.assigned_date >= start && ma.assigned_date <= end).length;
      return { rows: [{ total_assignments: count }] };
    }

    if (normalizedSql.match(/SELECT COUNT\(\*\) as blocked_count FROM alerts WHERE type = 'blocked' AND created_at >= \$1/i)) {
      const since = new Date(params[0]);
      const count = state.alerts.filter(a => a.type === 'blocked' && new Date(a.created_at) >= since).length;
      return { rows: [{ blocked_count: count }] };
    }

    if (normalizedSql.match(/SELECT al\.\*, c\.name AS child_name FROM alerts al LEFT JOIN children c ON al\.child_id = c\.id WHERE al\.created_at >= \$1 ORDER BY al\.created_at DESC LIMIT 20/i)) {
      const since = new Date(params[0]);
      const list = state.alerts
        .filter(a => new Date(a.created_at) >= since)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20)
        .map(a => { const child = state.children.find(c => c.id === a.child_id); return { ...a, child_name: child ? child.name : null }; });
      return { rows: list };
    }

    if (normalizedSql.match(/SELECT type, severity, COUNT\(\*\) as count FROM alerts WHERE created_at >= \$1 GROUP BY type, severity/i)) {
      const since = new Date(params[0]);
      const counts = {};
      state.alerts.filter(a => new Date(a.created_at) >= since).forEach(a => {
        const key = `${a.type}__${a.severity}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      // Add demo data
      if (Object.keys(counts).length === 0) {
        counts['blocked__high'] = 2;
        counts['warning__medium'] = 4;
      }
      const rows = Object.entries(counts).map(([key, count]) => {
        const [type, severity] = key.split('__');
        return { type, severity, count: String(count) };
      });
      return { rows };
    }

    if (normalizedSql.match(/SELECT al\.\*, c\.name AS child_name FROM alerts al LEFT JOIN children c ON al\.child_id = c\.id WHERE al\.created_at >= \$1 ORDER BY al\.created_at DESC LIMIT 50/i)) {
      const since = new Date(params[0]);
      const list = state.alerts
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50)
        .map(a => { const child = state.children.find(c => c.id === a.child_id); return { ...a, child_name: child ? child.name : null }; });
      return { rows: list };
    }

    // ----------------------------------------------------
    // PARENT PORTAL QUERIES
    // ----------------------------------------------------
    if (normalizedSql.match(/SELECT \* FROM parent_child_links WHERE parent_id = \$1/i)) {
      const rows = state.parent_child_links.filter(l => l.parent_id === params[0]);
      return { rows };
    }

    if (normalizedSql.match(/SELECT ma\.\*, m\.name AS meal_name, m\.meal_type FROM meal_assignments ma JOIN meals m ON ma\.meal_id = m\.id WHERE ma\.assigned_date = \$1 AND ma\.classroom_id = \$2/i)) {
      const date = params[0]; const classroomId = params[1];
      const rows = state.meal_assignments
        .filter(ma => ma.assigned_date === date && ma.classroom_id === classroomId)
        .map(ma => { const meal = state.meals.find(m => m.id === ma.meal_id); return { ...ma, meal_name: meal ? meal.name : null, meal_type: meal ? meal.meal_type : null }; });
      return { rows };
    }

    if (normalizedSql.match(/INSERT INTO approval_requests/i)) {
      const newReq = {
        id: crypto.randomUUID(), parent_id: params[0], child_id: params[1],
        allergy_name: params[2], severity: params[3], symptoms: params[4],
        notes: params[5], status: params[6] || 'pending',
        reviewed_by: null, reviewed_at: null, created_at: new Date()
      };
      state.approval_requests.push(newReq);
      return { rows: [newReq] };
    }

    if (normalizedSql.match(/SELECT \* FROM approval_requests ORDER BY created_at DESC/i)) {
      const rows = [...state.approval_requests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows };
    }

    if (normalizedSql.match(/UPDATE approval_requests SET status = \$1/i)) {
      const req = state.approval_requests.find(r => r.id === params[3]);
      if (req) { req.status = params[0]; req.reviewed_by = params[1]; req.reviewed_at = params[2]; }
      return { rows: req ? [req] : [] };
    }

    if (normalizedSql.match(/INSERT INTO allergies.*\('food'/i) && params.length === 5) {
      const newAllergy = {
        id: crypto.randomUUID(), child_id: params[0], type: 'food',
        name: params[1], severity: params[2], symptoms: params[3],
        notes: params[4], created_at: new Date()
      };
      state.allergies.push(newAllergy);
      return { rows: [newAllergy] };
    }

    console.warn(`[MockDB] Unhandled Query: "${text}" with params:`, params);
    return { rows: [] };
  } catch (err) {
    console.error(`[MockDB] Error executing mock query: "${text}"`, err);
    throw err;
  }
}

module.exports = {
  query,
  state
};
