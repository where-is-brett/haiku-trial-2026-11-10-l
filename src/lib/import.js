// src/lib/import.js

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
