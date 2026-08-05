# 試験結果

更新日: 2026-08-05

| 試験 | 結果 | 詳細 |
|---|---|---|
| Gateway | 合格 | 166 件成功 |
| Builder | 合格 | 14 件成功 |
| Portal | 合格 | 17 files、141 件成功 |
| Production Build | 合格 | 3405 modules transformed |
| Spring | 合格 | 33 件、Failure 0、Error 0、Skip 7 |
| 運用 Script | 合格 | 9 scripts、Rolling Switch を含む全検査成功 |
| Nginx 設定 | 合格 | syntax ok、test successful |
| Git 差分 | 合格 | whitespace error なし |
| 正式静的 Asset | 合格 | `index-oTjgBeAa.js` と `index-Zc99fetr.css` が Build と一致 |
| 正式 Spring Health | 合格 | status `UP`、version `0.9.4` |
| 実ブラウザ | 合格 | 同一 Production Build Fixture、Console 0 件、Screenshot 取得済み |

## Build 注意事項

JavaScript chunk が 1100 kB を超える既存 Warning が 1 件ある。今回の Header 軽量化に起因する Error はない。
