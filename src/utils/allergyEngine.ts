// Allergy Safety Engine - Frontend mirror of backend logic
// Used for real-time UI checks before API calls

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  'peanuts': ['peanut', 'peanut butter', 'groundnut'],
  'peanut': ['peanut', 'peanut butter', 'groundnut'],
  'tree nuts': ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia'],
  'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 'cheddar', 'mozzarella', 'parmesan'],
  'milk': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 'cheddar'],
  'eggs': ['egg', 'eggs', 'albumin', 'mayo', 'mayonnaise'],
  'egg': ['egg', 'eggs', 'albumin', 'mayo', 'mayonnaise'],
  'gluten': ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'barley', 'rye', 'semolina', 'spelt', 'tortilla'],
  'wheat': ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'barley', 'semolina'],
  'shellfish': ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'scallop', 'mussel', 'prawn', 'seafood'],
  'fish': ['fish', 'tuna', 'salmon', 'cod', 'tilapia', 'catfish', 'anchovy', 'sardine'],
  'soy': ['soy', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh'],
  'sesame': ['sesame', 'tahini', 'sesame oil', 'sesame seed'],
};

export interface AllergyMatch {
  allergy: string;
  severity: string;
  matched_ingredients: string[];
}

export interface SafetyResult {
  status: 'safe' | 'warning' | 'blocked';
  matches: AllergyMatch[];
  notes: string;
}

export function ingredientMatchesAllergen(ingredient: string, allergenName: string): boolean {
  const a = allergenName.toLowerCase();
  const i = ingredient.toLowerCase();
  if (i.includes(a) || a.includes(i)) return true;
  const keywords = ALLERGEN_KEYWORDS[a];
  if (keywords) return keywords.some(kw => i.includes(kw));
  return false;
}

export function checkMealSafety(
  ingredients: string[],
  allergies: { name: string; severity: string }[]
): SafetyResult {
  if (!allergies || allergies.length === 0) {
    return { status: 'safe', matches: [], notes: 'No food allergies on record. Meal is safe to serve.' };
  }

  const matches: AllergyMatch[] = [];
  for (const allergy of allergies) {
    const matched = ingredients.filter(ing => ingredientMatchesAllergen(ing, allergy.name));
    if (matched.length > 0) {
      matches.push({ allergy: allergy.name, severity: allergy.severity, matched_ingredients: matched });
    }
  }

  if (matches.length === 0) {
    return { status: 'safe', matches: [], notes: 'No allergens detected. Safe to serve.' };
  }

  const hasHigh = matches.some(m => m.severity === 'high');
  const status = hasHigh ? 'blocked' : 'warning';

  const matchDesc = matches.map(m =>
    `${m.allergy} (${m.severity}) — matched: ${m.matched_ingredients.join(', ')}`
  ).join('; ');

  const notes = hasHigh
    ? `⛔ DO NOT SERVE. Contains high-severity allergens: ${matchDesc}.`
    : `⚠️ CAUTION. May contain allergens: ${matchDesc}. Confirm with parents.`;

  return { status, matches, notes };
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    default: return '#22c55e';
  }
}

export function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'high': return '🔴 High Risk';
    case 'medium': return '🟠 Medium Risk';
    default: return '🟡 Low Risk';
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
