# 組織機関選択候補 Code 順表示 調査記録

更新日: 2026-08-05

## 目的

業務画面上部の組織機関選択欄で、候補を機関 Code の昇順に表示する。

## 確認した実装経路

`AuthenticatedPortal` から `ContextBar` へ組織機関配列を渡し、`ContextBar` が Ant Design の `Select` 用 Option を生成する。

変更前は API の返却順をそのまま Option へ使用していたため、候補の表示順が機関 Code の昇順になっていなかった。

## 実装

Option 生成前に組織機関配列をコピーし、既存の `compareLocalizedText` で機関 Code を昇順比較する。元の配列は変更しない。

`compareLocalizedText` は数字部分の自然順比較と現在の画面ロケールを使用する。候補の `Code Name` 表示及び Code、正式名称、略称による検索契約は維持する。

## 変更範囲

1. `app/apps/portal-shell/src/App.tsx`
2. `app/apps/portal-shell/src/layout.test.ts`
3. `docs/ORGANIZATION_CONTEXT_REQUIREMENTS.md`

## 判定

機関 Code の昇順表示を Option 生成境界へ追加した。単体試験、完全検査、Build、配信及びブラウザー実画面を最終受入で確認する。
