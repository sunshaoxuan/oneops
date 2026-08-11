# Test 結果

実行日: 2026-08-11

## 自動 Test

| 対象 | 結果 |
| --- | --- |
| Gateway | 261 件合格 |
| Worker | 14 件合格 |
| Portal | 33 File、209 件合格 |
| Portal Production Build | 3850 Module、合格 |
| Backend | 40 件中 32 件合格、環境依存 8 件 Skip、失敗 0 件 |
| nginx Configuration | 合格 |
| `git diff --check` | 合格 |

## 配信

| 項目 | 結果 |
| --- | --- |
| SYSTEM 完全配信 | 0.18.12、合格 |
| Responsive 修正の静的再配信 | 合格 |
| Backend Health | `UP` |
| Backend Version | `0.18.12` |
| Backend Online | `true` |
| Windows SSO | enabled、auto login ともに `true` |
| nginx Upstream | `127.0.0.1:8092` |
| HTTPS | 200 |
| Dist と Web Root Hash | SHA256 一致 |

## Browser

| 項目 | 結果 |
| --- | --- |
| 処理状況の初期折り畳み | 合格 |
| 処理状況の展開 | `aria-expanded=true`、合格 |
| 実 Task 経過秒数 | 合格 |
| 回答コピー | `コピーしました`、合格 |
| 過去位置で最新会話 Button 表示 | 合格 |
| 最新位置へ復帰後 Button 非表示 | 0 件、合格 |
| Composer 操作説明 | 通常幅 1 件、合格 |
| 600 x 900 の Keyboard 説明 | 非表示、合格 |
| Reduced Motion | `true`、合格 |
| Console Error | 0 件 |

## Screenshot

1. `final-process-copy-0.18.12.png`
2. `final-latest-action-0.18.12.png`
3. `final-narrow-0.18.12.png`
