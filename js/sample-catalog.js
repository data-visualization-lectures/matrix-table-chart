(function (root) {
  'use strict';

  const APP_NAME = 'matrix-table-chart';
  const CHART_IDS = [
    'heatmap',
    'adjacency-matrix',
    'mosaic',
    'stacked-bar',
    'parallel-coordinates',
    'scatterplot-matrix',
    'chord',
  ];
  const TOOL_TOKENS = [APP_NAME].concat(CHART_IDS.map((id) => APP_NAME + '/' + id));
  const SAMPLE_FILES = {
    'ad-spend-by-industry': {
      ja: 'samples/ad-spend-by-industry.csv',
      en: 'samples/ad-spend-by-industry.en.csv',
    },
    'industrial-regions': {
      ja: 'samples/industrial-regions.csv',
      en: 'samples/industrial-regions.en.csv',
    },
    'work-time-profile': {
      ja: 'samples/work-time-profile.csv',
      en: 'samples/work-time-profile.en.csv',
    },
    'od-migration': {
      ja: 'samples/od-migration.csv',
      en: 'samples/od-migration.en.csv',
    },
    'les-miserables': {
      ja: 'samples/les-miserables.csv',
      en: 'samples/les-miserables.en.csv',
    },
  };

  const SAMPLE_ENTRIES = [
    {
      id: 'mtc-ad-spend-by-industry',
      sampleId: 'ad-spend-by-industry',
      name: '業種別広告費（マスコミ四媒体）',
      nameEn: 'Ad spend by industry (four mass media)',
      description: '業種×媒体のクロス集計。セルは広告費（億円）。',
      descriptionEn: 'Industry × media crosstab. Cells are advertising spend (100 million yen).',
      tags: ['広告', '業種', 'クロス集計'],
      tagsEn: ['Advertising', 'Industry', 'Crosstab'],
      columns: ['業種', '新聞', '雑誌', 'ラジオ', '地上波テレビ'],
      columnsEn: ['industry', 'newspaper', 'magazine', 'radio', 'tv'],
      rowCount: 22,
      dataAsOf: '2025年',
      source: '電通「日本の広告費」2025年 業種別広告費（マスコミ四媒体別、衛星メディア関連を除く）',
      sourceEn: 'Dentsu, Advertising Expenditures in Japan 2025 (four mass media, excluding satellite media)',
      sourceUrl: 'https://www.dentsu.co.jp/knowledge/ad_cost/2025/koukokuhi.html',
    },
    {
      id: 'mtc-industrial-regions',
      sampleId: 'industrial-regions',
      name: '工業地帯の業種構成',
      nameEn: 'Industrial regions by sector',
      description: '工業地帯×業種の構成比クロス集計。',
      descriptionEn: 'Industrial region × sector composition crosstab.',
      tags: ['産業', '地域', '構成'],
      tagsEn: ['Industry', 'Region', 'Composition'],
      columns: ['地域', '機械', '金属', '化学', '食料品', 'せんい', 'その他'],
      columnsEn: ['region', 'machinery', 'metals', 'chemicals', 'food', 'textiles', 'other'],
      rowCount: 9,
      source: 'データの道具箱サンプルデータ',
      sourceEn: 'Data Toolbox sample data',
      sourceUrl: '',
    },
    {
      id: 'mtc-work-time-profile',
      sampleId: 'work-time-profile',
      name: '作業時間プロファイル',
      nameEn: 'Work-time profile',
      description: '作業×人の時間配分クロス集計。',
      descriptionEn: 'Task × person time-allocation crosstab.',
      tags: ['仕事', '時間', 'プロファイル'],
      tagsEn: ['Work', 'Time', 'Profile'],
      columns: ['作業', 'Aさん', '中野崇', '平均男性35-44歳'],
      columnsEn: ['task', 'Person A', 'Nakano Takashi', 'Average men 35-44'],
      rowCount: 20,
      source: 'データの道具箱サンプルデータ',
      sourceEn: 'Data Toolbox sample data',
      sourceUrl: '',
    },
    {
      id: 'mtc-od-migration',
      sampleId: 'od-migration',
      name: '都市間移動',
      nameEn: 'City-to-city movement',
      description: '出発地と到着地が同じ正方形の移動行列。',
      descriptionEn: 'Square origin–destination matrix of city-to-city movement.',
      tags: ['移動', 'OD', '正方形'],
      tagsEn: ['Movement', 'OD', 'Square'],
      columns: ['出発', '東京', '大阪', '名古屋', '福岡'],
      columnsEn: ['origin', 'Tokyo', 'Osaka', 'Nagoya', 'Fukuoka'],
      rowCount: 4,
      source: 'データの道具箱サンプルデータ',
      sourceEn: 'Data Toolbox sample data',
      sourceUrl: '',
    },
    {
      id: 'mtc-les-miserables',
      sampleId: 'les-miserables',
      name: 'レ・ミゼラブル登場人物の共起',
      nameEn: 'Les Misérables character co-occurrence',
      description: '登場人物の章共起を正方形行列にしたもの。group 列はクラスタ。',
      descriptionEn: 'Character co-occurrence as a square matrix. The group column is the cluster.',
      tags: ['ネットワーク', '共起', '隣接行列'],
      tagsEn: ['Network', 'Co-occurrence', 'Adjacency matrix'],
      columns: ["登場人物", "グループ", "Myriel", "Napoleon", "Mlle.Baptistine", "Mme.Magloire", "CountessdeLo", "Geborand", "Champtercier", "Cravatte", "Count", "OldMan", "Labarre", "Valjean", "Marguerite", "Mme.deR", "Isabeau", "Gervais", "Tholomyes", "Listolier", "Fameuil", "Blacheville", "Favourite", "Dahlia", "Zephine", "Fantine", "Mme.Thenardier", "Thenardier", "Cosette", "Javert", "Fauchelevent", "Bamatabois", "Perpetue", "Simplice", "Scaufflaire", "Woman1", "Judge", "Champmathieu", "Brevet", "Chenildieu", "Cochepaille", "Pontmercy", "Boulatruelle", "Eponine", "Anzelma", "Woman2", "MotherInnocent", "Gribier", "Jondrette", "Mme.Burgon", "Gavroche", "Gillenormand", "Magnon", "Mlle.Gillenormand", "Mme.Pontmercy", "Mlle.Vaubois", "Lt.Gillenormand", "Marius", "BaronessT", "Mabeuf", "Enjolras", "Combeferre", "Prouvaire", "Feuilly", "Courfeyrac", "Bahorel", "Bossuet", "Joly", "Grantaire", "MotherPlutarch", "Gueulemer", "Babet", "Claquesous", "Montparnasse", "Toussaint", "Child1", "Child2", "Brujon", "Mme.Hucheloup"],
      columnsEn: ["character", "group", "Myriel", "Napoleon", "Mlle.Baptistine", "Mme.Magloire", "CountessdeLo", "Geborand", "Champtercier", "Cravatte", "Count", "OldMan", "Labarre", "Valjean", "Marguerite", "Mme.deR", "Isabeau", "Gervais", "Tholomyes", "Listolier", "Fameuil", "Blacheville", "Favourite", "Dahlia", "Zephine", "Fantine", "Mme.Thenardier", "Thenardier", "Cosette", "Javert", "Fauchelevent", "Bamatabois", "Perpetue", "Simplice", "Scaufflaire", "Woman1", "Judge", "Champmathieu", "Brevet", "Chenildieu", "Cochepaille", "Pontmercy", "Boulatruelle", "Eponine", "Anzelma", "Woman2", "MotherInnocent", "Gribier", "Jondrette", "Mme.Burgon", "Gavroche", "Gillenormand", "Magnon", "Mlle.Gillenormand", "Mme.Pontmercy", "Mlle.Vaubois", "Lt.Gillenormand", "Marius", "BaronessT", "Mabeuf", "Enjolras", "Combeferre", "Prouvaire", "Feuilly", "Courfeyrac", "Bahorel", "Bossuet", "Joly", "Grantaire", "MotherPlutarch", "Gueulemer", "Babet", "Claquesous", "Montparnasse", "Toussaint", "Child1", "Child2", "Brujon", "Mme.Hucheloup"],
      rowCount: 77,
      source: 'Donald Knuth, The Stanford GraphBase（Les Misérables 登場人物の章共起）',
      sourceEn: 'Donald Knuth, The Stanford GraphBase (Les Misérables character co-occurrence)',
      sourceUrl: 'https://bost.ocks.org/mike/miserables/',
    },
  ];

  function resolveFileUrl(rel) {
    try {
      return new URL(rel, location.href).href;
    } catch (_error) {
      return rel;
    }
  }

  function toPickerEntry(entry) {
    const files = SAMPLE_FILES[entry.sampleId];
    return {
      id: entry.id,
      name: entry.name,
      nameEn: entry.nameEn,
      description: entry.description,
      descriptionEn: entry.descriptionEn,
      format: 'csv',
      tableShape: 'matrix',
      tags: entry.tags,
      tagsEn: entry.tagsEn,
      columns: entry.columns,
      columnsEn: entry.columnsEn,
      rowCount: entry.rowCount,
      fileUrl: resolveFileUrl(files.ja),
      fileUrlEn: resolveFileUrl(files.en),
      thumbnailUrl: null,
      compatibleTools: TOOL_TOKENS.slice(),
      category: 'tabular',
      dataAsOf: entry.dataAsOf || null,
      source: entry.source || '',
      sourceEn: entry.sourceEn || '',
      sourceUrl: entry.sourceUrl || '',
    };
  }

  function getLocalEntries() {
    return SAMPLE_ENTRIES.map(toPickerEntry);
  }

  function annotationFor(sampleId, lang) {
    const entry = SAMPLE_ENTRIES.find((item) => item.sampleId === sampleId);
    const en = lang === 'en';
    return {
      title: '',
      source: entry
        ? (en ? (entry.sourceEn || entry.source || '') : (entry.source || entry.sourceEn || ''))
        : '',
      sourceUrl: entry?.sourceUrl || '',
    };
  }

  function mergeEntries(existing, extra) {
    const merged = [];
    const seen = new Set();
    (existing || []).concat(extra || []).forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const key = entry.id || entry.fileUrl;
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(entry);
    });
    return merged;
  }

  function installPickerPatch() {
    if (root.__mtcSamplePickerPatchInstalled) return;
    root.__mtcSamplePickerPatchInstalled = true;

    const install = () => {
      const Picker = root.customElements && root.customElements.get && root.customElements.get('dataviz-sample-picker');
      if (!Picker || !Picker.prototype || Picker.prototype.__mtcSamplePatchInstalled) return;
      const originalOpen = Picker.prototype.open;
      if (typeof originalOpen !== 'function') return;

      Picker.prototype.open = async function (...args) {
        const result = await originalOpen.apply(this, args);
        const localEntries = getLocalEntries();
        if (localEntries.length) {
          this._entries = mergeEntries(this._entries || [], localEntries);
          this._filteredEntries = this._entries;
          if (typeof this._renderList === 'function') this._renderList();
          else if (typeof this._renderModal === 'function') this._renderModal();
        }
        return result;
      };
      Picker.prototype.__mtcSamplePatchInstalled = true;
    };

    install();
    if (root.customElements && typeof root.customElements.whenDefined === 'function') {
      root.customElements.whenDefined('dataviz-sample-picker').then(install).catch(() => {});
    }
  }

  root.MatrixSampleCatalog = {
    SAMPLE_FILES,
    SAMPLE_ENTRIES,
    getLocalEntries,
    annotationFor,
    installPickerPatch,
  };
})(typeof window !== 'undefined' ? window : globalThis);
