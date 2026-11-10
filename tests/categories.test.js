// tests/categories.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, labelOf } from '../src/lib/categories.js';

test('the eight category keys and labels match the request', () => {
  assert.deepEqual(CATEGORIES, {
    groceries: 'Groceries',
    eating_out: 'Eating out',
    transport: 'Transport',
    bills: 'Bills',
    shopping: 'Shopping',
    health: 'Health',
    income: 'Income',
    other: 'Other',
  });
  assert.deepEqual(Object.keys(CATEGORIES), [
    'groceries', 'eating_out', 'transport', 'bills',
    'shopping', 'health', 'income', 'other',
  ]);
});

test('labelOf gives the label for a category key', () => {
  assert.equal(labelOf('eating_out'), 'Eating out');
});
