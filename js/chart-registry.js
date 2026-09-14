const CHART_REGISTRY = [
  {
    id: 'heatmap',
    name: { ja: 'ヒートマップ', en: 'Heatmap' },
    description: {
      ja: 'クロス集計表のセルを色で読みます。行列のまま比較できます。',
      en: 'Color each crosstab cell without melting the matrix.',
    },
    category: { ja: '行列', en: 'Matrix' },
    thumbnail: 'thumbnails/heatmap.svg?v=2',
    sample: 'ad-spend-by-industry',
  },
  {
    id: 'adjacency-matrix',
    name: { ja: '隣接行列', en: 'Adjacency Matrix' },
    description: {
      ja: '正方形行列を並べ替えて、共起やクラスタを読みます。',
      en: 'Reorder a square matrix to read co-occurrence and clusters.',
    },
    category: { ja: '行列', en: 'Matrix' },
    thumbnail: 'thumbnails/adjacency-matrix.svg',
    sample: 'les-miserables',
  },
  {
    id: 'mosaic',
    name: { ja: 'モザイク・プロット', en: 'Mosaic Plot' },
    description: {
      ja: '行の周辺合計で幅を、列の構成で高さを分けます。',
      en: 'Row totals set width; column composition sets height.',
    },
    category: { ja: '構成', en: 'Composition' },
    thumbnail: 'thumbnails/mosaic.svg',
    sample: 'industrial-regions',
  },
  {
    id: 'stacked-bar',
    name: { ja: '積み上げバー', en: 'Stacked Bar' },
    description: {
      ja: '各行を構成比または実数の積み上げとして比較します。',
      en: 'Compare each row as a stacked or 100% composition.',
    },
    category: { ja: '構成', en: 'Composition' },
    thumbnail: 'thumbnails/stacked-bar.svg',
    sample: 'ad-spend-by-industry',
  },
  {
    id: 'parallel-coordinates',
    name: { ja: 'パラレル・コーディネイト', en: 'Parallel Coordinates' },
    description: {
      ja: 'クロス集計表の一方を軸、他方を折線にしてプロファイルを重ねます。',
      en: 'Read a crosstab as profiles: one axis of categories, one set of polylines.',
    },
    category: { ja: 'プロファイル', en: 'Profile' },
    thumbnail: 'thumbnails/parallel-coordinates.svg',
    sample: 'work-time-profile',
  },
  {
    id: 'scatterplot-matrix',
    name: { ja: '散布図行列', en: 'Scatterplot Matrix' },
    description: {
      ja: '列同士の関係を、行を点として並べて見ます。',
      en: 'Treat columns as variables and rows as points.',
    },
    category: { ja: '関係', en: 'Relation' },
    thumbnail: 'thumbnails/scatterplot-matrix.svg',
    sample: 'work-time-profile',
  },
  {
    id: 'chord',
    name: { ja: 'コード・ダイアグラム', en: 'Chord Diagram' },
    description: {
      ja: '行と列が同じ正方形行列の流れや隣接を円環で表します。',
      en: 'Show flows in a square origin-destination matrix.',
    },
    category: { ja: '流れ', en: 'Flow' },
    thumbnail: 'thumbnails/chord.svg',
    sample: 'od-migration',
  },
];

window.CHART_REGISTRY = CHART_REGISTRY;
