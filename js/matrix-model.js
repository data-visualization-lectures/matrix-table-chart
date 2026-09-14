(function (root) {
  'use strict';

  const TOTAL_RE = /^(合計|総計|計|小計|grand\s*total|total|sum|subtotal)$/i;
  const META_COLUMN_RE = /^(group|グループ|cluster|クラスター)$/i;

  function parseNumber(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const text = String(value).trim().replace(/,/g, '');
    if (!text || text === '-' || text === '—') return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }

  function isTotalLabel(value) {
    return TOTAL_RE.test(String(value || '').trim());
  }

  function normalizeLabel(value) {
    return String(value || '').trim();
  }

  function unique(values) {
    const seen = new Set();
    const result = [];
    values.forEach((value) => {
      if (seen.has(value)) return;
      seen.add(value);
      result.push(value);
    });
    return result;
  }

  function inferRowKey(columns) {
    return Array.isArray(columns) && columns.length ? columns[0] : null;
  }

  function isMetaColumn(column) {
    return META_COLUMN_RE.test(String(column || '').trim());
  }

  function inferValueColumns(columns, rowKeyField) {
    return (columns || []).filter((column) => column !== rowKeyField && !isMetaColumn(column));
  }

  function transposeMatrix(matrix) {
    const rowKeys = matrix.colKeys.slice();
    const colKeys = matrix.rowKeys.slice();
    const values = rowKeys.map((_, i) => colKeys.map((_, j) => {
      const cell = matrix.values[j] ? matrix.values[j][i] : null;
      return cell;
    }));
    return {
      rowKeyField: matrix.rowKeyField,
      rowKeys,
      colKeys,
      values,
      groups: matrix.groups || {},
    };
  }

  function labelSet(keys) {
    return new Set(keys.map(normalizeLabel).filter(Boolean));
  }

  function isSquareLabels(rowKeys, colKeys) {
    if (!rowKeys.length || rowKeys.length !== colKeys.length) return false;
    const rows = labelSet(rowKeys);
    const cols = labelSet(colKeys);
    if (rows.size !== cols.size) return false;
    for (const key of rows) {
      if (!cols.has(key)) return false;
    }
    return true;
  }

  function alignSquare(matrix) {
    if (!isSquareLabels(matrix.rowKeys, matrix.colKeys)) return matrix;
    const indexByCol = new Map(matrix.colKeys.map((key, i) => [normalizeLabel(key), i]));
    const colKeys = matrix.rowKeys.map((rowKey) => {
      const matchIndex = indexByCol.get(normalizeLabel(rowKey));
      return matchIndex == null ? rowKey : matrix.colKeys[matchIndex];
    });
    const values = matrix.values.map((row) => matrix.rowKeys.map((rowKey) => {
      const matchIndex = indexByCol.get(normalizeLabel(rowKey));
      return matchIndex == null ? null : row[matchIndex];
    }));
    return { ...matrix, colKeys, values };
  }

  function buildMatrix(rows, options = {}) {
    const warnings = [];
    if (!Array.isArray(rows) || !rows.length) {
      return {
        rowKeyField: options.rowKeyColumn || null,
        rowKeys: [],
        colKeys: [],
        values: [],
        cells: [],
        isSquare: false,
        groups: {},
        warnings: ['empty'],
      };
    }

    const columns = Object.keys(rows[0] || {});
    const rowKeyField = columns.includes(options.rowKeyColumn)
      ? options.rowKeyColumn
      : inferRowKey(columns);
    const groupField = columns.find((column) => column !== rowKeyField && isMetaColumn(column)) || null;
    const excludeTotals = options.excludeTotals !== false;
    const requestedColumns = Array.isArray(options.valueColumns) && options.valueColumns.length
      ? options.valueColumns
      : inferValueColumns(columns, rowKeyField);

    let colKeys = unique(requestedColumns.filter((column) => (
      column && column !== rowKeyField && columns.includes(column) && !isMetaColumn(column)
    )));
    if (excludeTotals) colKeys = colKeys.filter((column) => !isTotalLabel(column));
    if (Array.isArray(options.excludedColKeys) && options.excludedColKeys.length) {
      const excluded = new Set(options.excludedColKeys.map(normalizeLabel));
      colKeys = colKeys.filter((column) => !excluded.has(normalizeLabel(column)));
    }

    const excludedRows = new Set((options.excludedRowKeys || []).map(normalizeLabel));
    const rowKeys = [];
    const values = [];
    const groups = {};

    rows.forEach((row) => {
      const key = normalizeLabel(row[rowKeyField]);
      if (!key) return;
      if (excludeTotals && isTotalLabel(key)) return;
      if (excludedRows.has(key)) return;
      rowKeys.push(key);
      values.push(colKeys.map((column) => parseNumber(row[column])));
      if (groupField) {
        const numeric = parseNumber(row[groupField]);
        groups[key] = numeric != null ? numeric : normalizeLabel(row[groupField]);
      }
    });

    let matrix = { rowKeyField, rowKeys, colKeys, values, groups };
    if (options.orientation === 'cols-as-groups') {
      matrix = transposeMatrix(matrix);
    }

    if (options.alignSquare) {
      matrix = alignSquare(matrix);
    }

    const cells = [];
    matrix.values.forEach((rowValues, i) => {
      rowValues.forEach((value, j) => {
        cells.push({
          row: matrix.rowKeys[i],
          col: matrix.colKeys[j],
          value,
        });
      });
    });

    const isSquare = isSquareLabels(matrix.rowKeys, matrix.colKeys);
    if (!matrix.rowKeys.length || !matrix.colKeys.length) warnings.push('no-numeric-cells');
    if (!isSquare) warnings.push('not-square');

    return {
      ...matrix,
      cells,
      isSquare,
      warnings,
    };
  }

  function toRows(matrix) {
    return matrix.rowKeys.map((rowKey, i) => {
      const record = { [matrix.rowKeyField || 'row']: rowKey };
      matrix.colKeys.forEach((colKey, j) => {
        record[colKey] = matrix.values[i][j];
      });
      return record;
    });
  }

  const api = {
    parseNumber,
    isTotalLabel,
    isMetaColumn,
    inferRowKey,
    inferValueColumns,
    transposeMatrix,
    isSquareLabels,
    alignSquare,
    buildMatrix,
    toRows,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MatrixModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
