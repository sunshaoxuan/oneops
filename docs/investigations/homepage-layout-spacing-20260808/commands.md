# 実行コマンド

作業ディレクトリ: `D:\nginx`

## ソース確認

```powershell
git fetch origin master
git status --short
rg -n "workbench-personal-task-summary|hero-panel|personal-task-summary" app/apps/portal-shell/src
```

## テスト及びビルド

```powershell
cd app
pnpm --filter @one-ops/portal-shell test
pnpm check
```

## 公開

```powershell
cd app
./scripts/publish-portal.ps1 -Reason homepage-layout-spacing-20260808
```

## Browser 確認

```text
https://192.168.20.54/
```

確認結果: 認証待ち画面から進まず、WorkBench の DOM、Console、スクリーンショットを取得できなかった。資格情報の送信は行っていない。

## 公開 CSS の確認

```powershell
$html = Invoke-WebRequest -Uri 'https://192.168.20.54/' -SkipCertificateCheck -UseBasicParsing
$asset = ([regex]::Match($html.Content,'/assets/[^"'']+\\.css')).Value
$css = (Invoke-WebRequest -Uri ('https://192.168.20.54' + $asset) -SkipCertificateCheck -UseBasicParsing).Content
[regex]::Match($css,'.{0,100}workbench-personal-task-summary.{0,160}').Value
```

結果: HTTPS 200、`/assets/index-cx8Vq2Yu.css` に `.workbench-personal-task-summary{margin-top:18px}` を確認した。
