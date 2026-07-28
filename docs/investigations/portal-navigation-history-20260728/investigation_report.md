# Portal ナビゲーション履歴調査

## 調査目的

任意の OneOps 画面で再読み込みまたはブラウザーの戻る操作を行うと、ワークベンチへ移動する問題を調査し、同じ機能を復元できるようにする。

## 原因

Portal の表示画面は React コンポーネント内の `activeNavigation` だけで管理され、初期値は常に `workbench` だった。メニュー操作はこのメモリー状態だけを更新し、URL、`history.pushState`、`popstate` を使用していなかった。

このため、次の動作となっていた。

1. 再読み込みでは React 状態が破棄され、`workbench` から再作成される。
2. メニュー遷移がブラウザー履歴へ追加されない。
3. 戻る操作を監視していないため、履歴が変化しても Portal の表示状態は変化しない。

## 修正内容

### 安定 URL

第 1 階層画面へ次の URL を割り当てた。

| 機能 | URL |
| --- | --- |
| ワークベンチ | `/` |
| 環境情報 | `/environments` |
| 問合支援 | `/inquiry-support` |
| 製品構築 | `/product-builder` |
| タスクセンター | `/tasks` |
| ナレッジ | `/knowledge` |
| コードインサイト | `/code-insight` |
| レポート | `/reports` |
| 基本台帳 | `/master-data/{section}` |
| システム管理 | `/system-management/{section}` |

基本台帳とシステム管理は第 2 階層の機能も URL に含める。

### 履歴同期

1. 初回表示時に `window.location.pathname` を解析する。
2. メニュー遷移時に `history.pushState` へ追加する。
3. 権限による補正と URL 正規化では `history.replaceState` を使用する。
4. `popstate` を監視して戻る操作と進む操作を React 状態へ反映する。
5. 権限のない機能と未知の URL は、利用可能な最初の機能へ正規化する。

## 結論

原因は URL と独立した一時的な React 状態だった。表示状態を URL と同期し、第 2 階層を含む安定した履歴モデルへ変更した。
