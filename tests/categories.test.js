// tests/categories.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, labelOf, categoryOf } from '../src/lib/categories.js';

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

test('a description matching a shop gives its category', () => {
  assert.equal(categoryOf('Greenbarrow Fresh 0412'), 'groceries');
  assert.equal(categoryOf('Kestrel Coffee Bar'), 'eating_out');
  assert.equal(categoryOf('Waverly Fuel Stop'), 'transport');
  assert.equal(categoryOf('Hollis Insurance'), 'bills');
  assert.equal(categoryOf('Quillon Books'), 'shopping');
  assert.equal(categoryOf('Cobalt Dental'), 'health');
  assert.equal(categoryOf('Brightwave Payroll'), 'income');
});

test('shop names match ignoring case', () => {
  assert.equal(categoryOf('LOWTIDE GROCERS'), 'groceries');
  assert.equal(categoryOf('ember grill'), 'eating_out');
});

test('a shop name inside a longer description still matches', () => {
  assert.equal(categoryOf('Pasta, Pizza & Co REF 3946'), 'eating_out');
});

test('a description matching no shop is other', () => {
  assert.equal(categoryOf('Unknown Trader 88'), 'other');
});

test('an empty or missing description is other', () => {
  assert.equal(categoryOf(''), 'other');
  assert.equal(categoryOf(null), 'other');
  assert.equal(categoryOf(undefined), 'other');
});

test('spaces around the description do not stop a shop matching', () => {
  assert.equal(categoryOf('   Lowtide Grocers  '), 'groceries');
});

test('the first shop in the list wins', () => {
  assert.equal(categoryOf('Greenbarrow Fresh and Kestrel Coffee Bar'), 'groceries');
});
