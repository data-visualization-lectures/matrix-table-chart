# Matrix Table Chart

クロス集計表（行ラベル × 列ラベル、セルが交差の値）を、リスト形式に変換せず可視化する dataviz.jp の静的ツールです。

- Heatmap
- Mosaic Plot
- Stacked / 100% bar
- Parallel Coordinates（クロス集計のプロファイル読み）
- Scatterplot matrix
- Chord diagram
- Adjacency matrix

既存の `parallel-coordinates.dataviz.jp` は list 用です。本ツールは matrix（クロス集計表）専用です。

## Identity

| 項目 | 値 |
|---|---|
| `appName` / ツール id | `matrix-table-chart` |
| `chartType`（保存 payload 内） | `heatmap` / `mosaic` / `stacked-bar` / `parallel-coordinates` / `scatterplot-matrix` / `chord` / `adjacency-matrix` |
| 公開ホスト | https://matrix-table-chart.dataviz.jp |
| `scope` | `viz` |
| `gaId` | `G-7NYMBRBRWZ` |
| `exportName` | `matrix-table-chart` |
| プロジェクト保存 | `dataviz-tool-header` の `setProjectConfig` / `?projectId=` |
| 作成画面の公開 | ヘッダーのシェア（読込・保存の右）。`setShareConfig` / `shareProject()` |
| シェアテーブル | `matrix_table_chart_shares` |
| publish 関数 | `publish-matrix-table-chart-share` |
| 公開 URL | `/share.html?id=` |
| 公開操作 | Parallel Coordinates / SPLOM のブラシ Reset。Adjacency matrix の並び替え（名前 / 頻度 / クラスタ）。他は空 |

書き込みは保存済みプロジェクト必須 → Edge Function → `source_project_id` 単位の upsert。クライアントから `matrix_table_chart_shares` へ直接 INSERT しません。

## デプロイ

Netlify プロジェクト `matrix-table-chart` が GitHub `data-visualization-lectures/matrix-table-chart` の `main` を公開する。build step は無い。`netlify.toml` の publish は `.`。

- 管理画面: https://app.netlify.com/projects/matrix-table-chart
- Netlify 既定ホスト: https://matrix-table-chart.netlify.app/
- 本番 URL: https://matrix-table-chart.dataviz.jp/

カスタムドメインは DNS で次の CNAME を向ける。

```
matrix-table-chart.dataviz.jp  CNAME  matrix-table-chart.netlify.app.
```

ロールバックは Netlify の直前デプロイを restore する。サイト自体を消す場合は DNS の CNAME も削除する。

シェアテーブルの本番 migration と `publish-matrix-table-chart-share` の function deploy は、対象・コマンド・ロールバックを出して承認を得てから行う。

## データ形式

先頭列が行ラベル、2列目以降が列ラベル。セルは交差の値。リスト形式（行・列・値の3列）にはしない。CSV / TSV / JSON を読む。

```csv
地域,製品A,製品B,製品C
北,10,20,15
南,8,12,9
```

行と列が同じ集合なら正方形（移動表・隣接行列）。任意で `group` 列を置けばクラスタに使う。`合計` 行・列は Mapping で除外できる。

## 構成

- `index.html`: 統合版の入口
- `share.html`: 公開共有ページ
- `js/matrix-model.js`: クロス集計表の正規化
- `js/modules/`: 7種の D3 レンダラ
- `samples/`: locale 付きローカル fallback
- `supabase/migrations/`: シェアテーブル
- `supabase/functions/publish-matrix-table-chart-share/`: 公開書き込み

## ローカル確認

このツールは build step を持たない静的 HTML/JS ツールです。

```bash
python3 -m http.server 8000
```

- `http://127.0.0.1:8000/?auth_debug=1`
- `http://127.0.0.1:8000/?lang=en&auth_debug=1`
- `http://127.0.0.1:8000/?chart=heatmap&auth_debug=1`
- `http://127.0.0.1:8000/share.html?id=<share-id>`

## 検証

```bash
find js -name '*.js' -print0 | xargs -0 -n1 node --check
node --test tests/*.js
git diff --check
```

Git 運用は `Prj_DatavizJP/AGENTS.md` に従い、このツール単体では原則 `main` で作業します。
