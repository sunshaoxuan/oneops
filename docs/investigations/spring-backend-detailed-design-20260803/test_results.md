# 検証結果

更新日: 2026-08-03

## 状態

詳細設計書と関連文書、Spring Boot 実装、Runtime 切替の検証を完了しました。

## 文書構造

- 詳細設計書: 1,462 行
- 番号付き章: 35 章
- コードフェンス: 64 箇所、開始と終了の対応を確認
- Mermaid: 4 ブロック
- プロジェクト規約で禁止された定型表現: 0 件
- <code>git diff --check</code>: 成功

## 既存機能テスト

<code>D:\nginx\runtime\node\pnpm.cmd test</code> を実行し、すべて成功しました。

- Gateway: 147 件成功
- Python Worker: 7 件成功
- Portal: 13 ファイル、120 件成功

## Spring Boot テスト

<code>D:\nginx\app\backend\mvnw.cmd test</code> を Java 21 で実行し、5 件すべて成功しました。

- Health Controller: 1 件
- Node scrypt 互換: 1 件
- AES-256-GCM 資格情報と AAD: 1 件
- 互換ブリッジ転送のメソッド、パス、Query、Header、Body: 2 件

<code>D:\nginx\app\backend\mvnw.cmd package -DskipTests</code> で実行可能 JAR の作成に成功しました。

## Runtime 切替

- <code>app/scripts/switch-gateway-to-spring.ps1</code> を実行しました。
- Windows Task <code>OneHR Operations Compat Gateway</code> は Spring 起動 Script を実行中です。
- Spring の <code>127.0.0.1:8092</code> Health は <code>status=UP</code>、内部互換サービスは <code>127.0.0.1:8093</code> で待受しています。
- 8092 経由の <code>ai-settings</code>、<code>personal-tasks</code>、<code>inquiry-support</code>、<code>builder</code> は未認証時に Node と同じ 401 契約を返すことを raw HTTP で確認しました。
- <code>app/scripts/publish-portal.ps1</code> による静的資材公開、pnpm check、Nginx <code>-t</code>、HTTPS smoke が成功しました。

## 本番ビルド

<code>D:\nginx\runtime\node\pnpm.cmd build</code> は成功しました。Vite は 3,401 モジュールを変換しました。既存の JavaScript チャンク容量警告は継続しています。

## UI 検証

今回のリリースでは画面版数を 0.8.0 に更新しました。正式サイトは未認証画面まで Browser で表示し、日本語ログイン画面、レイアウト、Console の warn/error なしを確認しました。認証情報の送信は行っていないため、ログイン後画面の目視確認は未実施です。

## 実装範囲

本検証は Spring Boot バックエンドの実装、既存 API 互換、Windows Task 切替、Portal の本番ビルドを対象とします。未移行業務 API は本機専用互換ブリッジで保持しており、直接 Spring モジュール化と負荷試験は継続課題です。
