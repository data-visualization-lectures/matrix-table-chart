const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../js/matrix-model.js');

test('parseNumber strips commas', () => {
  assert.equal(model.parseNumber('1,234'), 1234);
  assert.equal(model.parseNumber(''), null);
  assert.equal(model.parseNumber('-'), null);
});

test('isTotalLabel detects 合計 and total', () => {
  assert.equal(model.isTotalLabel('合計'), true);
  assert.equal(model.isTotalLabel('Total'), true);
  assert.equal(model.isTotalLabel('Aさん'), false);
});

test('buildMatrix keeps crosstab without melting', () => {
  const rows = [
    { 作業: 'MTG', Aさん: '20', 中野崇: '11', 合計: '31' },
    { 作業: '学習', Aさん: '5', 中野崇: '20', 合計: '25' },
    { 作業: '合計', Aさん: '25', 中野崇: '31', 合計: '56' },
  ];
  const matrix = model.buildMatrix(rows, { excludeTotals: true });
  assert.deepEqual(matrix.rowKeys, ['MTG', '学習']);
  assert.deepEqual(matrix.colKeys, ['Aさん', '中野崇']);
  assert.equal(matrix.values[0][0], 20);
  assert.equal(matrix.values[1][1], 20);
  assert.equal(matrix.cells.length, 4);
});

test('orientation transposes groups', () => {
  const rows = [
    { 行: '北', 東: '1', 西: '2' },
    { 行: '南', 東: '3', 西: '4' },
  ];
  const matrix = model.buildMatrix(rows, { orientation: 'cols-as-groups' });
  assert.deepEqual(matrix.rowKeys, ['東', '西']);
  assert.deepEqual(matrix.colKeys, ['北', '南']);
  assert.equal(matrix.values[0][1], 3);
});

test('square OD matrix is detected after alignment', () => {
  const rows = [
    { from: '東京', 大阪: '10', 東京: '0' },
    { from: '大阪', 大阪: '0', 東京: '8' },
  ];
  const matrix = model.buildMatrix(rows, { alignSquare: true });
  assert.equal(matrix.isSquare, true);
  assert.deepEqual(matrix.colKeys, ['東京', '大阪']);
});

test('les-miserables sample is a square adjacency matrix', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const text = fs.readFileSync(path.join(__dirname, '../samples/les-miserables.csv'), 'utf8').replace(/^\uFEFF/, '');
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i];
    });
    return row;
  });
  const matrix = model.buildMatrix(rows, {
    rowKeyColumn: '登場人物',
    alignSquare: true,
    excludeTotals: true,
  });
  assert.equal(rows.length, 77);
  assert.equal(matrix.rowKeys.length, 77);
  assert.equal(matrix.colKeys.length, 77);
  assert.equal(matrix.isSquare, true);
  assert.equal(matrix.groups.Myriel, 1);
  assert.ok(!matrix.colKeys.includes('グループ'));
});

test('meta group columns are excluded from values and attached as groups', () => {
  const rows = [
    { 登場人物: 'Valjean', グループ: '8', Valjean: '4', Cosette: '2' },
    { 登場人物: 'Cosette', グループ: '8', Valjean: '2', Cosette: '1' },
  ];
  assert.deepEqual(model.inferValueColumns(['登場人物', 'グループ', 'Valjean', 'Cosette'], '登場人物'), ['Valjean', 'Cosette']);
  const matrix = model.buildMatrix(rows, { alignSquare: true, valueColumns: ['グループ', 'Valjean', 'Cosette'] });
  assert.equal(matrix.isSquare, true);
  assert.deepEqual(matrix.colKeys, ['Valjean', 'Cosette']);
  assert.equal(matrix.groups.Valjean, 8);
  assert.equal(matrix.groups.Cosette, 8);
  assert.equal(matrix.values[0][1], 2);
});
