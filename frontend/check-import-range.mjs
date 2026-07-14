import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { expandWorksheetRange } from './src/services/worksheetRange.ts';

const sheet = {
    '!ref': 'A1:J33',
    A1: { t: 's', v: 'Data' },
    H366: { t: 'n', v: -12.34 },
};

expandWorksheetRange(sheet);
assert.equal(sheet['!ref'], 'A1:H366');
assert.equal(XLSX.utils.sheet_to_json(sheet, { header: 1 })[365][7], -12.34);
