// tests/money.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount } from '../src/lib/money.js';

test('a bracketed amount is money back', () => {
  assert.equal(parseAmount('(40.00)'), -4000);
});

test('a minus sign is money back and a plain amount is spending', () => {
  assert.equal(parseAmount('-2100.00'), -210000);
  assert.equal(parseAmount('8.58'), 858);
});
