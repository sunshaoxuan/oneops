# 証拠索引

| ID | 主張 | 証拠 | 結果 |
|---|---|---|---|
| E01 | 削除済み履歴を通常 Card から分離した | `app/apps/portal-shell/src/InquirySupportPage.tsx` | 合格 |
| E02 | Icon 領域が省スペースである | Browser 実測で領域 34 px、各 Button 30 px | 合格 |
| E03 | 三件を三つの Icon で表示する | `docs/evidence/inquiry-ai-deleted-history-icons-admin-20260807.png` | 合格 |
| E04 | Tooltip に生成者と削除日時を表示する | Browser DOM `削除前の詳細を表示 · 孫 紹煊 · 2026/8/7 20:22:46` | 合格 |
| E05 | Icon 選択で削除前詳細を表示する | `docs/evidence/inquiry-ai-deleted-history-detail-admin-20260807.png` | 合格 |
| E06 | 詳細から再削除できない | Browser DOM 内の該当 Button 0 件 | 合格 |
| E07 | 通常利用者へ削除済み履歴を返さない | Gateway 試験 `ordinary users cannot include logically deleted AI history` | 合格 |
| E08 | 正式 Runtime が 0.15.8 で稼働する | 8092 Health `upstream.version=0.15.8`、HTTPS 200 | 合格 |
| E09 | Browser Console に異常がない | error、warn、warning 0 件 | 合格 |
