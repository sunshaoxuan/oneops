# 実行コマンド

## 調査

```powershell
D:\nginx\runtime\node\node.exe --env-file=.env.local --input-type=module -e "<資格情報を出力しないフォーム構造確認>"
```

## 単体テスト

```powershell
D:\nginx\runtime\node\node.exe --test gateway/inquiry-support.test.mjs
pnpm --filter @one-ops/portal-shell test -- src/inquiry-support.test.ts
```

## 完全検証

```powershell
pnpm check
pnpm run publish
D:\nginx\nginx.exe -t -p D:\nginx
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
Invoke-WebRequest https://192.168.20.54/api/work-center/v1/health -SkipCertificateCheck
```

ブラウザーでは `https://192.168.20.54/inquiry-support` を再読込し、DOM、通常幅、700 px 幅、コンソールを確認した。
