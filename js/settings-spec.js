(function (root) {
  'use strict';

  const CHART_TYPES = [
    'heatmap',
    'mosaic',
    'stacked-bar',
    'parallel-coordinates',
    'scatterplot-matrix',
    'chord',
    'adjacency-matrix',
  ];

  const SETTINGS_SPEC = {
    version: 1,
    chartType: 'matrix-table-chart',
    fields: {
      selectedChart: { type: 'enum', default: 'heatmap', values: CHART_TYPES },
      rowKeyColumn: { type: 'string', default: null, nullable: true },
      valueColumns: { type: 'array', default: [], itemType: 'string' },
      orientation: {
        type: 'enum',
        default: 'rows-as-groups',
        values: ['rows-as-groups', 'cols-as-groups'],
      },
      excludeTotals: { type: 'boolean', default: true },
      colorScheme: {
        type: 'enum',
        default: 'blues',
        values: ['blues', 'oranges', 'greens', 'purples', 'viridis', 'inferno', 'rdylbu', 'tableau'],
      },
      showValues: { type: 'boolean', default: false },
      stackedMode: {
        type: 'enum',
        default: 'percent',
        values: ['absolute', 'percent'],
      },
      heatmapDiverging: { type: 'boolean', default: false },
      splomMaxAxes: { type: 'number', default: 6, min: 2, max: 8 },
      adjacencyOrder: {
        type: 'enum',
        default: 'name',
        values: ['name', 'count', 'group'],
      },
      annotateTitle: { type: 'string', default: null, nullable: true },
      annotateSource: { type: 'string', default: null, nullable: true },
      annotateSourceUrl: { type: 'string', default: null, nullable: true },
      legendPosition: {
        type: 'enum',
        default: 'top-right',
        values: ['none', 'top-right', 'bottom-right'],
      },
    },
    migrations: [],
  };

  const SIDEBAR_SPEC = {
    tabs: [
      { id: 'tab-data', label: { ja: 'データ', en: 'Data' } },
      { id: 'tab-mapping', label: { ja: 'マッピング', en: 'Mapping' } },
      { id: 'tab-style', label: { ja: 'スタイル', en: 'Style' } },
      { id: 'tab-annotate', label: { ja: '注釈', en: 'Annotate' } },
      { id: 'tab-export', label: { ja: '出力', en: 'Export' } },
    ],
  };

  function defaultSettings() {
    return {
      selectedChart: 'heatmap',
      rowKeyColumn: null,
      valueColumns: [],
      orientation: 'rows-as-groups',
      excludeTotals: true,
      colorScheme: 'blues',
      showValues: false,
      stackedMode: 'percent',
      heatmapDiverging: false,
      splomMaxAxes: 6,
      adjacencyOrder: 'name',
      annotateTitle: '',
      annotateSource: '',
      annotateSourceUrl: '',
      legendPosition: 'top-right',
    };
  }

  root.MatrixTableSettings = {
    CHART_TYPES,
    SETTINGS_SPEC,
    SIDEBAR_SPEC,
    defaultSettings,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.MatrixTableSettings;
}
