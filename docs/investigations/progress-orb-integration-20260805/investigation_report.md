# thinking-orbs 進行表示統合 調査及び実装記録

## 目的

ユーザー提示の `https://orbs.jakubantalik.com/` を調査し、OneOps Portal の進行表示を後続開発で再利用できる形へ統合する。

## 調査結果

1. 公式デモのライブラリ名は `thinking-orbs` であり、`ThinkingOrb` React コンポーネントを提供する。
2. 状態は九種類、サイズは `20` と `64` の二種類である。
3. npm の最新公開版は調査時点で `0.2.0`、React と React DOM の peer dependency はそれぞれ `>=18.0.0`、ライセンスは MIT である。
4. 現行 Portal は React `19.2.8`、React DOM `19.2.8`、Ant Design `6.5.1` を使用するため、依存関係上の互換条件を満たす。
5. 現行 Portal の進行表示は、ワークベンチのシステム健全性カードで Ant Design `Progress` を使用している。ここを現在の実表示検証の対象にした。

## 実装結果

1. `app/apps/portal-shell/package.json` と `app/pnpm-lock.yaml` へ `thinking-orbs@0.2.0` を追加した。
2. `app/apps/portal-shell/src/ProgressOrb.tsx` を追加し、状態、サイズ、アクセシブルなラベル及びキャンバス属性を共通入口へ集約した。
3. ワークベンチのメモリ及びディスク進行表示へ `ProgressOrb` を配置した。API の値、進捗計算、認可及び保存処理は変更していない。
4. `styles.css` へタスク表カードの最小幅とカード内横スクロール境界を追加し、640px でのページ横溢れを解消した。
5. `ProgressOrb.test.tsx` で状態、サイズ、既定値及びラベルの受け渡しを確認した。第三者キャンバスの描画処理はテストダブルで分離した。

## 制約

認証後の本番 Portal での画面検証は、実行環境の認証状態と公開処理の結果に依存する。ローカル開発画面での確認結果、正式 HTTPS 画面での確認結果、コンソール、スクリーンショットを `test_results.md` へ分けて記録する。
