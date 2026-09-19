(function (root) {
  'use strict';

  const TOOL_CONFIG = {
    appName: 'matrix-table-chart',
    title: 'Matrix Table Chart',
    gaId: 'G-7NYMBRBRWZ',
    exportName: 'matrix-table-chart',
    shareTable: 'matrix_table_chart_shares',
    publicShareOrigin: 'https://matrix-table-chart.dataviz.jp',
    publishFunction: 'publish-matrix-table-chart-share',
  };

  const DVZ_SUPABASE_URL = 'https://vebhoeiltxspsurqoxvl.supabase.co';
  const DVZ_SUPABASE_ANON_KEY = 'sb_publishable_sAjwbAhC0jnIRjNa34QuTA_CcksMYQG';

  function resolveLocale() {
    try {
      const lang = new URLSearchParams(location.search).get('lang');
      if (lang === 'en' || lang === 'ja') return lang;
    } catch (_) { /* ignore */ }
    const resolver = root.dvzResolveLocale || root.DatavizLocale?.resolve;
    if (typeof resolver === 'function') {
      return resolver() === 'en' ? 'en' : 'ja';
    }
    const htmlLang = String(document.documentElement?.lang || '').toLowerCase();
    return htmlLang.startsWith('en') ? 'en' : 'ja';
  }

  function t(ja, en) {
    return resolveLocale() === 'en' ? en : ja;
  }

  const I18N = {
    ja: {
      tabData: 'データ',
      tabMapping: 'マッピング',
      tabStyle: 'スタイル',
      tabAnnotate: '注釈',
      tabExport: '出力',
      tabSelect: 'タブを選択',
      tabList: '設定',
      upload: 'アップロード',
      dropHere: 'CSV / TSV / JSON をドロップ',
      orClick: 'またはクリックして選択',
      dataFormatHint: '先頭列が行ラベル、残りが列ラベルのクロス集計表を読みます。リスト形式への変換は不要です。',
      loadedData: '読込済みデータ',
      noDataLoaded: 'データ未読込',
      dataPreviewTitle: 'データプレビュー（先頭5行）',
      dataPreviewEmpty: 'プレビューできるデータがありません',
      metaRows: '行',
      metaCols: '列',
      mapRowLabels: '行ラベル',
      mapValueColumns: '値の列',
      mapOrientation: '向き',
      mapRowsAsGroups: '行をグループに',
      mapColsAsGroups: '列をグループに',
      mapExcludeTotals: '合計行・列を除外',
      squareWarning: 'このチャートは行ラベルと列ヘッダが同じ正方形行列が必要です。ヒートマップを使うか、ラベルを揃えてください。',
      styleColor: '配色',
      styleShowValues: '値を表示',
      styleStackedMode: '積み上げ方式',
      styleStackedPercent: '100%',
      styleStackedAbsolute: '実数',
      styleCenterAtZero: '0を中心に配色',
      styleSplomAxes: 'SPLOM軸',
      annotateTitle: 'タイトル',
      annotateTitlePlaceholder: 'チャートタイトル',
      annotateSource: '出典',
      annotateSourcePlaceholder: 'データソース名',
      annotateSourceUrl: '出典URL',
      annotateLegend: '凡例',
      legendNone: 'なし',
      legendTopRight: '右上',
      legendBottomRight: '右下',
      apply: '適用',
      exportImage: '画像',
      exportData: 'データ',
    },
    en: {
      tabData: 'Data',
      tabMapping: 'Mapping',
      tabStyle: 'Style',
      tabAnnotate: 'Annotate',
      tabExport: 'Export',
      tabSelect: 'Select a tab',
      tabList: 'Settings',
      upload: 'Upload',
      dropHere: 'Drop CSV / TSV / JSON here',
      orClick: 'or click to select',
      dataFormatHint: 'Reads a crosstab with row labels in the first column and column labels in the rest. No melt to list format.',
      loadedData: 'Loaded Data',
      noDataLoaded: 'No data loaded',
      dataPreviewTitle: 'Data Preview (First 5 Rows)',
      dataPreviewEmpty: 'No previewable data',
      metaRows: 'rows',
      metaCols: 'cols',
      mapRowLabels: 'Row labels',
      mapValueColumns: 'Value columns',
      mapOrientation: 'Orientation',
      mapRowsAsGroups: 'Rows as groups',
      mapColsAsGroups: 'Columns as groups',
      mapExcludeTotals: 'Exclude total rows and columns',
      squareWarning: 'This chart needs a square matrix with matching row and column labels. Use Heatmap, or map matching labels.',
      styleColor: 'Color',
      styleShowValues: 'Show values',
      styleStackedMode: 'Stacked mode',
      styleStackedPercent: '100%',
      styleStackedAbsolute: 'Absolute',
      styleCenterAtZero: 'Center colors at 0',
      styleSplomAxes: 'SPLOM axes',
      annotateTitle: 'Title',
      annotateTitlePlaceholder: 'Chart title',
      annotateSource: 'Source',
      annotateSourcePlaceholder: 'Data source name',
      annotateSourceUrl: 'Source URL',
      annotateLegend: 'Legend',
      legendNone: 'None',
      legendTopRight: 'Top Right',
      legendBottomRight: 'Bottom Right',
      apply: 'Apply',
      exportImage: 'Image',
      exportData: 'Data',
    },
  };

  function tKey(key) {
    const lang = resolveLocale() === 'en' ? 'en' : 'ja';
    return I18N[lang][key] || I18N.ja[key] || key;
  }

  function dvzApplyI18n() {
    const lang = resolveLocale() === 'en' ? 'en' : 'ja';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const text = tKey(el.getAttribute('data-i18n'));
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
        return;
      }
      el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', tKey(el.getAttribute('data-i18n-aria')));
    });
  }

  function pickAnnotationValue(...values) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value;
    }
    for (const value of values) {
      if (typeof value === 'string') return value;
    }
    return '';
  }

  function dvzInitGA(gaId) {
    if (!gaId) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    root.dataLayer = root.dataLayer || [];
    root.gtag = function gtag() { root.dataLayer.push(arguments); };
    root.gtag('js', new Date());
    root.gtag('config', gaId);
  }

  function dvzShowToast(msg, type) {
    const header = document.querySelector('dataviz-tool-header');
    if (header && typeof header.showMessage === 'function') {
      header.showMessage(msg, type || 'success');
      return;
    }
    console.log(`[${type || 'info'}] ${msg}`);
  }

  function dvzShowProcessingToast(msg, duration = 5000) {
    const header = document.querySelector('dataviz-tool-header');
    if (header && typeof header.showMessage === 'function') {
      header.showMessage(msg, 'info', duration);
    }
  }

  function dvzInstallHeaderProcessingToasts(header) {
    if (!header || header.__dvzProcessingToastsInstalled === '1') return;
    const wrap = (method, message) => {
      if (typeof header[method] !== 'function') return;
      const original = header[method].bind(header);
      header[method] = function (...args) {
        dvzShowProcessingToast(message);
        return original(...args);
      };
    };
    wrap('showLoadModal', t('プロジェクト一覧を取得しています', 'Loading project list'));
    wrap('loadProject', t('プロジェクトを読み込んでいます', 'Loading project'));
    wrap('saveProject', t('プロジェクトを保存しています', 'Saving project'));
    header.__dvzProcessingToastsInstalled = '1';
  }

  async function dvzGetDatavizAccessToken() {
    const header = document.querySelector('dataviz-tool-header');
    if (header && typeof header.getAccessToken === 'function') {
      const token = await header.getAccessToken();
      if (token) return token;
    }
    if (root.datavizAuthClient?.getAccessToken) {
      return root.datavizAuthClient.getAccessToken();
    }
    if (root.datavizSupabase?.auth?.getSession) {
      const { data } = await root.datavizSupabase.auth.getSession();
      return data?.session?.access_token || null;
    }
    return null;
  }

  function escapeHtmlAttr(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function buildPublicSharePageUrl(shareId) {
    return `${TOOL_CONFIG.publicShareOrigin}/share.html?id=${encodeURIComponent(shareId)}`;
  }

  function buildIframeEmbedCode(shareId, rawTitle) {
    const src = `${buildPublicSharePageUrl(shareId)}&embed=1`;
    const base = String(rawTitle || '').trim();
    const title = escapeHtmlAttr(base ? `${base} - ${TOOL_CONFIG.title}` : TOOL_CONFIG.title);
    const style = [
      'display:block',
      'width:100%',
      'max-width:100%',
      'height:auto',
      'aspect-ratio:16/10',
      'border:0',
      'margin:0 auto',
      'padding:0',
      'overflow:hidden',
      'max-height:calc(100vh - 24px)',
      'max-height:calc(100dvh - 24px)',
    ].join(';');
    return `<iframe title="${title}" src="${src}" frameborder="0" scrolling="auto" allow="fullscreen; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" allowfullscreen="true" style="${style}"></iframe>`;
  }

  async function dvzPublishShareFromProject(options = {}) {
    const projectId = String(options.projectId || '').trim();
    if (!projectId) {
      throw new Error(t('シェアする前にプロジェクトを保存してください', 'Save the project before sharing.'));
    }
    const accessToken = await dvzGetDatavizAccessToken();
    if (!accessToken) throw new Error('Login required');

    const response = await fetch(`${DVZ_SUPABASE_URL}/functions/v1/${TOOL_CONFIG.publishFunction}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dataviz-Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        projectId,
        fallbackTitle: String(options.fallbackTitle || '').trim() || null,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || `Share publish failed (${response.status})`);
    }
    return payload || {};
  }

  function parseTableText(text, filename) {
    const name = String(filename || '').toLowerCase();
    const trimmed = String(text || '').replace(/^\uFEFF/, '');
    if (name.endsWith('.json')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
      if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
      throw new Error('JSON must be an array of row objects');
    }
    if (typeof d3 === 'undefined') throw new Error('d3 is required');
    if (name.endsWith('.tsv') || /\t/.test(trimmed.split('\n')[0] || '')) {
      return d3.tsvParse(trimmed);
    }
    return d3.csvParse(trimmed);
  }

  function dvzInitFileUpload(onFileLoaded) {
    const dropzone = document.getElementById('dvz-dropzone');
    const fileInput = document.getElementById('dvz-file-input');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) handleFile(fileInput.files[0], onFileLoaded);
    });
    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
      const file = event.dataTransfer.files[0];
      if (file) handleFile(file, onFileLoaded);
    });
  }

  function handleFile(file, onFileLoaded) {
    dvzShowProcessingToast(t('ファイルを読み込んでいます', 'Loading file'));
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseTableText(reader.result, file.name);
        onFileLoaded?.({ type: file.name.endsWith('.json') ? 'json' : 'csv', data, filename: file.name, raw: reader.result });
      } catch (error) {
        dvzShowToast(error.message || String(error), 'error');
      }
    };
    reader.readAsText(file);
  }

  function formatNumber(value) {
    if (value == null || !Number.isFinite(value)) return '';
    return new Intl.NumberFormat(resolveLocale() === 'en' ? 'en-US' : 'ja-JP', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  function colorInterpolator(scheme) {
    const map = {
      blues: d3.interpolateBlues,
      oranges: d3.interpolateOranges,
      greens: d3.interpolateGreens,
      purples: d3.interpolatePurples,
      viridis: d3.interpolateViridis,
      inferno: d3.interpolateInferno,
      rdylbu: d3.interpolateRdYlBu,
    };
    return map[scheme] || d3.interpolateBlues;
  }

  function seriesColors(count, scheme) {
    if (scheme === 'tableau' || count <= 10) {
      const palette = d3.schemeTableau10;
      return d3.range(count).map((i) => palette[i % palette.length]);
    }
    const interp = colorInterpolator(scheme);
    return d3.range(count).map((i) => interp(count === 1 ? 0.65 : 0.2 + (0.7 * i) / (count - 1)));
  }

  function showTooltip(event, html) {
    const el = document.getElementById('tooltip');
    if (!el) return;
    el.innerHTML = html;
    el.style.display = 'block';
    el.style.left = `${event.clientX + 12}px`;
    el.style.top = `${event.clientY + 12}px`;
  }

  function hideTooltip() {
    const el = document.getElementById('tooltip');
    if (el) el.style.display = 'none';
  }

  function applyLabelStroke(selection) {
    selection
      .attr('fill', '#111827')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .style('paint-order', 'stroke');
  }

  function measureContainer(container) {
    const rect = container.getBoundingClientRect();
    return {
      width: Math.max(320, Math.floor(rect.width || container.clientWidth || 640)),
      height: Math.max(280, Math.floor(rect.height || container.clientHeight || 420)),
    };
  }

  function createSvg(container, width, height) {
    if (typeof container.replaceChildren === 'function') container.replaceChildren();
    else container.innerHTML = '';
    return d3.select(container)
      .append('svg')
      .attr('id', 'wrapper')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', '100%')
      .attr('height', '100%');
  }

  async function exportSvg(filename) {
    const svg = document.querySelector('#chart-container svg');
    if (!svg) throw new Error('No chart');
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${filename}.svg`);
  }

  async function exportPng(filename) {
    const svg = document.querySelector('#chart-container svg');
    if (!svg) throw new Error('No chart');
    const clone = svg.cloneNode(true);
    const width = svg.viewBox.baseVal.width || svg.clientWidth || 800;
    const height = svg.viewBox.baseVal.height || svg.clientHeight || 600;
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        downloadBlob(blob, `${filename}.png`);
        resolve();
      }, 'image/png');
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function generateThumbnail() {
    const svg = document.querySelector('#chart-container svg');
    if (!svg) return null;
    const clone = svg.cloneNode(true);
    const width = svg.viewBox.baseVal.width || 800;
    const height = svg.viewBox.baseVal.height || 600;
    clone.setAttribute('width', '640');
    clone.setAttribute('height', String(Math.round((640 * height) / width)));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = Math.round((640 * height) / width);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/png');
  }

  root.MatrixTableHelpers = {
    TOOL_CONFIG,
    DVZ_SUPABASE_URL,
    DVZ_SUPABASE_ANON_KEY,
    resolveLocale,
    t,
    tKey,
    dvzApplyI18n,
    pickAnnotationValue,
    dvzInitGA,
    dvzShowToast,
    dvzShowProcessingToast,
    dvzInstallHeaderProcessingToasts,
    dvzPublishShareFromProject,
    buildPublicSharePageUrl,
    buildIframeEmbedCode,
    parseTableText,
    dvzInitFileUpload,
    formatNumber,
    colorInterpolator,
    seriesColors,
    showTooltip,
    hideTooltip,
    applyLabelStroke,
    measureContainer,
    createSvg,
    exportSvg,
    exportPng,
    generateThumbnail,
    downloadBlob,
  };

  root.dvzInitGA = dvzInitGA;
  root.dvzApplyI18n = dvzApplyI18n;
  root.dvzShowToast = dvzShowToast;
  root.dvzShowProcessingToast = dvzShowProcessingToast;
  root.dvzInitFileUpload = dvzInitFileUpload;
  root.dvzPublishShareFromProject = dvzPublishShareFromProject;
})(typeof window !== 'undefined' ? window : globalThis);
