# 最終受入一覧

| 要求 | 成果物 | 証拠 | 判定 |
| --- | --- | --- | --- |
| 利用者ボタンでメニューを表示する | `App.tsx` の固定 Anchor Menu | Browser の可視 Menu、実クリック試験 | 合格 |
| Code 既存のプロフィール、代理ログイン終了、ログアウトを維持する | `profileMenuItems` と `handleProfileMenuClick` | Source 確認、認証 UI 試験 | 合格 |
| 画面外へ残さない | `styles.css` の右上固定配置 | Browser Rect が Viewport 内 | 合格 |
| 再選択、外部選択、Escape で閉じる | 利用者 Menu State と Document Event | Unit Test の Escape 終了 | 合格 |
| 利用者の接続を止めずに配信する | Static Portal 継続配信 | `gateway_restart_skipped` と `delivery_succeeded` | 合格 |
| 関連文書を更新する | 代理ログイン要件と調査報告 | 文書差分 | 合格 |
| Production Test と Build | Portal 全試験と Vite Build | 33 Files、220 Tests 合格、Build 合格 | 合格 |
| 配信成果物を確認する | `D:\nginx\html` | Build と配信先の Index 及び JS Hash 一致 | 合格 |
| 正式 HTTPS の認証済み画面を再確認する | `https://192.168.20.54/` | 新規 Browser Session が Windows 認証確認画面で停止 | 未確認 |

正式 HTTPS の認証済み画面における再クリック、Console 及び Screenshot は認証 Session を利用できる時点で再確認します。
