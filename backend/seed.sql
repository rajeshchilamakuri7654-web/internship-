-- ============================================
-- Seed Data for Food Allergy-Safe Meal Planner
-- ============================================

-- Admin user: password = "admin123"
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sarah Johnson', 'admin@daycare.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpR5U.k3KQ5nuu', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'Michael Chen', 'teacher@daycare.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpR5U.k3KQ5nuu', 'teacher'),
  ('33333333-3333-3333-3333-333333333333', 'Rajesh Chilamakuri', 'rajeshchilamakuri7654@gmail.com', '$2a$12$7D2qKwz1LXCNZGJ/x4zmB.M8.jb0F4UhVnGBRvSKJizTdLYmyGEqG', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Classrooms
INSERT INTO classrooms (id, name, teacher_id) VALUES
  ('aaaa0000-0000-0000-0000-000000000001', 'Sunflower Room', '22222222-2222-2222-2222-222222222222'),
  ('aaaa0000-0000-0000-0000-000000000002', 'Rainbow Room', '22222222-2222-2222-2222-222222222222'),
  ('aaaa0000-0000-0000-0000-000000000003', 'Star Room', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Children
INSERT INTO children (id, name, age, gender, classroom_id, parent_name, parent_contact, notes, risk_level) VALUES
  ('cccc0000-0000-0000-0000-000000000001', 'Emma Williams', 4, 'female', 'aaaa0000-0000-0000-0000-000000000001', 'Lisa Williams', '+1-555-0101', 'Very active child. Loves art.', 'high'),
  ('cccc0000-0000-0000-0000-000000000002', 'Lucas Brown', 3, 'male', 'aaaa0000-0000-0000-0000-000000000001', 'James Brown', '+1-555-0102', 'Shy at first, warms up quickly.', 'medium'),
  ('cccc0000-0000-0000-0000-000000000003', 'Olivia Davis', 5, 'female', 'aaaa0000-0000-0000-0000-000000000002', 'Karen Davis', '+1-555-0103', 'Loves reading and singing.', 'low'),
  ('cccc0000-0000-0000-0000-000000000004', 'Noah Martinez', 4, 'male', 'aaaa0000-0000-0000-0000-000000000002', 'Carlos Martinez', '+1-555-0104', 'Very energetic. Needs extra supervision during meals.', 'high'),
  ('cccc0000-0000-0000-0000-000000000005', 'Ava Wilson', 3, 'female', 'aaaa0000-0000-0000-0000-000000000003', 'Susan Wilson', '+1-555-0105', 'Picky eater but loves fruits.', 'medium'),
  ('cccc0000-0000-0000-0000-000000000006', 'Ethan Taylor', 5, 'male', 'aaaa0000-0000-0000-0000-000000000003', 'Robert Taylor', '+1-555-0106', 'No known health issues.', 'low')
ON CONFLICT DO NOTHING;

-- Allergies
INSERT INTO allergies (child_id, type, name, severity, symptoms, notes) VALUES
  ('cccc0000-0000-0000-0000-000000000001', 'food', 'Peanuts', 'high', 'Anaphylaxis, hives, difficulty breathing', 'Carries EpiPen. Do NOT serve any peanut products.'),
  ('cccc0000-0000-0000-0000-000000000001', 'food', 'Tree Nuts', 'high', 'Hives, swelling', 'Avoid all tree nuts including cashews, almonds, walnuts.'),
  ('cccc0000-0000-0000-0000-000000000002', 'food', 'Dairy', 'medium', 'Stomach pain, bloating, diarrhea', 'Lactose intolerant. Use dairy-free alternatives.'),
  ('cccc0000-0000-0000-0000-000000000002', 'environmental', 'Pollen', 'low', 'Sneezing, runny nose', 'Antihistamine as needed.'),
  ('cccc0000-0000-0000-0000-000000000004', 'food', 'Shellfish', 'high', 'Hives, vomiting, anaphylaxis', 'EpiPen required. No seafood of any kind.'),
  ('cccc0000-0000-0000-0000-000000000004', 'food', 'Gluten', 'medium', 'Stomach cramps, bloating', 'Celiac disease. Strict gluten-free diet required.'),
  ('cccc0000-0000-0000-0000-000000000005', 'food', 'Eggs', 'medium', 'Hives, stomach upset', 'Avoid eggs in all forms.'),
  ('cccc0000-0000-0000-0000-000000000005', 'medicine', 'Penicillin', 'high', 'Severe rash, anaphylaxis', 'Must notify doctor before any medication.'),
  ('cccc0000-0000-0000-0000-000000000001', 'medicine', 'Aspirin', 'medium', 'Rash, wheezing', 'Use paracetamol instead.')
ON CONFLICT DO NOTHING;

-- Emergency Contacts
INSERT INTO emergency_contacts (child_id, name, relationship, phone, email, is_primary, medical_notes) VALUES
  ('cccc0000-0000-0000-0000-000000000001', 'Lisa Williams', 'Mother', '+1-555-0101', 'lisa.w@email.com', true, 'EpiPen location: red bag in childs cubby. Call 911 first then parent.'),
  ('cccc0000-0000-0000-0000-000000000001', 'David Williams', 'Father', '+1-555-0111', 'david.w@email.com', false, NULL),
  ('cccc0000-0000-0000-0000-000000000002', 'James Brown', 'Father', '+1-555-0102', 'james.b@email.com', true, 'Lactase drops in lunch bag if needed.'),
  ('cccc0000-0000-0000-0000-000000000004', 'Carlos Martinez', 'Father', '+1-555-0104', 'carlos.m@email.com', true, 'EpiPen in blue pouch. Child is aware of his allergy.'),
  ('cccc0000-0000-0000-0000-000000000005', 'Susan Wilson', 'Mother', '+1-555-0105', 'susan.w@email.com', true, 'No eggs in any form.'),
  ('cccc0000-0000-0000-0000-000000000003', 'Karen Davis', 'Mother', '+1-555-0103', 'karen.d@email.com', true, NULL),
  ('cccc0000-0000-0000-0000-000000000006', 'Robert Taylor', 'Father', '+1-555-0106', 'robert.t@email.com', true, NULL)
ON CONFLICT DO NOTHING;

-- Medicines
INSERT INTO medicines (child_id, name, dosage, frequency, notes) VALUES
  ('cccc0000-0000-0000-0000-000000000001', 'EpiPen (Epinephrine)', '0.15mg', 'Emergency use only', 'Stored in red bag in cubby. Use immediately if anaphylaxis suspected.'),
  ('cccc0000-0000-0000-0000-000000000004', 'EpiPen (Epinephrine)', '0.15mg', 'Emergency use only', 'Stored in blue pouch in teachers desk.'),
  ('cccc0000-0000-0000-0000-000000000005', 'Antihistamine (Cetirizine)', '5mg', 'Once daily if needed', 'Give only if parent notifies staff.')
ON CONFLICT DO NOTHING;

-- Meals
INSERT INTO meals (id, name, meal_type, ingredients, description, created_by) VALUES
  ('mmmm0000-0000-0000-0000-000000000001', 'Peanut Butter Sandwich', 'lunch', ARRAY['bread', 'peanut butter', 'jelly'], 'Classic PB&J sandwich', '11111111-1111-1111-1111-111111111111'),
  ('mmmm0000-0000-0000-0000-000000000002', 'Mac and Cheese', 'lunch', ARRAY['macaroni', 'cheddar cheese', 'milk', 'butter', 'flour'], 'Creamy macaroni and cheese', '11111111-1111-1111-1111-111111111111'),
  ('mmmm0000-0000-0000-0000-000000000003', 'Fresh Fruit Salad', 'snack', ARRAY['apple', 'banana', 'grapes', 'orange', 'strawberry'], 'Mixed seasonal fruits', '11111111-1111-1111-1111-111111111111'),
  ('mmmm0000-0000-0000-0000-000000000004', 'Chicken Rice Bowl', 'lunch', ARRAY['chicken breast', 'white rice', 'carrots', 'peas', 'olive oil', 'salt'], 'Healthy chicken and rice', '11111111-1111-1111-1111-111111111111'),
  ('mmmm0000-0000-0000-0000-000000000005', 'Scrambled Eggs with Toast', 'breakfast', ARRAY['eggs', 'butter', 'whole wheat bread', 'salt', 'pepper'], 'Fluffy scrambled eggs', '11111111-1111-1111-1111-111111111111'),
  ('mmmm0000-0000-0000-0000-000000000006', 'Pasta with Tomato Sauce', 'lunch', ARRAY['pasta', 'tomato sauce', 'olive oil', 'garlic', 'basil', 'parmesan cheese'], 'Simple pasta marinara', '11111111-1111-1111-1111-111111111111'),
  ('mmmm0000-0000-0000-0000-000000000007', 'Veggie Wrap', 'lunch', ARRAY['whole wheat tortilla', 'lettuce', 'tomato', 'cucumber', 'hummus', 'bell pepper'], 'Fresh veggie wrap with hummus', '11111111-1111-1111-1111-111111111111'),
  ('mmmm0000-0000-0000-0000-000000000008', 'Oatmeal with Berries', 'breakfast', ARRAY['oats', 'milk', 'blueberries', 'honey', 'cinnamon'], 'Warm oatmeal with fresh berries', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Meal Assignments (today)
INSERT INTO meal_assignments (meal_id, classroom_id, assigned_date, assigned_by, notes) VALUES
  ('mmmm0000-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000001', CURRENT_DATE, '11111111-1111-1111-1111-111111111111', 'Morning snack'),
  ('mmmm0000-0000-0000-0000-000000000004', 'aaaa0000-0000-0000-0000-000000000001', CURRENT_DATE, '11111111-1111-1111-1111-111111111111', 'Lunch'),
  ('mmmm0000-0000-0000-0000-000000000005', 'aaaa0000-0000-0000-0000-000000000002', CURRENT_DATE, '11111111-1111-1111-1111-111111111111', 'Breakfast'),
  ('mmmm0000-0000-0000-0000-000000000007', 'aaaa0000-0000-0000-0000-000000000003', CURRENT_DATE, '11111111-1111-1111-1111-111111111111', 'Lunch')
ON CONFLICT DO NOTHING;
