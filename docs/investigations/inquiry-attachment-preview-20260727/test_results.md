# 検証結果

## 自動検証

1. Gateway テスト 115 件が成功した。
2. Builder Python テスト 4 件が成功した。
3. Portal テスト 72 件が成功した。
4. TypeScript ビルドと Vite 本番ビルドが成功した。
5. 本番成果物は `index-CqwCN9AY.js` と `index-NOZovdVh.css` である。
6. `git diff --check` が成功した。

## 公開検証

1. `publish-portal.ps1` を `inquiry-attachment-preview-v0.2.3` として実行し、完全チェック、ビルド、原子的公開、Nginx 設定検査が成功した。
2. 公開画面に `OneOps v0.2.3` が表示された。
3. 実際の PDF 添付 2 件が解析状態や解析本文を持たず、それぞれ「プレビュー」操作として表示された。
4. プレビュー操作後、問合せ詳細と添付プレビューの 2 つのダイアログが同時に存在した。
5. プレビュードロワーの `z-index` は `1200`、幅は約 1,050 px、高さは 639 px であった。
6. iframe は `mode=preview` とファイル名を含む OneOps 同一オリジン URL を使用した。
7. ドロワー内のダウンロード操作は `mode=download` を使用した。
8. プレビュードロワーを閉じた後も問合せ No. 38950 の詳細ドロワーが維持された。
9. ブラウザーコンソールのエラーと警告は 0 件であった。
10. 画面スクリーンショットで添付一覧と上位プレビュードロワーを確認した。実顧客名と実添付名を含むため、スクリーンショットはリポジトリへ保存していない。

## 制約

ブラウザー制御環境では PDF プラグインの描画内容がスクリーンショットへ展開されない。Gateway の Content-Type、Content-Disposition、Range、Content-Range、Accept-Ranges は単体テストで検証し、公開画面では iframe URL、寸法、階層とダウンロード操作を検証した。
