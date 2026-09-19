const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('catalog back control returns to the selector with locale labels', () => {
  const html = read('index.html');
  const css = read('css/style.css');
  const runtime = read('js/core/runtime.js');

  assert.match(html, /id="chart-back-btn"/);
  assert.match(html, /aria-label="テンプレート一覧に戻る"/);
  assert.doesNotMatch(html, /text-gray-500 hover:text-gray-700/);
  assert.match(css, /#chart-back-btn/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /\.dvz-embed #chart-switcher/);
  assert.match(runtime, /applyCatalogBackButton\(\)/);
  assert.match(runtime, /goBackToSelector\(\)/);
  assert.match(runtime, /← Catalog/);
  assert.match(runtime, /Back to catalog/);
  assert.match(runtime, /searchParams\.delete\('projectId'\)/);
  assert.match(runtime, /showSelector\(\{ updateUrl: true, replace: true \}\)/);
  assert.match(runtime, /this\.header\.hidden = !isChart/);
});
