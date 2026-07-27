# 検証コマンド

## 単体テストとビルド

```powershell
$env:PATH='D:\nginx\runtime\node;' + $env:PATH
D:\nginx\runtime\node\node.exe --test gateway/inquiry-support.test.mjs
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
D:\nginx\runtime\node\pnpm.cmd check
```

## 公開

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -AppRoot D:\nginx\app -Reason inquiry-attachment-preview-v0.2.3
```

## ブラウザー確認

1. 添付ファイルを含む問合せ詳細を開く。
2. 画像または PDF の「プレビュー」を選択し、詳細ドロワーより上位にプレビュードロワーが開くことを確認する。
3. プレビュードロワーのダウンロード操作を確認する。
4. TXT または ZIP の操作が「ダウンロード」となり、プレビュードロワーを開かないことを確認する。
5. ブラウザーコンソールのエラーと警告を確認する。
