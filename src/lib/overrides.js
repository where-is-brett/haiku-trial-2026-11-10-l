// src/lib/overrides.js
import { CATEGORIES, categoryOf } from './categories.js';

// Creates the table that holds a category the user has saved for a transaction.
export function ensureOverridesTable(db) {
  db.exec(
    'CREATE TABLE IF NOT EXISTS category_overrides (transaction_id INTEGER PRIMARY KEY, category TEXT NOT NULL)',
  );
}

// Saves the category the user chose for a transaction, replacing any earlier save.
// Refuses an unknown category key (400) or an unknown transaction id (404) and writes nothing.
export function saveCategory(db, id, key) {
  if (!Object.hasOwn(CATEGORIES, key)) {
    throw Object.assign(new Error('Unknown category'), { status: 400 });
  }
  const row = db.prepare('SELECT id FROM transactions WHERE id = ?').get(id);
  if (!row) {
    throw Object.assign(new Error('Unknown transaction'), { status: 404 });
  }
  db.prepare(
    'INSERT INTO category_overrides (transaction_id, category) VALUES (?, ?) ON CONFLICT(transaction_id) DO UPDATE SET category = excluded.category',
  ).run(row.id, key);
}

// Returns the category key for a transaction: the saved category if there is one, otherwise the shop rule.
export function categoryFor(db, row) {
  const saved = db
    .prepare('SELECT category FROM category_overrides WHERE transaction_id = ?')
    .get(row.id);
  return saved ? saved.category : categoryOf(row.description);
}
