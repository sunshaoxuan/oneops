# Backlog API 利用可否調査

調査日: 2026-08-05
対象スペース: `https://nisshin30.backlog.com/`

## 1. 結論

### 1.1 API の追加料金

Backlog API は API 専用の追加契約として案内されていません。Backlog の料金ページにはフリープランが掲載され、公式 API のレート制限資料は Free と Paid の両方を対象にしています。したがって、API を使うためだけに上位プランへ変更する必要は、公式資料からは確認できません。

フリープランと有料プランでは API のレート制限が異なります。現在の実効値は API の `/api/v2/rateLimit` で確認する仕様です。大量同期や高頻度処理では、契約プランと現在の残数を別途確認する必要があります。

参照:

1. https://backlog.com/ja/pricing/
2. https://developer.nulab.com/docs/backlog/rate-limit/
3. https://developer.nulab.com/ja/docs/backlog/api/2/get-rate-limit/

### 1.2 現行ユーザーの API Key 発行権限

公式ヘルプは、Backlog の個人設定から `API` を開き、登録ボタンで API Key を発行する手順を案内しています。発行に管理者権限または契約管理者権限が必要であるという条件は、確認した公式資料には記載されていません。

ユーザーから個人設定で API Key を発行済みとの報告があり、OneOps の保存設定へ登録した値で Backlog API の本人確認とプロジェクト取得に成功した。したがって、今回使用したユーザーは API Key を発行して利用できる状態である。

参照:

1. https://support-ja.backlog.com/hc/ja/articles/360035641754-API%E3%81%AE%E8%A8%AD%E5%AE%9A
2. https://support.nulab.com/hc/en-us/articles/8783772200217-How-to-register-SSH-public-and-API-keys-in-Backlog

### 1.3 API Key の権限範囲

API Key は発行したユーザー単位です。API 呼び出しはそのユーザーの Backlog 上の可視範囲と権限に従います。

公式 API 資料では、今回の OneOps 連携で関係する次の取得 API は `すべての権限` と記載されています。

1. `/api/v2/users/myself`
2. `/api/v2/projects`
3. `/api/v2/projects/{projectId}/statuses`
4. `/api/v2/issues`

`/api/v2/projects` は通常、ユーザーが参加しているプロジェクトを返します。`all=true` は管理者の場合にだけ有効です。OneOps の実装は `all=true` を送信しません。そのため、管理者権限は OneOps の通常の課題読み取りには必要ありません。対象プロジェクトへの参加が必要です。

参照:

1. https://developer.nulab.com/ja/docs/backlog/api/2/get-own-user/
2. https://developer.nulab.com/ja/docs/backlog/api/2/get-project-list/
3. https://developer.nulab.com/ja/docs/backlog/api/2/get-status-list-of-project/
4. https://developer.nulab.com/ja/docs/backlog/api/2/get-issue-list/
5. https://support-ja.backlog.com/hc/ja/articles/360035643434-%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%81%AE%E6%A8%A9%E9%99%90

## 2. OneOps との照合

OneOps の `BacklogTaskConnector` は、API Key をクエリパラメーター `apiKey` として付加し、次の処理を行います。

1. API 接続確認で自分のユーザー情報を取得する。
2. 参加可能なプロジェクト一覧を取得する。
3. 対象プロジェクトの状態一覧を取得する。
4. 自分が担当者である課題を更新日、状態、プロジェクトで絞り込んで取得する。
5. 401、403、429 を認証失敗、権限不足、レート制限として分類する。

実装参照: `app/gateway/personal-task-connectors.mjs`

## 3. 推奨する運用アカウント

OneOps のシステム共通設定に登録する API Key は、個人の退職、異動、アカウント停止の影響を受けにくい専用 Backlog ユーザーで発行する運用が適しています。これは API Key が発行ユーザーに紐づき、レート制限もユーザー単位で適用されることに基づく運用上の推奨です。

専用ユーザーには、OneOps で取得するプロジェクトへの参加と課題の閲覧権限を付与します。課題の作成、更新、削除は現在の OneOps BacklogTaskConnector の読み取り処理には含まれていません。

## 4. 実スペース照合

OneOps の保存済み API Key を使用する認証後画面で `/api/v2/users/myself` の本人確認に成功し、`/api/v2/projects` から 11 件を取得した。`TS2_ITS`、`TECH_SUPPORT`、`OHR_TOKYO` が一覧に含まれ、各プロジェクトの自動属性取得とテンプレート保存まで完了した。

`/api/v2/projects?all=true` は 403 であった。Backlog 公式仕様上、`all=true` は管理者にだけ適用されるため、今回の結果は API Key が無効であることを示さない。プロジェクトを利用できる権限とスペース全体の管理者権限は別に扱う。

## 5. 未確認事項

次の二点は、会社スペースのログイン状態が必要です。

1. `nisshin30.backlog.com` の契約プラン。API の追加料金がないことは公式料金資料から確認できるが、対象スペースの契約プラン自体は未確認。
2. `/api/v2/projects?all=true` で全プロジェクトを取得できるスペース全体管理者権限。通常の目標プロジェクト利用には影響しない。

API Key、パスワード、セッション情報の値は調査記録へ保存していない。
