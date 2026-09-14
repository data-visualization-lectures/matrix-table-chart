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

本番への migration / function deploy / DNS / Netlify は、対象・コマンド・ロールバックを出して承認を得てから行います。

## データ形式

先頭列が行ラベル、残りが列ラベルのクロス集計表（CSV / TSV / JSON）。

```csv
作業,Aさん,中野崇,平均男性35-44歳
【社内対面】MTG,20,11,26
【思考・挑戦】思考・企画,10,10,20
```

Mapping で行/列の向きと合計行・列の除外を選べます。melt UI はありません。

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
