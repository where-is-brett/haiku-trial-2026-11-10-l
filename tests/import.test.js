// tests/import.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStatement, splitCsvLine } from '../src/lib/import.js';
import { readFileSync } from 'node:fs';

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

test('a quote inside an unquoted field is literal text', () => {
  assert.deepEqual(splitCsvLine('1"0.00'), ['1"0.00']);
  assert.deepEqual(splitCsvLine('Joe "The Bar",5.00'), ['Joe "The Bar"', '5.00']);
});

const HEADER = 'Date,Description,Amount';

test('a statement with CRLF lines and a byte-order mark is read', () => {
  const text = '﻿' + HEADER + '\r\n02/08/2026,Skyline Broadband REF 0617,8.58\r\n';
  assert.deepEqual(readStatement(text), [
    { date: '2026-08-02', description: 'Skyline Broadband REF 0617', cents: 858 },
  ]);
});

test('brackets and a minus sign are money back, a plain amount is spending', () => {
  const text = [HEADER, '01/08/2026,Refund,(40.00)', '02/08/2026,Refund 2,-2100.00', '03/08/2026,Shop,12.50'].join('\n');
  assert.deepEqual(readStatement(text).map((r) => r.cents), [-4000, -210000, 1250]);
});

test('a bracketed zero passes the amount check and reads as zero cents', () => {
  const [row] = readStatement(HEADER + '\n02/08/2026,Shop,(0.00)');
  assert.equal(Object.is(row.cents, 0), true);
});

test('a trailing blank line is not a row', () => {
  const text = HEADER + '\n02/08/2026,Shop,1.00\n\n';
  assert.equal(readStatement(text).length, 1);
});

test('a row with an empty description is accepted', () => {
  assert.equal(readStatement(HEADER + '\n02/08/2026,,5.00')[0].description, '');
});

test('a header in lower case with spaces is accepted', () => {
  assert.equal(readStatement(' date , DESCRIPTION ,amount\n02/08/2026,Shop,1.00').length, 1);
});

test('a file with the wrong header is refused with the header sentence', () => {
  assert.throws(() => readStatement('Date,Payee,Amount\n02/08/2026,Shop,1.00'),
    { message: 'This file is not a bank statement: expected the columns Date, Description, Amount.' });
});

test('a bad amount, a bad date, a short row, an impossible date and a single decimal are refused with the line number', () => {
  const bad = [
    '02/08/2026,Shop,1.5x',
    '2/8/2026,Shop,1.00',
    '02/08/2026,Shop',
    '31/02/2026,Shop,1.00',
    '02/08/2026,Shop,8.5',
  ];
  for (const row of bad) {
    assert.throws(() => readStatement(HEADER + '\n' + row),
      { message: 'This file is not a bank statement: line 2 is not a valid transaction.' });
  }
});

test('a row with four fields is refused', () => {
  assert.throws(() => readStatement(HEADER + '\n02/08/2026,Shop,1.00,extra'),
    { message: 'This file is not a bank statement: line 2 is not a valid transaction.' });
});

test('a quote inside an unquoted amount is refused with the line number', () => {
  assert.throws(() => readStatement(HEADER + '\n02/08/2026,Shop,1"0.00'),
    { message: 'This file is not a bank statement: line 2 is not a valid transaction.' });
});

test('a quote inside an unquoted date is refused with the line number', () => {
  for (const row of ['02"/08/2026,Shop,1.00', '02"/08/2026",Shop,1.00']) {
    assert.throws(() => readStatement(HEADER + '\n' + row),
      { message: 'This file is not a bank statement: line 2 is not a valid transaction.' });
  }
});

test('a quote in the middle of an unquoted description is read as literal text', () => {
  assert.equal(readStatement(HEADER + '\n02/08/2026,Joe "The Bar",5.00')[0].description, 'Joe "The Bar"');
});

test('the refused line number counts the header as line 1', () => {
  const text = HEADER + '\n02/08/2026,Shop,1.00\n02/08/2026,Shop,oops\n';
  assert.throws(() => readStatement(text),
    { message: 'This file is not a bank statement: line 3 is not a valid transaction.' });
});

test('a file with no data rows is refused', () => {
  assert.throws(() => readStatement(HEADER + '\n'),
    { message: 'This file is not a bank statement: it has no transactions.' });
});

test('the sample statement reads as 128 rows', () => {
  const text = readFileSync(new URL('../data/sample-statement.csv', import.meta.url), 'utf8');
  assert.equal(readStatement(text).length, 128);
});
