(function () {
  'use strict';

  const H = window.MatrixTableHelpers;
  const shareShell = window.DVZShareShell;
  if (!shareShell) throw new Error('DVZShareShell is required');

  const LANG = shareShell.resolveLang();
  const parsedRoute = shareShell.parseShareRoute({ lang: LANG });
  const IS_EMBED = !!parsedRoute.ok && !!parsedRoute.embed;
  shareShell.initEmbedMode(IS_EMBED);
  shareShell.patchDvzAppForShare();

  const fetchShareData = shareShell.createShareDataFetcher({
    supabaseUrl: H.DVZ_SUPABASE_URL,
    supabaseAnonKey: H.DVZ_SUPABASE_ANON_KEY,
    shareTable: H.TOOL_CONFIG.shareTable,
    restTimeoutMs: 8000,
    clientTimeoutMs: 10000,
    logPrefix: '[matrix-table-chart share]',
  });
  const { showLoading, showError, showContent } = shareShell.createUi({
    lang: LANG,
    contentDisplay: 'flex',
  });

  function unwrapConfig(config) {
    if (config?.chartData && typeof config.chartData === 'object') {
      const inner = { ...config.chartData };
      inner.chartType = config.chartType || inner.chartType || inner.settings?.selectedChart;
      return inner;
    }
    return config;
  }

  function renderSource(sourceEl, title, source, sourceUrl) {
    document.getElementById('chart-title').textContent = title || '';
    sourceEl.textContent = '';
    if (!source) return;
    sourceEl.appendChild(document.createTextNode('Source: '));
    if (!sourceUrl) {
      sourceEl.appendChild(document.createTextNode(source));
      return;
    }
    const link = document.createElement('a');
    link.href = sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source;
    sourceEl.appendChild(link);
  }

  async function main() {
    if (!parsedRoute.ok) {
      showError(parsedRoute.message || (LANG === 'ja' ? 'URLが不正です' : 'Invalid URL'));
      return;
    }
    showLoading();
    try {
      const share = await fetchShareData(parsedRoute.shareId);
      if (!share) throw new Error(LANG === 'ja' ? 'シェアデータが見つかりません' : 'Shared chart not found');
      const raw = shareShell.normalizeSharedConfig(share.chart_config);
      const config = unwrapConfig(raw);
      const spec = window.MatrixTableSettings.SETTINGS_SPEC;
      const normalized = window.DVZSettingsCompat?.normalize
        ? window.DVZSettingsCompat.normalize(config, spec)
        : config;
      const settings = { ...window.MatrixTableSettings.defaultSettings(), ...(normalized.settings || {}) };
      settings.annotateTitle = H.pickAnnotationValue(config.annotateTitle, settings.annotateTitle, share.title);
      settings.annotateSource = H.pickAnnotationValue(config.annotateSource, settings.annotateSource);
      settings.annotateSourceUrl = H.pickAnnotationValue(config.annotateSourceUrl, settings.annotateSourceUrl);
      settings.legendPosition = H.pickAnnotationValue(config.legendPosition, settings.legendPosition) || 'top-right';
      const chartType = config.chartType || settings.selectedChart;
      const entry = (window.CHART_REGISTRY || []).find((item) => item.id === chartType);
      if (!entry) throw new Error(LANG === 'ja' ? '不明なチャートタイプです' : 'Unknown chart type');

      const title = settings.annotateTitle || share.title || entry.name[LANG];
      document.title = title;
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
      renderSource(document.getElementById('chart-source'), title, settings.annotateSource, settings.annotateSourceUrl);

      const matrix = window.MatrixModel.buildMatrix(normalized.data || [], {
        rowKeyColumn: settings.rowKeyColumn,
        valueColumns: settings.valueColumns,
        orientation: settings.orientation,
        excludeTotals: settings.excludeTotals,
        alignSquare: chartType === 'chord' || chartType === 'adjacency-matrix',
      });
      const mod = window.MatrixChartModules[chartType];
      if (!mod) throw new Error('Chart module not found: ' + chartType);

      showContent();
      await shareShell.nextFrame?.();
      const container = document.getElementById('chart-container');
      const draw = () => {
        mod.render({
          container,
          matrix,
          settings,
          lang: LANG,
          animate: false,
        });
        const controls = document.getElementById('dvz-controls');
        if (controls) {
          controls.innerHTML = typeof mod.controlsHTML === 'function' ? mod.controlsHTML(LANG) : (mod.controlsHTML || '');
          mod.bindControls?.();
        }
      };
      draw();
      if (typeof ResizeObserver === 'function' && container && !container.__dvzShareResize) {
        container.__dvzShareResize = new ResizeObserver(() => draw());
        container.__dvzShareResize.observe(container);
      }
    } catch (error) {
      console.error('[matrix-table-chart share] failed', error);
      showError(error.message || (LANG === 'ja' ? '読み込みに失敗しました' : 'Failed to load chart'));
    }
  }

  main();
})();
