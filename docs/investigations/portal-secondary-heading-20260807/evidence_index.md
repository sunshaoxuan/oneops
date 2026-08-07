# 証拠索引

| 証拠 | 内容 | 結果 |
| --- | --- | --- |
| E-01 | `app/apps/portal-shell/src/styles.css` の第2階層見出し CSS | `portal-section-heading` を軽量表現へ変更し、装飾円を非表示 |
| E-02 | `app/apps/portal-shell/src/secondary-heading.test.ts` | 文字サイズ、字重、最小高さ、背景及び装飾円非表示を静的検査 |
| E-03 | Portal Shell テストとビルド | 19 ファイル、161 件成功。Production build 成功 |
| E-04 | ローカル Browser フィクスチャのデスクトップ確認 | 二級見出し 22px、字重 700、最小高さ 72px、Console warning/error 0 件。`docs/evidence/portal-secondary-heading-20260807.png` |
| E-05 | ローカル Browser フィクスチャの 640px 確認 | 二級見出し 20px、ページ幅の横方向溢れなし、Console warning/error 0 件。`docs/evidence/portal-secondary-heading-20260807-640.png` |
| E-06 | 正式 HTTPS と Edge | 認証待ち又は接管タイムアウトにより認証後画面は `evidence_missing` |
