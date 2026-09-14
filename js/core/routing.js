(function (root) {
  'use strict';

  function currentLang() {
    const resolver = root.dvzResolveLocale || root.DatavizLocale?.resolve;
    return typeof resolver === 'function' ? resolver() : 'ja';
  }

  function msg(key) {
    const lang = currentLang();
    const dict = {
      shareMissingId: {
        ja: 'シェアIDが指定されていません。`share.html?id=...` を使用してください。',
        en: 'Missing share id. Use `share.html?id=...`.',
      },
      shareLegacyProjectId: {
        ja: '旧URL形式は非対応です。`share.html?id=...` を使用してください。',
        en: 'Legacy URL format is not supported. Use `share.html?id=...`.',
      },
    };
    return dict[key]?.[lang] || dict[key]?.en || key;
  }

  function clean(value) {
    if (value == null) return '';
    return String(value).trim();
  }

  function parseShareRoute(search) {
    const params = new URLSearchParams(search || location.search || '');
    if (params.has('projectId') || params.has('shareId')) {
      return {
        ok: false,
        code: 'legacy_share_route',
        message: msg('shareLegacyProjectId'),
      };
    }
    const shareId = clean(params.get('id'));
    if (!shareId) {
      return {
        ok: false,
        code: 'missing_share_id',
        message: msg('shareMissingId'),
      };
    }
    return {
      ok: true,
      shareId,
      embed: params.get('embed') === '1',
    };
  }

  root.DVZBuilderRouting = {
    parseShareRoute,
  };
})(window);
