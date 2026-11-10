// tests/categories-override.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { ensureOverridesTable, categoryFor } from '../src/lib/overrides.js';

// Opens an in-memory ledger with the same transactions table as src/server.js,
// the overrides table, and the given rows.
function ledgerWith(rows) {
  const db = new DatabaseSync(':memory:');
  db.exec(
    'CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, date TEXT, description TEXT, cents INTEGER)',
  );
  ensureOverridesTable(db);
  const insert = db.prepare('INSERT INTO transactions (id, date, description, cents) VALUES (?, ?, ?, ?)');
  for (const [id, description] of rows) {
    insert.run(id, '2026-11-01', description, -1000);
  }
  return db;
}

test('a saved category wins over the shop rule', () => {
  const db = ledgerWith([[1, 'Pasta Corner']]);
  db.exec("INSERT INTO category_overrides (transaction_id, category) VALUES (1, 'shopping')");
  assert.equal(categoryFor(db, { id: 1, description: 'Pasta Corner' }), 'shopping');
});

test('a transaction never edited keeps its shop category', () => {
  const db = ledgerWith([[2, 'Greenbarrow Fresh 22']]);
  assert.equal(categoryFor(db, { id: 2, description: 'Greenbarrow Fresh 22' }), 'groceries');
});

test('a description that is null or empty gets other', () => {
  const db = ledgerWith([[3, null], [4, '']]);
  assert.equal(categoryFor(db, { id: 3, description: null }), 'other');
  assert.equal(categoryFor(db, { id: 4, description: '' }), 'other');
});
