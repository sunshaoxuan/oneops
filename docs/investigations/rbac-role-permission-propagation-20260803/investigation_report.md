# ロール権限伝播と機能横断監査の調査記録

更新日: 2026-08-03
対象バージョン: OneOps 0.7.5

## 現象

閲覧者ロールから基本台帳の参照権限を外して代理ログインしても、基本台帳の入口と画面が利用できる状態でした。

## 原因

Gateway のセッション解決は、要求ごとに対象利用者のロールと `role_permissions` を結合して最新権限を計算していました。代理セッションも対象利用者 ID を使うため、サーバー側の認可結果はロール変更へ追従する構造でした。

Portal の基本台帳判定は `catalog.read` を参照していませんでした。第1階層入口は `organizations.read || catalog.write`、組織区分及び製品・版数画面は `catalog.write` で表示していたため、`catalog.read` を外しても入口に変化がありませんでした。認証セッションの再取得も代理開始時と画面フォーカス時に限られ、ログイン中の権限変更を画面へ継続的に反映できませんでした。

## 修正

1. 基本台帳の入口と参照画面を `catalog.read` で制御しました。
2. 組織区分及び製品・版数は `catalog.read` で参照し、追加・編集操作は `catalog.write` がある場合だけ表示します。
3. 認証セッションを 10 秒間隔で再取得し、ロール変更後の権限集合を画面へ反映します。
4. 権限のない `/master-data` を指定した場合は、描画前に利用可能な第1階層画面を選び、URL も補正します。

## 機能横断監査

同じ権限境界の漏れを、基本台帳以外の機能について入口、参照取得、変更操作、権限変更後の状態遷移の順に確認しました。

| 機能 | 確認結果 | 対応 |
| --- | --- | --- |
| 環境台帳 | `environments.read` だけの利用者にも変更操作、製品取得、資格情報操作が残っていました | `environments.write`、`catalog.read`、`environments.credentials.read/write` で入口、操作、取得を分離 |
| ユーザー管理 | `identity.roles.read` がない場合もユーザー画面からロール一覧を取得していました | ロール取得を権限で無効化し、ロール割当欄を無効化 |
| ロール・権限 | 参照画面と編集操作の分離を確認しました | `identity.roles.read/write` を維持 |
| 監査 | `audit.read` の画面と API 境界を確認しました | 追加修正なし |
| AI 設定・問合せ設定 | `models.settings.read/write` の画面、取得、更新境界を確認しました | 追加修正なし |
| 問合せ支援・個人タスク・AI 助手 | `inquiries.use`、`personal.tasks.use`、`ai.assistant.use` の入口と操作境界を確認しました | 追加修正なし |
| ダッシュボード | `dashboard.read` がない場合も取得、イベント接続、ワークベンチの無権限ショートカットが残っていました | クエリ、イベント接続、ショートカット、プログラム遷移を権限で制御 |

この監査により、基本台帳と同じ種類の問題として環境台帳、ユーザー管理のロール取得、ダッシュボードの不要取得を修正しました。ロール権限の再解決は既存の 10 秒間隔セッション取得で全機能に適用されます。

## サーバー境界

基本台帳の GET API は `catalog.read`、変更 API は `catalog.write` を要求します。組織機関 API は `organizations.read` と `organizations.write` を維持します。画面側の入口制御と API 側の認可を同じ権限体系で確認しました。

環境台帳の GET API は `environments.read`、変更 API は `environments.write`、資格情報 GET は `environments.credentials.read`、資格情報変更は `environments.credentials.write` を要求します。製品台帳 GET は `catalog.read` を要求します。ユーザー、ロール、監査、AI 設定、問合せ支援、個人タスクの API 境界も `app/gateway/auth.mjs` と各ルートで確認しました。

## 現場反映

正式データベースの `VIEWER` ロールに残っていた `catalog.read` を削除しました。対象ロールへ割り当てられた 8 利用者は、`ai.assistant.use`、`dashboard.read`、`environments.read`、`inquiries.use`、`organizations.read`、`personal.tasks.use` を維持します。変更は `ROLE_UPDATED`、`SUCCESS` として認証監査へ記録しました。
