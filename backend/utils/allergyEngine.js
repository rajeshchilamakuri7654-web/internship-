/**
 * Allergy Safety Engine
 * Compares meal ingredients against child food allergies
 * Returns: { status: 'safe'|'warning'|'blocked', matches: [], notes: string }
 */

// Allergy keyword mappings - maps allergen names to ingredient keywords
const ALLERGEN_KEYWORDS = {
  'peanuts': ['peanut', 'peanut butter', 'groundnut', 'arachis'],
  'peanut': ['peanut', 'peanut butter', 'groundnut'],
  'tree nuts': ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut', 'chestnut'],
  'tree nut': ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut'],
  'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 'cheddar', 'mozzarella', 'parmesan', 'ice cream'],
  'milk': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 'cheddar'],
  'eggs': ['egg', 'eggs', 'albumin', 'mayo', 'mayonnaise'],
  'egg': ['egg', 'eggs', 'albumin', 'mayo', 'mayonnaise'],
  'gluten': ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'barley', 'rye', 'semolina', 'spelt', 'tortilla', 'cracker', 'cereal'],
  'wheat': ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'barley', 'semolina'],
  'shellfish': ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'scallop', 'mussel', 'prawn', 'crayfish', 'seafood'],
  'fish': ['fish', 'tuna', 'salmon', 'cod', 'tilapia', 'catfish', 'anchovy', 'sardine', 'halibut', 'bass', 'flounder'],
  'soy': ['soy', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh', 'soy sauce', 'tamari'],
  'sesame': ['sesame', 'tahini', 'sesame oil', 'sesame seed'],
};

/**
 * Check if any ingredient matches a given allergen
 */
function ingredientMatchesAllergen(ingredient, allergenName) {
  const allergenLower = allergenName.toLowerCase();
  const ingredientLower = ingredient.toLowerCase();

  // Direct match
  if (ingredientLower.includes(allergenLower) || allergenLower.includes(ingredientLower)) {
    return true;
  }

  // Keyword map lookup
  const keywords = ALLERGEN_KEYWORDS[allergenLower];
  if (keywords) {
    return keywords.some(kw => ingredientLower.includes(kw));
  }

  // Generic substring check
  return false;
}

/**
 * Main safety check function
 * @param {string[]} ingredients - list of meal ingredients (lowercase)
 * @param {Array} allergies - child food allergy objects { name, severity }
 * @returns {{ status: string, matches: Array, notes: string }}
 */
function checkMealSafety(ingredients, allergies) {
  if (!allergies || allergies.length === 0) {
    return {
      status: 'safe',
      matches: [],
      notes: 'No food allergies on record. Meal is safe to serve.',
    };
  }

  const matches = [];

  for (const allergy of allergies) {
    const allergyName = allergy.name || '';
    const matched = ingredients.filter(ing => ingredientMatchesAllergen(ing, allergyName));
    if (matched.length > 0) {
      matches.push({
        allergy: allergyName,
        severity: allergy.severity,
        matched_ingredients: matched,
      });
    }
  }

  if (matches.length === 0) {
    return {
      status: 'safe',
      matches: [],
      notes: 'No allergens detected in this meal. Safe to serve.',
    };
  }

  const hasHigh = matches.some(m => m.severity === 'high');
  const hasMedium = matches.some(m => m.severity === 'medium');

  const status = hasHigh ? 'blocked' : 'warning';

  const matchDesc = matches.map(m =>
    `${m.allergy} (${m.severity}) — matched: ${m.matched_ingredients.join(', ')}`
  ).join('; ');

  const notes = hasHigh
    ? `⛔ DO NOT SERVE. This meal contains high-severity allergens: ${matchDesc}. Seek immediate alternatives and notify parents.`
    : `⚠️ CAUTION. This meal may contain allergens: ${matchDesc}. Confirm with parents before serving.`;

  return { status, matches, notes };
}

module.exports = { checkMealSafety, ingredientMatchesAllergen };
