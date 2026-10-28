/**
 * Utility functions for exporting data to CSV, Excel-compatible CSV, and JSON formats.
 */

/**
 * Escapes a cell value for CSV (handles quotes, commas, newlines).
 */
const escapeCSVCell = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Exports an array of objects to a downloadable CSV file.
 * Includes UTF-8 BOM so Excel opens special characters and currencies properly.
 * 
 * @param {Array<Object>} data Array of records to export
 * @param {string} filename Output file name (e.g. 'expenses_export.csv')
 * @param {Array<{ key: string, label: string, formatter?: (item: any) => any }>} columns Column definitions
 */
export const exportToCSV = (data, filename = 'export.csv', columns = []) => {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Determine headers
  let headers = [];
  if (columns.length > 0) {
    headers = columns.map(c => escapeCSVCell(c.label));
  } else {
    headers = Object.keys(data[0]).map(k => escapeCSVCell(k));
  }

  // Determine rows
  const rows = data.map(item => {
    if (columns.length > 0) {
      return columns.map(col => {
        const val = col.formatter ? col.formatter(item) : item[col.key];
        return escapeCSVCell(val);
      }).join(',');
    } else {
      return Object.values(item).map(val => escapeCSVCell(val)).join(',');
    }
  });

  // UTF-8 BOM prefix for Excel compatibility
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports data to a formatted JSON file.
 * 
 * @param {any} data Data to export
 * @param {string} filename Output file name
 */
export const exportToJSON = (data, filename = 'export.json') => {
  if (!data) {
    alert('No data available to export.');
    return;
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
