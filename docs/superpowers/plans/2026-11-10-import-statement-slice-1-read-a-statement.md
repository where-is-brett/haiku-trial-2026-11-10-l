# Read a statement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bank statement's text is read into dated, signed amounts, and anything that is not a statement is refused. Slice 1 of `import-statement`.

**Architecture:** Two pieces. `parseAmount` in `src/lib/money.js` learns that brackets mean money back. A new `src/lib/import.js` holds a small CSV line reader and `readStatement(text)`, which checks every field with a strict pattern before it calls `parseDate` or `parseAmount`. Nothing touches the database or HTTP in this slice.

**Tech Stack:** Node 22.13+, ES modules, `node:test`, `node:assert/strict`. No dependencies.

**Spec:** `.wheelhouse/feature/approved.md` (sections "Goals", "The how, as decided" items 1–4, and slice 1 of "Decided by the director").

## Global Constraints

- No dependencies beyond Node. Do not change `package.json` or `package-lock.json`.
- Node version floor: `>=22.13`.
- Amounts are read with `parseAmount` (`src/lib/money.js`); dates with `parseDate` (`src/lib/dates.js`). Only fields that pass the strict checks reach them.
- Amount pattern: digits with an optional two-place decimal part, optionally signed (`-`) or wrapped in brackets. Examples that pass: `8.58`, `-2100.00`, `(40.00)`, `0`. Refused: `8.5`, `1,234.00`, `(-5.00)`, `+5.00`, `--5`.
- Date pattern: `DD/MM/YYYY` and a real calendar day. `31/02/2026` is refused; `29/02/2028` is accepted.
- Header must be exactly `Date`, `Description`, `Amount` in that order, compared trimmed and case-insensitively.
- Refusal message is one plain sentence. Three fixed forms:
  - Header: `This file is not a bank statement: expected the columns Date, Description, Amount.`
  - No data rows: `This file is not a bank statement: it has no transactions.`
  - Bad row: `This file is not a bank statement: line N is not a valid transaction.` where N is the 1-based file line number, counting the header as line 1.

## Review Focus

1. A doubled quote inside a quoted field, such as `"Joe ""The Bar"""`, reads as `Joe "The Bar"`. Owner: Task 2.
2. A blank line at the end of the file (the usual trailing newline) is not a row and is not a refusal. Owner: Task 3.
3. An impossible date such as `31/02/2026` is refused and not rolled over into March. Owner: Task 3.
4. Spaces around fields and header names, and a header in lower case, are accepted. Owner: Task 2 (header and field trimming) and Task 3 (header check).
5. A row with an empty description (`02/08/2026,,5.00`) has three fields and is accepted with description `''`. Owner: Task 3.

---

### Task 1: Brackets are money back in `parseAmount`

**Files:**
- Modify: `src/lib/money.js:4-10`
- Test: `tests/money.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `parseAmount(text: string) -> number` (whole cents, signed). Unchanged signature; bracketed input now returns a negative number.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/money.test.js`
Expected: FAIL on `a bracketed amount is money back` (actual `4000`, expected `-4000`).

- [ ] **Step 3: Fix `parseAmount` in `src/lib/money.js`**

Set `negative` to true when the trimmed text starts with `-` or is wrapped in `(` and `)`. Keep the digit stripping and rounding as they are, and leave `formatCents` alone.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/money.test.js tests/smoke.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/money.js tests/money.test.js
git commit -m "fix: read bracketed amounts as money back"
```

---

### Task 2: CSV line reader

**Files:**
- Create: `src/lib/import.js` (exports `splitCsvLine` for now)
- Test: `tests/import.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `splitCsvLine(line: string) -> string[]`. Splits one line into fields. Double-quoted fields may hold commas; `""` inside a quoted field is one `"`. Fields are returned trimmed of surrounding spaces, except inside quotes. Does not handle line breaks inside a quoted field (a row is one line).

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/import.test.js`
Expected: FAIL with "does not provide an export named 'splitCsvLine'" (module missing).

- [ ] **Step 3: Implement `splitCsvLine(line)` in `src/lib/import.js`**

A single left-to-right pass with an `inQuotes` flag. A comma outside quotes ends a field. `""` while in quotes adds one `"`. Trim unquoted fields at the end. A short doc comment on the function, in the style of `src/lib/money.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/import.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/import.js tests/import.test.js
git commit -m "feat: add a CSV line reader for statements"
```

---

### Task 3: `readStatement(text)` reads and refuses

**Files:**
- Modify: `src/lib/import.js` (add `readStatement`)
- Test: `tests/import.test.js` (add cases)

**Interfaces:**
- Consumes: `splitCsvLine(line: string) -> string[]` (Task 2); `parseAmount(text: string) -> number` (Task 1); `parseDate(text: string) -> string` (`src/lib/dates.js`, existing).
- Produces: `readStatement(text: string) -> { date: string, description: string, cents: number }[]`. `date` is `YYYY-MM-DD`; `cents` is signed. Throws `Error` whose `message` is the plain refusal sentence from Global Constraints. Storing and HTTP are not part of this task.

- [ ] **Step 1: Write the failing tests**

Add to the imports at the top of `tests/import.test.js`: `import { readStatement } from '../src/lib/import.js';` and `import { readFileSync } from 'node:fs';`.

```js
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

test('a file with no data rows is refused', () => {
  assert.throws(() => readStatement(HEADER + '\n'),
    { message: 'This file is not a bank statement: it has no transactions.' });
});

test('the sample statement reads as 128 rows', () => {
  const text = readFileSync(new URL('../data/sample-statement.csv', import.meta.url), 'utf8');
  assert.equal(readStatement(text).length, 128);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/import.test.js`
Expected: FAIL, `readStatement` is not exported.

- [ ] **Step 3: Implement `readStatement(text)` in `src/lib/import.js`**

Steps, in order: strip a leading `﻿`; split on `/\r?\n/`; drop blank lines at the end only; check the header line with `splitCsvLine`; for each later line, split it, require exactly three fields, check the date with `/^\d{2}\/\d{2}\/\d{4}$/` and a real calendar day, check the amount against the pattern in Global Constraints, then call `parseDate` and `parseAmount`. Throw on the first bad line. Nothing is returned until every row has passed, so a refused file returns nothing. Line numbers count the header as line 1. Export `readStatement` as a named function.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/import.test.js tests/money.test.js tests/smoke.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/import.js tests/import.test.js
git commit -m "feat: read and refuse bank statements"
```

---

## Verification before the slice is done

- [ ] Run `npm test` and read the output. Expected: all tests pass, including the 128-row sample count.
- [ ] Confirm `git diff origin/HEAD...HEAD --stat` lists only `src/lib/money.js`, `src/lib/import.js`, `tests/money.test.js`, `tests/import.test.js` and this plan file. `package.json` and `package-lock.json` must not appear.
- [ ] Every choice the implementer makes that the plan leaves open (the no-rows wording, the blank-line handling, the `""` escape) is logged with `log`.
