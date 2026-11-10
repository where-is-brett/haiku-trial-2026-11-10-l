// tests/import.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitCsvLine } from '../src/lib/import.js';

test('a quoted description with a comma is read whole', () => {
  assert.deepEqual(
    splitCsvLine('06/08/2026,"Pasta, Pizza & Co REF 3946",102.29'),
    ['06/08/2026', 'Pasta, Pizza & Co REF 3946', '102.29'],
  );
});

test('a doubled quote inside a quoted field is one quote', () => {
  assert.deepEqual(splitCsvLine('1,"Joe ""The Bar""",2'), ['1', 'Joe "The Bar"', '2']);
});

test('spaces around unquoted fields are trimmed', () => {
  assert.deepEqual(splitCsvLine(' Date , Description ,Amount '), ['Date', 'Description', 'Amount']);
});
