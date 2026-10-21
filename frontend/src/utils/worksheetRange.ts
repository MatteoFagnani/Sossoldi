import * as XLSX from 'xlsx';

export const expandWorksheetRange = (sheet: XLSX.WorkSheet) => {
    let range: XLSX.Range | undefined;
    for (const address of Object.keys(sheet)) {
        if (address.startsWith('!')) continue;
        const cell = XLSX.utils.decode_cell(address);
        if (!range) range = { s: { ...cell }, e: { ...cell } };
        else {
            range.s.r = Math.min(range.s.r, cell.r);
            range.s.c = Math.min(range.s.c, cell.c);
            range.e.r = Math.max(range.e.r, cell.r);
            range.e.c = Math.max(range.e.c, cell.c);
        }
    }
    if (range) sheet['!ref'] = XLSX.utils.encode_range(range);
};
