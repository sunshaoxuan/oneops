# OneOps Portal 視覚言語調査及び実装記録

## 調査目的

ユーザー提示の「製品構築」画面を OneOps Portal の主要画面における視覚基準として適用し、画面間でページ見出し、余白、装飾及び狭い画面の挙動をそろえる。

## 調査結論

1. 参考画面の実装は `app/builder/host_standalone_console.py` の製品構築用ページ入口に存在する。
2. Portal のワークベンチには同じブランド方針の大きなヒーロー領域が存在する。顧客情報、個人タスク、問合支援、基本台帳、システム管理及び占位機能は異なるページ固有の見出し規則を使用していた。
3. 共通 CSS クラス `portal-page-hero` と `portal-section-heading` を追加し、参考画面の白色ワークスペース、橙色の小見出し、濃紺の主見出し、橙色及び青緑色の円形装飾、角丸及び低い影を共有する構成へ整理した。
4. 顧客情報、個人タスク、問合支援、基本台帳、システム管理、占位機能、ユーザー管理、業務部門及び問合検索テンプレート、モデル設定、外部タスク設定へ共通クラスを適用した。
5. データ取得、保存、ルーティング、認可及び API 契約の変更はない。

## 実装結果

| 項目 | 成果物 | 確認内容 |
|---|---|---|
| ページ見出し | `app/apps/portal-shell/src/styles.css` | 共通背景、装飾円、見出し階層、ボタン及び管理区画のレスポンシブ規則 |
| 主要画面 | `app/apps/portal-shell/src/App.tsx`、`CustomerInformationPage.tsx`、`PersonalTasksPage.tsx`、`InquirySupportPage.tsx` | `portal-page-hero` 適用 |
| 管理画面 | `IdentityManagementPage.tsx`、`WorkforcePolicyPages.tsx`、`ModelDesignPage.tsx`、`InquirySupportSettingsPage.tsx` | `portal-section-heading` 適用 |
| 自動検証 | `app/apps/portal-shell/src/layout.test.ts` | 共通クラス、円形装飾及びページ適用数を検証 |
| 設計文書 | `docs/ONEOPS_UI_SPACING_STANDARD.md` | 参考画面の共通見出し表現と受入条件を追記 |

## 実行時確認

正式 HTTPS 入口 `https://192.168.20.54/` へ静的 Portal を公開し、認証済みブラウザーで顧客情報、個人タスク及びシステム管理を確認した。デスクトップ画面では共通ヘッダーの装飾と情報配置を確認し、幅 640px では `document.documentElement.clientWidth` と `scrollWidth` がいずれも 640px で横方向のページ溢れがなかった。対象画面のブラウザーコンソールでは警告とエラーが検出されなかった。

ローカル開発入口 `http://localhost:5174/` は起動を確認した。ログインセッションが正式 HTTPS のホストに結び付くため、ローカル入口は認証待ち表示までを確認し、ページ級の見た目確認は正式 HTTPS 入口で実施した。

## 配信結果

`publish-portal.ps1 -SkipChecks -SkipGatewayRestart -Reason portal-design-language-20260805` が成功した。Nginx 設定検査、既存 Gateway の Health `UP`、HTTPS 応答 200、ブラウザー表示及びコンソール検査を確認した。Gateway の再起動は実施していない。
