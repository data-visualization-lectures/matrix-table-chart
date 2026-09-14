(function (root) {
  'use strict';

  const H = () => root.MatrixTableHelpers;
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
  const AD_SPEND_SOURCE_URL = 'https://www.dentsu.co.jp/knowledge/ad_cost/2025/koukokuhi.html';
  const SAMPLE_META = {
    'ad-spend-by-industry': {
      ja: {
        source: '電通「日本の広告費」2025年 業種別広告費（マスコミ四媒体別、衛星メディア関連を除く）',
        sourceUrl: AD_SPEND_SOURCE_URL,
      },
      en: {
        source: 'Dentsu, Advertising Expenditures in Japan 2025 (four mass media, excluding satellite media)',
        sourceUrl: AD_SPEND_SOURCE_URL,
      },
    },
    'les-miserables': {
      ja: {
        source: 'Donald Knuth, The Stanford GraphBase（Les Misérables 登場人物の章共起）',
        sourceUrl: 'https://bost.ocks.org/mike/miserables/',
      },
      en: {
        source: 'Donald Knuth, The Stanford GraphBase (Les Misérables character co-occurrence)',
        sourceUrl: 'https://bost.ocks.org/mike/miserables/',
      },
    },
  };
  const SQUARE_CHARTS = new Set(['chord', 'adjacency-matrix']);

  class MatrixTableApp {
    constructor() {
      this.config = H().TOOL_CONFIG;
      this.lang = H().resolveLocale();
      this.settings = root.MatrixTableSettings.defaultSettings();
      this.rawData = [];
      this.columns = [];
      this.matrix = null;
      this.dataName = '';
      this.dataSource = null;
      this.currentChartId = null;
      this.currentProjectId = null;
      this.currentProjectName = null;
      this.hasLoadedProject = false;
      this.projectLoadStarted = false;
      this.lastSavedSerialized = null;
      this.resizeObserver = null;
      this.animateNext = false;
    }

    init() {
      H().dvzInitGA(this.config.gaId);
      this.mountShell();
      this.mountSidebar();
      H().dvzApplyI18n();
      this.adapter = {
        getSettings: () => this.getSettings(),
        applySettings: (settings) => this.applySettings(settings),
        render: () => this.render(),
      };
      this.bindStaticUi();
      this.renderSelector();
      this.setupHeader();
      this.syncView('selector');

      const params = new URLSearchParams(location.search);
      const projectId = params.get('projectId');
      const chart = params.get('chart');
      const dataUrl = params.get('data_url');
      if (projectId) {
        this.projectLoadStarted = true;
        this.header?.loadProject?.(projectId);
        return;
      }
      if (chart && this.getRegistryEntry(chart)) {
        void this.selectChart(chart, { updateUrl: false });
        return;
      }
      if (dataUrl) {
        void this.selectChart('heatmap', { updateUrl: false });
      }
    }

    mountShell() {
      if (root.DVZEditorShell?.mount) {
        root.DVZEditorShell.mount({
          appSelector: '.dvz-app',
          headerSelector: 'dataviz-tool-header',
        });
      }
    }

    mountSidebar() {
      const spec = root.MatrixTableSettings.SIDEBAR_SPEC;
      if (root.DVZSettingSidebar?.mount) {
        root.DVZSettingSidebar.mount({
          root: '#dvz-sidebar',
          defaultTabId: spec.tabs[0].id,
          spec,
          adapter: {
            getSettings: () => this.getSettings(),
            applySettings: (settings) => this.applySettings(settings),
            render: () => this.render(),
          },
        });
      }
    }

    get header() {
      return document.querySelector('dataviz-tool-header');
    }

    getRegistryEntry(id) {
      return (root.CHART_REGISTRY || []).find((entry) => entry.id === id) || null;
    }

    bindStaticUi() {
      document.getElementById('chart-back-btn')?.addEventListener('click', () => this.showSelector());
      document.getElementById('annotate-apply-btn')?.addEventListener('click', () => {
        this.readAnnotateFromDom();
        this.renderChart(false);
      });
      ['annotate-title', 'annotate-source', 'annotate-source-url', 'legend-position'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', () => {
          this.readAnnotateFromDom();
          this.renderChart(false);
        });
      });
      document.getElementById('export-svg-btn')?.addEventListener('click', async () => {
        H().dvzShowProcessingToast(H().t('書き出し中です', 'Exporting'));
        await H().exportSvg(this.config.exportName);
      });
      document.getElementById('export-png-btn')?.addEventListener('click', async () => {
        H().dvzShowProcessingToast(H().t('書き出し中です', 'Exporting'));
        await H().exportPng(this.config.exportName);
      });
      document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportCsv());
      document.getElementById('export-json-btn')?.addEventListener('click', () => this.exportJson());

      H().dvzInitFileUpload((parsed) => {
        this.applyRows(parsed.data, parsed.filename, { source: 'upload' });
      });

      const mapping = document.getElementById('tab-mapping');
      mapping?.addEventListener('change', (event) => {
        if (event.target.closest('#mapping-fields')) this.readMappingFromDom();
      });
      const style = document.getElementById('tab-style');
      style?.addEventListener('change', (event) => {
        if (event.target.closest('#style-fields')) this.readStyleFromDom();
      });
    }

    renderSelector() {
      const grid = document.getElementById('chart-selector-grid');
      if (!grid) return;
      grid.innerHTML = '';
      (root.CHART_REGISTRY || []).forEach((entry, index) => {
        const card = document.createElement('a');
        card.href = `?chart=${encodeURIComponent(entry.id)}`;
        card.className = 'dvz-catalog-card';
        card.dataset.surface = ['canvas', 'soft', 'soft-alt'][index % 3];
        card.innerHTML = `
          <span class="dvz-catalog-card__panel">
            <span class="dvz-catalog-card__header">
              <span class="dvz-catalog-card__eyebrow">${entry.category[this.lang]}</span>
            </span>
            <span class="dvz-catalog-card__body">
              <span class="dvz-catalog-card__thumbnail" aria-hidden="true">
                <img class="dvz-catalog-card__thumbnail-image" src="${entry.thumbnail}" alt="">
              </span>
              <h2 class="dvz-catalog-card__title">${entry.name[this.lang]}</h2>
              <p class="dvz-catalog-card__description">${entry.description[this.lang]}</p>
            </span>
            <span class="dvz-catalog-card__footer">
              <span class="dvz-catalog-card__meta">${this.lang === 'en' ? 'Create chart' : 'チャートを作成する'}</span>
              <span class="dvz-catalog-card__glyph" aria-hidden="true">↗</span>
            </span>
          </span>`;
        card.addEventListener('click', (event) => {
          event.preventDefault();
          this.selectChart(entry.id);
        });
        grid.appendChild(card);
      });
    }

    syncView(mode) {
      const app = document.querySelector('.dvz-app');
      app?.setAttribute('data-dvz-view', mode);
      const chart = document.getElementById('dvz-chart');
      const sidebar = document.getElementById('dvz-sidebar');
      const selector = document.getElementById('chart-selector');
      const isChart = mode === 'chart';
      if (chart) {
        chart.hidden = !isChart;
        chart.setAttribute('aria-hidden', String(!isChart));
      }
      if (sidebar) {
        sidebar.hidden = !isChart;
        sidebar.setAttribute('aria-hidden', String(!isChart));
      }
      if (selector) selector.hidden = isChart;
      if (this.header) this.header.hidden = !isChart;
      document.body.dataset.dvzToolHeader = isChart ? 'visible' : 'hidden';
    }

    showSelector() {
      this.currentChartId = null;
      this.syncView('selector');
      this.applyHeaderButtons();
      const url = new URL(location.href);
      url.searchParams.delete('chart');
      history.replaceState({}, '', url);
    }

    async selectChart(chartId, { updateUrl = true } = {}) {
      const entry = this.getRegistryEntry(chartId);
      if (!entry) return;
      this.currentChartId = chartId;
      this.settings.selectedChart = chartId;
      this.syncView('chart');
      this.applyHeaderButtons();
      document.getElementById('chart-type-name').textContent = entry.name[this.lang];
      this.updateStyleVisibility();
      if (updateUrl) {
        const url = new URL(location.href);
        url.searchParams.set('chart', chartId);
        history.replaceState({}, '', url);
      }
      this.setupSampleConfig();
      if (!this.shouldSkipAutoSampleLoad() && !this.hasStickyData()) {
        await this.loadDefaultSample(entry);
      } else {
        this.rebuildMatrix();
      }
      this.renderChart(false);
      this.observeResize();
      requestAnimationFrame(() => this.renderChart(false));
    }

    shouldSkipAutoSampleLoad() {
      return this.hasLoadedProject || this.projectLoadStarted || !!new URLSearchParams(location.search).get('projectId');
    }

    hasStickyData() {
      return this.dataSource === 'upload' || this.dataSource === 'project' || this.dataSource === 'data_url';
    }

    setupHeader() {
      const header = this.header;
      if (!header) return;

      const waitReady = () => new Promise((resolve) => {
        if (typeof header.setProjectConfig === 'function') {
          resolve();
          return;
        }
        const timer = setInterval(() => {
          if (typeof header.setProjectConfig === 'function') {
            clearInterval(timer);
            resolve();
          }
        }, 50);
        setTimeout(() => {
          clearInterval(timer);
          resolve();
        }, 4000);
      });

      waitReady().then(() => {
        this.applyHeaderButtons();
        if (typeof header.setProjectConfig === 'function') {
          header.setProjectConfig({
            appName: this.config.appName,
            onProjectLoad: (data, meta) => this.onProjectLoad(data, meta),
            onProjectSave: (meta) => {
              this.currentProjectId = meta?.id || meta?.project?.id || this.currentProjectId;
              this.currentProjectName = meta?.name || meta?.project?.name || this.currentProjectName;
              this.lastSavedSerialized = JSON.stringify(this.getWrappedProjectData());
            },
            onProjectDelete: () => {
              this.currentProjectId = null;
              this.currentProjectName = null;
            },
          });
        }
        if (typeof header.setShareConfig === 'function') {
          header.setShareConfig({
            getSavePayload: () => this.buildSavePayload(),
            getShareTitle: () => this.settings.annotateTitle || this.currentProjectName || this.config.title,
            publishShare: ({ projectId, title }) => this.publishShare({ projectId, title }),
          });
        }
        this.setupSampleConfig();
        const projectId = new URLSearchParams(location.search).get('projectId');
        if (projectId && header.loadProject) header.loadProject(projectId);
      });
    }

    applyHeaderButtons() {
      const header = this.header;
      if (!header?.setConfig) return;
      const compact = window.matchMedia('(max-width: 640px)').matches;
      header.setConfig({
        logo: { type: 'text', text: 'Matrix' },
        buttons: this.currentChartId ? [
          {
            label: compact ? '読込' : (this.lang === 'en' ? 'Load' : 'プロジェクトの読込'),
            action: () => header.showLoadModal(),
            align: 'right',
          },
          {
            label: compact ? '保存' : (this.lang === 'en' ? 'Save' : 'プロジェクトの保存'),
            action: async () => {
              H().dvzShowProcessingToast(H().t('保存準備中です', 'Preparing save...'));
              const payload = await this.buildSavePayload();
              if (!payload?.data) {
                header.showMessage?.(H().t('保存するデータがありません', 'No data to save'), 'error');
                return;
              }
              header.showSaveModal(payload);
            },
            align: 'right',
          },
          {
            label: compact ? 'シェア' : (this.lang === 'en' ? 'Share' : 'シェア'),
            action: () => header.shareProject?.(),
            align: 'right',
          },
        ] : [],
      });
    }

    setupSampleConfig() {
      const header = this.header;
      if (!header?.setSampleConfig || !this.currentChartId) return;
      header.setSampleConfig({
        toolId: `${this.config.appName}/${this.currentChartId}`,
        onSampleSelect: async (detail) => {
          if (detail?.url) await this.loadFromUrl(detail.url, detail.format, detail.name, { sampleDetail: detail });
        },
      });
    }

    async loadDefaultSample(entry) {
      if (this.shouldSkipAutoSampleLoad()) return;
      if (new URLSearchParams(location.search).get('data_url')) {
        await this.ensureLaunchDataUrl();
        return;
      }
      const sampleId = entry?.sample;
      const locale = this.lang === 'en' ? 'en' : 'ja';
      const path = SAMPLE_FILES[sampleId]?.[locale] || SAMPLE_FILES[sampleId]?.ja;
      if (!path) return;
      await this.loadFromUrl(path, 'csv', sampleId, {
        background: true,
        annotation: this.localSampleAnnotation(sampleId),
      });
    }

    ensureLaunchDataUrl() {
      if (this._dataUrlLoad) return this._dataUrlLoad;
      const dataUrl = new URLSearchParams(location.search).get('data_url');
      if (!dataUrl || this.shouldSkipAutoSampleLoad()) {
        this._dataUrlLoad = Promise.resolve(false);
        return this._dataUrlLoad;
      }
      this._dataUrlLoad = this.loadFromUrl(dataUrl, null, null, {
        background: true,
        source: 'data_url',
      }).then(() => this.dataSource === 'data_url' && this.rawData.length > 0);
      return this._dataUrlLoad;
    }

    localSampleAnnotation(sampleId) {
      const meta = SAMPLE_META[sampleId];
      if (!meta) return undefined;
      const rec = this.lang === 'en' ? (meta.en || meta.ja) : (meta.ja || meta.en);
      if (!rec) return undefined;
      return { title: '', source: rec.source || '', sourceUrl: rec.sourceUrl || '' };
    }

    parseCompatibleToolToken(token) {
      const value = String(token || '').trim();
      const slash = value.indexOf('/');
      if (slash === -1) return { baseTool: value, chartKey: null };
      return { baseTool: value.slice(0, slash), chartKey: value.slice(slash + 1) || null };
    }

    pickSampleUrl(entry) {
      const locale = (root.DatavizLocale?.resolve || root.dvzResolveLocale || (() => this.lang))();
      if (locale === 'en') return entry.fileUrlEn || entry.fileUrl;
      return entry.fileUrl || entry.fileUrlEn;
    }

    async autoLoadFromCatalog() {
      if (this.shouldSkipAutoSampleLoad()) return false;
      try {
        const catalogUrl = (root.datavizAuthUrl || 'https://app.dataviz.jp') + '/catalog.json';
        const res = await fetch(catalogUrl, { signal: AbortSignal.timeout(4000) });
        if (this.shouldSkipAutoSampleLoad()) return false;
        if (!res.ok) return false;
        const catalog = await res.json();
        const entries = (catalog.entries || []).filter((entry) => {
          return (entry.compatibleTools || []).some((token) => {
            const parsed = this.parseCompatibleToolToken(token);
            return parsed.baseTool === this.config.appName && parsed.chartKey === this.currentChartId;
          });
        });
        if (!entries.length) return false;
        const first = entries[Math.floor(Math.random() * entries.length)];
        const url = this.pickSampleUrl(first);
        const name = this.lang === 'en' ? (first.nameEn || first.name) : first.name;
        if (!url) return false;
        await this.loadFromUrl(url, first.format || 'csv', name, {
          background: true,
          fallbackOnError: true,
          annotation: {
            title: '',
            source: this.lang === 'en' ? (first.sourceEn || first.source || '') : (first.source || first.sourceEn || ''),
            sourceUrl: this.lang === 'en' ? (first.sourceUrlEn || first.sourceUrl || '') : (first.sourceUrl || first.sourceUrlEn || ''),
          },
        });
        return this.rawData.length > 0;
      } catch (_error) {
        return false;
      }
    }

    async loadFromUrl(url, format, name, options = {}) {
      if (options.background && this.shouldSkipAutoSampleLoad()) return;
      if (!options.background) H().dvzShowProcessingToast(H().t('サンプルを読み込んでいます', 'Loading sample'));
      try {
        const res = await fetch(url);
        if (options.background && this.shouldSkipAutoSampleLoad()) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (options.background && this.shouldSkipAutoSampleLoad()) return;
        const filename = url.split('/').pop() || `${name || 'data'}.${format || 'csv'}`;
        const rows = H().parseTableText(text, filename);
        this.applyRows(rows, name || filename, { source: options.source || 'sample', annotation: options.annotation });
      } catch (error) {
        console.error('[matrix-table-chart] sample load failed', error);
        if (options.source === 'data_url') {
          H().dvzShowToast(H().t('データを読み込めませんでした', 'Failed to load data'), 'error');
          return;
        }
        if (options.fallbackOnError) {
          const entry = this.getRegistryEntry(this.currentChartId);
          const sampleId = entry?.sample;
          const path = SAMPLE_FILES[sampleId]?.[this.lang] || SAMPLE_FILES[sampleId]?.ja;
          if (path && path !== url) {
            await this.loadFromUrl(path, 'csv', sampleId, {
              background: true,
              annotation: this.localSampleAnnotation(sampleId),
            });
          }
        }
      }
    }

    applyRows(rows, name, meta = {}) {
      this.rawData = Array.isArray(rows) ? rows : [];
      this.columns = this.rawData[0] ? Object.keys(this.rawData[0]) : [];
      this.dataName = name || '';
      if (meta.source) this.dataSource = meta.source;
      this.settings.rowKeyColumn = this.columns.includes(this.settings.rowKeyColumn)
        ? this.settings.rowKeyColumn
        : root.MatrixModel.inferRowKey(this.columns);
      const inferred = root.MatrixModel.inferValueColumns(this.columns, this.settings.rowKeyColumn)
        .filter((column) => !root.MatrixModel.isTotalLabel(column));
      const keepExisting = (this.settings.valueColumns || []).filter((column) => inferred.includes(column));
      this.settings.valueColumns = keepExisting.length ? keepExisting : inferred;
      if (meta.annotation) {
        this.settings.annotateTitle = meta.annotation.title || '';
        this.settings.annotateSource = meta.annotation.source || '';
        this.settings.annotateSourceUrl = meta.annotation.sourceUrl || '';
      }
      try {
        this.syncDataPanel();
        this.syncMappingPanel();
        this.syncStylePanel();
        this.syncAnnotatePanel();
        this.rebuildMatrix();
      } catch (error) {
        console.error('[matrix-table-chart] applyRows failed', error);
      }
      this.renderChart(false);
    }

    rebuildMatrix() {
      this.matrix = root.MatrixModel.buildMatrix(this.rawData, {
        rowKeyColumn: this.settings.rowKeyColumn,
        valueColumns: this.settings.valueColumns,
        orientation: this.settings.orientation,
        excludeTotals: this.settings.excludeTotals,
        alignSquare: SQUARE_CHARTS.has(this.currentChartId),
      });
      this.updateSquareWarning();
    }

    updateSquareWarning() {
      const el = document.getElementById('square-warning');
      if (!el) return;
      const show = SQUARE_CHARTS.has(this.currentChartId) && this.matrix && !this.matrix.isSquare;
      el.textContent = H().tKey('squareWarning');
      el.hidden = !show;
    }

    updateStyleVisibility() {
      document.querySelectorAll('[data-chart-style]').forEach((node) => {
        const ids = node.getAttribute('data-chart-style').split(/\s+/);
        node.hidden = !ids.includes(this.currentChartId) && !ids.includes('all');
      });
    }

    syncDataPanel() {
      const meta = document.getElementById('data-meta-content');
      const preview = document.getElementById('data-preview-content');
      if (meta) {
        meta.textContent = this.rawData.length
          ? `${this.dataName || 'data'} · ${this.rawData.length} ${H().tKey('metaRows')} × ${this.columns.length} ${H().tKey('metaCols')}`
          : H().tKey('noDataLoaded');
      }
      if (preview) {
        preview.innerHTML = '';
        if (!this.rawData.length) {
          preview.textContent = H().tKey('dataPreviewEmpty');
          return;
        }
        const table = document.createElement('table');
        table.className = 'dvz-preview-table';
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        this.columns.forEach((column) => {
          const th = document.createElement('th');
          th.textContent = column;
          headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        this.rawData.slice(0, 5).forEach((row) => {
          const tr = document.createElement('tr');
          this.columns.forEach((column) => {
            const td = document.createElement('td');
            td.textContent = row[column] == null ? '' : String(row[column]);
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        preview.appendChild(table);
      }
    }

    syncMappingPanel() {
      const rowKey = document.getElementById('map-row-key');
      const cols = document.getElementById('map-value-columns');
      const orientation = document.getElementById('map-orientation');
      const totals = document.getElementById('map-exclude-totals');
      if (rowKey) {
        rowKey.innerHTML = this.columns.map((column) => {
          const selected = column === this.settings.rowKeyColumn ? ' selected' : '';
          return `<option value="${escapeHtml(column)}"${selected}>${escapeHtml(column)}</option>`;
        }).join('');
      }
      if (cols) {
        cols.innerHTML = this.columns.filter((column) => (
          column !== this.settings.rowKeyColumn && !root.MatrixModel.isMetaColumn(column)
        )).map((column) => {
          const checked = this.settings.valueColumns.includes(column) ? ' checked' : '';
          return `<label class="dvz-check"><input type="checkbox" value="${escapeHtml(column)}"${checked}><span>${escapeHtml(column)}</span></label>`;
        }).join('');
      }
      if (orientation) orientation.value = this.settings.orientation;
      if (totals) totals.checked = this.settings.excludeTotals !== false;
      this.updateSquareWarning();
    }

    syncStylePanel() {
      const scheme = document.getElementById('style-color-scheme');
      const showValues = document.getElementById('style-show-values');
      const stackedMode = document.getElementById('style-stacked-mode');
      const diverging = document.getElementById('style-heatmap-diverging');
      const splomMax = document.getElementById('style-splom-max');
      if (scheme) scheme.value = this.settings.colorScheme;
      if (showValues) showValues.checked = !!this.settings.showValues;
      if (stackedMode) stackedMode.value = this.settings.stackedMode;
      if (diverging) diverging.checked = !!this.settings.heatmapDiverging;
      if (splomMax) splomMax.value = String(this.settings.splomMaxAxes);
      this.updateStyleVisibility();
    }

    syncAnnotatePanel() {
      const title = document.getElementById('annotate-title');
      const source = document.getElementById('annotate-source');
      const sourceUrl = document.getElementById('annotate-source-url');
      const legend = document.getElementById('legend-position');
      if (title) title.value = this.settings.annotateTitle || '';
      if (source) source.value = this.settings.annotateSource || '';
      if (sourceUrl) sourceUrl.value = this.settings.annotateSourceUrl || '';
      if (legend) legend.value = this.settings.legendPosition || 'top-right';
    }

    readMappingFromDom() {
      this.settings.rowKeyColumn = document.getElementById('map-row-key')?.value || this.settings.rowKeyColumn;
      this.settings.orientation = document.getElementById('map-orientation')?.value || this.settings.orientation;
      this.settings.excludeTotals = !!document.getElementById('map-exclude-totals')?.checked;
      this.settings.valueColumns = Array.from(document.querySelectorAll('#map-value-columns input:checked')).map((input) => input.value);
      this.rebuildMatrix();
      this.renderChart(true);
    }

    readStyleFromDom() {
      this.settings.colorScheme = document.getElementById('style-color-scheme')?.value || this.settings.colorScheme;
      this.settings.showValues = !!document.getElementById('style-show-values')?.checked;
      this.settings.stackedMode = document.getElementById('style-stacked-mode')?.value || this.settings.stackedMode;
      this.settings.heatmapDiverging = !!document.getElementById('style-heatmap-diverging')?.checked;
      this.settings.splomMaxAxes = Number(document.getElementById('style-splom-max')?.value || 6);
      this.renderChart(true);
    }

    readAnnotateFromDom() {
      this.settings.annotateTitle = document.getElementById('annotate-title')?.value || '';
      this.settings.annotateSource = document.getElementById('annotate-source')?.value || '';
      this.settings.annotateSourceUrl = document.getElementById('annotate-source-url')?.value || '';
      this.settings.legendPosition = document.getElementById('legend-position')?.value || 'none';
    }

    chartContainer() {
      return document.querySelector('#dvz-chart #chart-container')
        || document.getElementById('chart-container');
    }

    renderChart(animate) {
      if (this._rendering) return;
      const container = this.chartContainer();
      if (!container || !this.currentChartId) return;
      this._rendering = true;
      try {
        if ((!this.matrix || !this.matrix.rowKeys.length) && this.rawData.length) {
          this.rebuildMatrix();
        }
        const title = this.settings.annotateTitle || '';
        const source = this.settings.annotateSource || '';
        const titleEl = document.getElementById('chart-title');
        if (titleEl) titleEl.textContent = title;
        const sourceEl = document.getElementById('chart-source');
        if (sourceEl) {
          sourceEl.textContent = '';
          if (source) {
            const url = this.settings.annotateSourceUrl;
            if (url) {
              sourceEl.appendChild(document.createTextNode('Source: '));
              const link = document.createElement('a');
              link.href = url;
              link.target = '_blank';
              link.rel = 'noopener';
              link.textContent = source;
              sourceEl.appendChild(link);
            } else {
              sourceEl.appendChild(document.createTextNode(source));
            }
          }
        }

        if (!this.matrix || !this.matrix.rowKeys.length) {
          if (this.rawData.length) {
            container.innerHTML = `<div class="empty-state">${this.lang === 'en'
              ? 'Could not build a matrix from the loaded table.'
              : '読み込んだ表から行列を組み立てられませんでした。'}</div>`;
            return;
          }
          container.innerHTML = `<div class="empty-state">${this.lang === 'en' ? 'Upload a crosstab CSV' : 'クロス集計表の CSV を読み込んでください'}</div>`;
          return;
        }

        const mod = root.MatrixChartModules?.[this.currentChartId];
        if (!mod?.render) {
          container.innerHTML = `<div class="empty-state">${this.lang === 'en'
            ? `No renderer for ${this.currentChartId}`
            : `${this.currentChartId} の描画モジュールがありません`}</div>`;
          return;
        }
        mod.render({
          container,
          matrix: this.matrix,
          settings: this.settings,
          lang: this.lang,
          animate: !!animate,
        });
        this.renderLegend(mod);
        this.setControls(mod);
      } catch (error) {
        console.error('[matrix-table-chart] render failed', error);
        container.innerHTML = `<div class="empty-state">${escapeHtml(error?.message || String(error))}</div>`;
      } finally {
        this._rendering = false;
      }
    }

    renderLegend(mod) {
      let legend = document.getElementById('dvz-legend');
      if (!legend) {
        legend = document.createElement('div');
        legend.id = 'dvz-legend';
        this.chartContainer()?.appendChild(legend);
      }
      legend.className = this.settings.legendPosition === 'none' ? '' : this.settings.legendPosition;
      legend.innerHTML = '';
      if (this.settings.legendPosition === 'none') return;
      const seriesCharts = ['stacked-bar', 'mosaic', 'parallel-coordinates', 'chord'];
      if (!seriesCharts.includes(this.currentChartId) || !this.matrix) return;
      const colors = H().seriesColors(this.matrix.colKeys.length, 'tableau');
      this.matrix.colKeys.forEach((key, i) => {
        const item = document.createElement('div');
        item.className = 'dvz-legend-item';
        item.innerHTML = `<span class="dvz-legend-swatch" style="background:${colors[i]}"></span><span>${escapeHtml(key)}</span>`;
        legend.appendChild(item);
      });
      void mod;
    }

    setControls(mod) {
      const controls = document.getElementById('dvz-controls');
      if (!controls) return;
      const html = typeof mod.controlsHTML === 'function' ? mod.controlsHTML(this.lang) : (mod.controlsHTML || '');
      controls.innerHTML = html;
      if (typeof mod.bindControls === 'function') mod.bindControls();
    }

    observeResize() {
      const target = document.getElementById('chart-area') || this.chartContainer();
      if (!target || typeof ResizeObserver !== 'function') return;
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.matrix?.rowKeys?.length) return;
        this.renderChart(false);
      });
      this.resizeObserver.observe(target);
    }

    getSettings() {
      return { ...this.settings, selectedChart: this.currentChartId };
    }

    applySettings(next) {
      this.settings = { ...root.MatrixTableSettings.defaultSettings(), ...(next || {}) };
      if (next?.selectedChart && next.selectedChart !== this.currentChartId) {
        this.currentChartId = next.selectedChart;
      }
      this.syncMappingPanel();
      this.syncStylePanel();
      this.syncAnnotatePanel();
      this.rebuildMatrix();
      this.renderChart(true);
    }

    render() {
      this.renderChart(false);
    }

    getChartData() {
      if (!this.rawData.length) return null;
      const spec = root.MatrixTableSettings.SETTINGS_SPEC;
      const payload = root.DVZSettingsCompat?.build
        ? root.DVZSettingsCompat.build(spec, { data: this.rawData, settings: { ...this.settings, selectedChart: this.currentChartId } })
        : { version: 1, chartType: spec.chartType, data: this.rawData, settings: this.settings };
      payload.chartType = this.currentChartId;
      payload.annotateTitle = this.settings.annotateTitle;
      payload.annotateSource = this.settings.annotateSource;
      payload.annotateSourceUrl = this.settings.annotateSourceUrl;
      payload.legendPosition = this.settings.legendPosition;
      payload.settings = payload.settings || {};
      payload.settings.annotateTitle = this.settings.annotateTitle;
      payload.settings.annotateSource = this.settings.annotateSource;
      payload.settings.annotateSourceUrl = this.settings.annotateSourceUrl;
      payload.settings.legendPosition = this.settings.legendPosition;
      payload.settings.selectedChart = this.currentChartId;
      return payload;
    }

    getWrappedProjectData() {
      const chartData = this.getChartData();
      if (!chartData || !this.currentChartId) return null;
      return {
        version: 1,
        chartType: this.currentChartId,
        chartData,
      };
    }

    async buildSavePayload() {
      const data = this.getWrappedProjectData();
      if (!data) return null;
      let thumbnailDataUri = null;
      try {
        thumbnailDataUri = await H().generateThumbnail();
      } catch (_error) {
        thumbnailDataUri = null;
      }
      return {
        name: this.currentProjectName || this.dataName || this.config.title,
        data,
        thumbnailDataUri,
        existingProjectId: this.currentProjectId,
      };
    }

    async onProjectLoad(projectData, meta) {
      this.hasLoadedProject = true;
      this.projectLoadStarted = true;
      if (meta?.isGroupProject) {
        this.currentProjectId = null;
        this.currentProjectName = null;
      } else {
        this.currentProjectId = meta?.id || meta?.project?.id || this.currentProjectId;
        this.currentProjectName = meta?.name || meta?.project?.name || this.currentProjectName;
      }
      const wrapped = projectData?.chartData ? projectData : { chartType: projectData?.chartType, chartData: projectData };
      const chartType = wrapped.chartType || wrapped.chartData?.settings?.selectedChart || wrapped.chartData?.chartType;
      if (chartType && chartType !== this.currentChartId) {
        await this.selectChart(chartType, { updateUrl: false });
      }
      this.loadChartData(wrapped.chartData || wrapped);
      this.lastSavedSerialized = JSON.stringify(this.getWrappedProjectData());
    }

    loadChartData(payload) {
      const spec = root.MatrixTableSettings.SETTINGS_SPEC;
      const normalized = root.DVZSettingsCompat?.normalize
        ? root.DVZSettingsCompat.normalize(payload, spec)
        : payload;
      const settings = { ...root.MatrixTableSettings.defaultSettings(), ...(normalized.settings || {}) };
      settings.annotateTitle = H().pickAnnotationValue(payload?.annotateTitle, settings.annotateTitle);
      settings.annotateSource = H().pickAnnotationValue(payload?.annotateSource, settings.annotateSource);
      settings.annotateSourceUrl = H().pickAnnotationValue(payload?.annotateSourceUrl, settings.annotateSourceUrl);
      settings.legendPosition = H().pickAnnotationValue(payload?.legendPosition, settings.legendPosition) || 'top-right';
      this.settings = settings;
      this.applyRows(normalized.data || payload.data || [], this.dataName, { source: 'project' });
    }

    async publishShare({ projectId, title } = {}) {
      const savedProjectId = String(projectId || this.currentProjectId || '').trim();
      if (!savedProjectId) {
        throw new Error(H().t('シェアする前にプロジェクトを保存してください', 'Save the project before sharing.'));
      }
      H().dvzShowProcessingToast(H().t('シェアを作成中です', 'Creating share...'));
      const result = await H().dvzPublishShareFromProject({
        projectId: savedProjectId,
        fallbackTitle: title || this.settings.annotateTitle || this.currentProjectName || this.config.title,
      });
      const shareId = result.shareId || result.id;
      if (!shareId) throw new Error('No share ID returned');
      return {
        shareId,
        shareUrl: `${this.config.publicShareOrigin}/share.html?id=${encodeURIComponent(shareId)}`,
      };
    }

    exportCsv() {
      if (!this.matrix) return;
      const rows = root.MatrixModel.toRows(this.matrix);
      const text = d3.csvFormat(rows);
      H().downloadBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), `${this.config.exportName}.csv`);
    }

    exportJson() {
      const payload = this.getChartData();
      H().downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${this.config.exportName}.json`);
    }

    restoreFromShare(config) {
      const chartType = config.chartType || config.settings?.selectedChart;
      this.currentChartId = chartType;
      this.settings.selectedChart = chartType;
      this.syncView('chart');
      this.loadChartData(config);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  root.MatrixTableApp = MatrixTableApp;
})(window);
