# 試験結果

| 対象 | 結果 | 詳細 |
|---|---|---|
| Focused Test | 合格 | 2 Files、8 Tests |
| Portal Test | 合格 | 33 Files、212 Tests |
| Portal Production Build | 合格 | 3850 Modules |
| Gateway Test | 合格 | 274 Tests |
| Worker Test | 合格 | 14 Tests |
| Backend Test | 合格 | 40 Tests、8 Skipped |
| 運用 Script Test | 合格 | 9 Scripts |
| 初回 CSS Test | 不合格後修正 | 組合せ Selector を先に取得した Test Parser を最後の完全一致 Rule 取得へ修正 |
| 正式 Browser 基本幅 | 合格 | Root `1422 / 1422`、会話領域 `981 / 981`、Message Grid `980 / 980`、`overflow-x: hidden` |
| 正式 Browser 長文 Streaming | 未合格 | Windows SSO 遷移時に Browser 制御対象が閉じ、Streaming と完了後の Screenshot、Console は `evidence_missing` |
| 継続配信 | 合格 | `delivery_succeeded`、2026-08-11 16:54:58 JST |
| HTTPS Health | 合格 | `UP`、0.18.17、Legacy Gateway Ready |
| nginx | 合格 | 構文正常、8092 単独待受 |
| 配信 Asset | 合格 | `index.html`、JS、CSS の Build と配信先 SHA-256 一致 |
