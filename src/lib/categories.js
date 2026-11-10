// src/lib/categories.js

// Category keys and their labels, in the order the request lists them.
export const CATEGORIES = {
  groceries: 'Groceries',
  eating_out: 'Eating out',
  transport: 'Transport',
  bills: 'Bills',
  shopping: 'Shopping',
  health: 'Health',
  income: 'Income',
  other: 'Other',
};

// Returns the label for a category key, such as 'Eating out' for 'eating_out'.
export function labelOf(key) {
  return CATEGORIES[key];
}
