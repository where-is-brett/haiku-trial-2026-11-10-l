// src/lib/import.js

import { parseAmount } from './money.js';
import { parseDate } from './dates.js';

// Splits one line of a CSV statement into fields. A comma inside double quotes is
// part of the field, and a doubled quote inside a quoted field is one quote.
// Spaces around unquoted fields are trimmed; a row is one line, so line breaks
// inside a quoted field are not handled.
export function splitCsvLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  let wasQuoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch !== '"') {
        field += ch;
      } else if (line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = false;
      }
    } else if (ch === '"') {
      inQuotes = true;
      wasQuoted = true;
    } else if (ch === ',') {
      fields.push(wasQuoted ? field : field.trim());
      field = '';
      wasQuoted = false;
    } else if (ch === ' ' && (wasQuoted || field === '')) {
      // Spaces outside the quotes around a quoted field are dropped.
    } else {
      field += ch;
    }
  }
  fields.push(wasQuoted ? field : field.trim());
  return fields;
}

const HEADER = ['Date', 'Description', 'Amount'];
const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const AMOUNT_PATTERN = /^(-?\d+(\.\d{2})?|\(\d+(\.\d{2})?\))$/;

// True when DD/MM/YYYY names a day that exists, so 31/02/2026 is refused.
function isRealDay(text) {
  const [day, month, year] = text.split('/').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isHeader(fields) {
  return fields.length === HEADER.length
    && fields.every((field, i) => field.trim().toLowerCase() === HEADER[i].toLowerCase());
}

// Reads a bank statement's CSV text into dated, signed transactions. Every row is
// checked before any is returned; the first bad line throws an Error whose message
// is the plain refusal sentence. Line numbers count the header as line 1.
export function readStatement(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  if (lines.length === 0 || !isHeader(splitCsvLine(lines[0]))) {
    throw new Error('This file is not a bank statement: expected the columns Date, Description, Amount.');
  }
  if (lines.length === 1) {
    throw new Error('This file is not a bank statement: it has no transactions.');
  }
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const [date, description, amount, ...extra] = splitCsvLine(lines[i]);
    if (extra.length > 0 || amount === undefined
      || !DATE_PATTERN.test(date) || !isRealDay(date) || !AMOUNT_PATTERN.test(amount)) {
      throw new Error(`This file is not a bank statement: line ${i + 1} is not a valid transaction.`);
    }
    const cents = parseAmount(amount);
    // parseAmount returns -0 for a bracketed or signed zero; a zero is zero.
    rows.push({ date: parseDate(date), description, cents: cents === 0 ? 0 : cents });
  }
  return rows;
}
