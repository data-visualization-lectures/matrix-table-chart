const test = require('node:test');
const assert = require('node:assert/strict');
const settings = require('../js/settings-spec.js');

test('SETTINGS_SPEC starts at version 1', () => {
  assert.equal(settings.SETTINGS_SPEC.version, 1);
  assert.equal(settings.SETTINGS_SPEC.chartType, 'matrix-table-chart');
  assert.ok(settings.SETTINGS_SPEC.fields.orientation.values.includes('rows-as-groups'));
});

test('default settings keep annotations empty', () => {
  const defaults = settings.defaultSettings();
  assert.equal(defaults.annotateTitle, '');
  assert.equal(defaults.annotateSource, '');
  assert.equal(defaults.excludeTotals, true);
});

test('adjacencyOrder defaults to name without bumping spec version', () => {
  const defaults = settings.defaultSettings();
  assert.equal(settings.SETTINGS_SPEC.version, 1);
  assert.equal(defaults.adjacencyOrder, 'name');
  assert.ok(settings.CHART_TYPES.includes('adjacency-matrix'));
  assert.deepEqual(settings.SETTINGS_SPEC.fields.adjacencyOrder.values, ['name', 'count', 'group']);
});
