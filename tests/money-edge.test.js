// tests/money-edge.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount } from '../src/lib/money.js';

// These pin what parseAmount does today, including the NaN for a blank amount.

test('a blank amount reads as NaN', () => {
  assert.ok(Number.isNaN(parseAmount('')));
  assert.ok(Number.isNaN(parseAmount('   ')));
});

test('a negative amount reads as negative cents', () => {
  assert.equal(parseAmount('-40.00'), -4000);
});

test('a thousands comma is ignored', () => {
  assert.equal(parseAmount('1,234.50'), 123450);
  assert.equal(parseAmount('-1,234.50'), -123450);
});
