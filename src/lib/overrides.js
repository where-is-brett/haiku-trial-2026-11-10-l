// src/lib/overrides.js
import { categoryOf } from './categories.js';

// Creates the table that holds a category the user has saved for a transaction.
export function ensureOverridesTable(db) {
  db.exec(
    'CREATE TABLE IF NOT EXISTS category_overrides (transaction_id INTEGER PRIMARY KEY, category TEXT NOT NULL)',
  );
}

// Returns the category key for a transaction: the saved category if there is one, otherwise the shop rule.
export function categoryFor(db, row) {
  const saved = db
    .prepare('SELECT category FROM category_overrides WHERE transaction_id = ?')
    .get(row.id);
  return saved ? saved.category : categoryOf(row.description);
}
