const { checkMealSafety, ingredientMatchesAllergen } = require('../utils/allergyEngine');

describe('Allergy Safety Engine', () => {
  // ===== ingredientMatchesAllergen =====
  describe('ingredientMatchesAllergen', () => {
    test('detects peanut butter as peanut allergen', () => {
      expect(ingredientMatchesAllergen('peanut butter', 'peanuts')).toBe(true);
    });
    test('detects milk as dairy allergen', () => {
      expect(ingredientMatchesAllergen('milk', 'dairy')).toBe(true);
    });
    test('detects cheese as dairy allergen', () => {
      expect(ingredientMatchesAllergen('cheddar cheese', 'dairy')).toBe(true);
    });
    test('detects eggs as egg allergen', () => {
      expect(ingredientMatchesAllergen('scrambled eggs', 'eggs')).toBe(true);
    });
    test('detects pasta as gluten allergen', () => {
      expect(ingredientMatchesAllergen('pasta', 'gluten')).toBe(true);
    });
    test('returns false for non-matching ingredient', () => {
      expect(ingredientMatchesAllergen('apple', 'peanuts')).toBe(false);
    });
    test('returns false for unrelated allergen', () => {
      expect(ingredientMatchesAllergen('chicken', 'shellfish')).toBe(false);
    });
  });

  // ===== checkMealSafety =====
  describe('checkMealSafety - SAFE cases', () => {
    test('returns SAFE when no allergies', () => {
      const result = checkMealSafety(['apple', 'banana', 'grapes'], []);
      expect(result.status).toBe('safe');
      expect(result.matches).toHaveLength(0);
    });

    test('returns SAFE when ingredients do not match allergies', () => {
      const result = checkMealSafety(
        ['chicken', 'rice', 'carrots'],
        [{ name: 'Peanuts', severity: 'high' }]
      );
      expect(result.status).toBe('safe');
    });

    test('returns SAFE for fruit salad with no allergies', () => {
      const result = checkMealSafety(
        ['apple', 'banana', 'orange', 'strawberry'],
        []
      );
      expect(result.status).toBe('safe');
    });
  });

  describe('checkMealSafety - BLOCKED cases', () => {
    test('BLOCKED for peanut meal + high peanut allergy', () => {
      const result = checkMealSafety(
        ['bread', 'peanut butter', 'jelly'],
        [{ name: 'Peanuts', severity: 'high' }]
      );
      expect(result.status).toBe('blocked');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].allergy).toBe('Peanuts');
    });

    test('BLOCKED for egg meal + high egg allergy', () => {
      const result = checkMealSafety(
        ['eggs', 'butter', 'bread'],
        [{ name: 'Eggs', severity: 'high' }]
      );
      expect(result.status).toBe('blocked');
    });

    test('BLOCKED includes allergen in notes', () => {
      const result = checkMealSafety(
        ['peanut butter'],
        [{ name: 'Peanuts', severity: 'high' }]
      );
      expect(result.notes).toContain('DO NOT SERVE');
    });
  });

  describe('checkMealSafety - WARNING cases', () => {
    test('WARNING for dairy meal + medium dairy allergy', () => {
      const result = checkMealSafety(
        ['macaroni', 'cheddar cheese', 'milk', 'butter'],
        [{ name: 'Dairy', severity: 'medium' }]
      );
      expect(result.status).toBe('warning');
    });

    test('WARNING notes include CAUTION', () => {
      const result = checkMealSafety(
        ['pasta', 'parmesan cheese'],
        [{ name: 'Dairy', severity: 'medium' }]
      );
      expect(result.notes).toContain('CAUTION');
    });
  });

  describe('checkMealSafety - Multiple allergies', () => {
    test('BLOCKED when one high + one medium allergy matched', () => {
      const result = checkMealSafety(
        ['shrimp', 'wheat flour'],
        [
          { name: 'Shellfish', severity: 'high' },
          { name: 'Gluten', severity: 'medium' },
        ]
      );
      expect(result.status).toBe('blocked');
      expect(result.matches).toHaveLength(2);
    });

    test('WARNING when only medium allergies matched', () => {
      const result = checkMealSafety(
        ['pasta', 'milk'],
        [
          { name: 'Dairy', severity: 'medium' },
          { name: 'Gluten', severity: 'medium' },
        ]
      );
      expect(result.status).toBe('warning');
    });
  });
});
