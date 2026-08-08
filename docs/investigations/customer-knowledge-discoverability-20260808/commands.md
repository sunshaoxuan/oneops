# 実行コマンド

作業ディレクトリ: `D:\nginx`

## 事前確認

```powershell
git fetch origin master
git status --short
rg -n "customer\.knowledge|customer-knowledge|CAG|顧客情報" app/apps/portal-shell/src app/gateway docs
```

## Portal テスト及び全体チェック

```powershell
cd app
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
..\runtime\node\pnpm.cmd check
```

## 公開

```powershell
cd app
./scripts/publish-portal.ps1 -Reason customer-knowledge-discoverability-20260808
```

Nginx reload の Windows Event handle が現在のホストで解決できなかったため、Backend が正常稼働中であることを確認して、次の静的 Portal 公開を実行した。

```powershell
./scripts/publish-portal.ps1 -Reason customer-knowledge-discoverability-20260808 -SkipGatewayRestart
```

結果: `delivery_succeeded`。Backend の再起動は行っていない。

## 公開版の読み取り確認

```powershell
Invoke-WebRequest -Uri 'https://192.168.20.54/' -SkipCertificateCheck -UseBasicParsing
Invoke-WebRequest -Uri 'https://192.168.20.54/api/work-center/v1/health' -SkipCertificateCheck -UseBasicParsing
```

## Browser

```text
https://192.168.20.54/
```

管理入口、権限マトリクス、Console 及びスクリーンショットを確認する。認証待ちで停止する場合は資格情報を送信せず、`evidence_missing` と記録する。
