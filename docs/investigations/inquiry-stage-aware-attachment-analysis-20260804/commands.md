# 実行コマンド

## 1. 実装経路

```powershell
rg -n "FULL_TICKET|customerEvaluationAssessment|serviceQuality|attachments|chat/completions" app/gateway app/apps/portal-shell/src app/packages/api-client/src
```

## 2. CAG 読み取り調査

```powershell
rg -n "TaskCreate|UploadFile|attachment|resources" D:\workspace\cag\backend\app -g "*.py"
```

## 3. 定向試験

```powershell
.\runtime\node\node.exe --test app/gateway/inquiry-attachment-analysis.test.mjs app/gateway/inquiry-support.test.mjs
```

```powershell
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell exec vitest run src/inquiry-support.test.ts
```

## 4. 構築

```powershell
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
```

## 5. 実運用の安全な検証

保存済み設定を使用し、実問合せの状態、問題数、記録種別、評価有無、添付形式だけを出力した。添付解析では形式、状態、抽出文字数、画像数だけを出力した。Model API 検証では出力契約の型、件数、真偽値、Token 使用量だけを出力した。

問合せ本文、添付画像、顧客情報、認証情報、モデル応答本文を出力していない。
