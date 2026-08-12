# 基本台帳の組織区分表示順 最終受入記録

実施日：2026-08-12

## 原要求

基本台帳の「組織区分」を「組織機関」より前に表示する。

## 最終受入一覧

| 項目 | 成果物 | 検証証拠 | 結果 |
| --- | --- | --- | --- |
| 横型メニュー順 | `App.tsx` の基本台帳メニューを「組織区分、組織機関、製品・版数」の順に構成 | Desktop Browser DOM と `basic-master-organization-classification-first-20260812.png` | 合格 |
| 既定表示 | 基本台帳の初回遷移先を組織区分に設定 | `/master-data` から `/master-data/organization-classifications` へ遷移し、組織区分が選択済み | 合格 |
| 直接 URL 復元 | 組織機関の直接 URL を維持 | `/master-data/organizations` の再読込後も組織機関を表示 | 合格 |
| 権限制御 | 既存の `catalog.read` と `organizations.read` 条件を維持 | `layout.test.ts` の順序及び既定表示試験 | 合格 |
| Desktop 表示 | 1294 px の表示領域で横方向のページ超過がない | `scrollWidth=1279`、`innerWidth=1294` | 合格 |
| Narrow 表示 | 390 px で組織区分を先頭に表示し、横型メニューの超過分は既存の省略メニューを使用 | `basic-master-organization-classification-first-narrow-20260812.png`、`scrollWidth=375`、`innerWidth=390` | 合格 |
| Console | Browser の Warning と Error がない | Desktop 0 件、Narrow 0 件 | 合格 |
| 要求文書 | 表示順、既定表示、権限時の先頭選択規則を記録 | `BASIC_MASTER_MANAGEMENT_REQUIREMENTS.md` | 合格 |
| Frontend 品質 | Gateway、Builder、Portal、Production Build | Gateway 286 件、Builder 14 件、Portal 224 件、Build 成功 | 合格 |
| Backend 品質 | Spring Boot Test | 41 件、失敗 0、Error 0、Skip 8 | 合格 |
| 運用品質 | 配信 Script Test と frontend only 配信 | 9 Script、全判定 true、`delivery_succeeded` | 合格 |
| Git 配信 | 正式 Branch へ限定変更を Push | `f3708ff2130daed541d809b7f5ac857693989323`、`HEAD=origin/master` | 合格 |

## 証拠ファイル

1. `docs/evidence/basic-master-organization-classification-first-20260812.png`
2. `docs/evidence/basic-master-organization-classification-first-narrow-20260812.png`

## 結論

原要求、関連する既定表示、権限制御、URL 復元、Desktop と Narrow の実行時表示、Console、Test、Build、配信及び Git 配信を全て確認し、最終受入一覧の全項目を合格とする。
