# 証跡索引

| 主張 | 証跡 | 確度 | 制約 |
| --- | --- | --- | --- |
| 全 7 列が並べ替え可能 | `app/apps/portal-shell/src/InquirySupportPage.tsx` | 高 | 今回返された結果だけを対象 |
| 更新日時が初期降順 | `defaultSortOrder: "descend"` とブラウザー `aria-sort=descending` | 高 | 同一日時は取得順を維持 |
| 数字を含む No. を自然順比較 | `compareInquiryText` と Vitest | 高 | 問合せ No. は文字列契約 |
| 日付を日時として比較 | `compareInquiryDate` と Vitest | 高 | 不正日時は空値と同様に扱う |
| 自動公開競合を解消 | `publish-portal.ps1`、`ensure-oneops-runtime.ps1`、継続的デリバリーログ | 高 | ホスト内の同名 Mutex が対象 |
| 公開画面で並べ替え成功 | 500 件の実検索とブラウザー確認 | 高 | UPDS 全件数は 791 件 |
| Console に問題がない | ブラウザー warning 0、error 0 | 高 | 2026-07-30 時点 |

実データを含む画面画像は `D:\nginx\app\logs\inquiry-sort-0.5.2.png` にローカル保存し、Git 管理対象外とする。
