# テスト結果

実施日: 2026-07-30

| 検証 | 結果 |
| --- | --- |
| Gateway 問合支援単体テスト | 27 件成功 |
| Gateway 全単体テスト | 131 件成功 |
| Portal 全単体テスト | 100 件成功 |
| Builder 単体テスト | 4 件成功 |
| TypeScript ビルド | 成功 |
| Vite 本番ビルド | 成功 |
| `pnpm check` | 成功 |
| `pnpm run publish` | 成功 |
| `nginx -t` | 成功 |
| Gateway health | `UP` |
| HTTPS health | HTTP 200 |
| 実サイト顧客条件 | 表示 500 件が指定顧客と一致 |
| 通常幅ブラウザー表示 | 成功 |
| 700 px 幅ブラウザー表示 | 水平オーバーフローなし |
| ブラウザーコンソール | warning 0 件、error 0 件 |

本番ビルドでは既知の JavaScript chunk サイズ警告が 1 件表示された。ビルドと公開は成功しており、本変更による新規エラーはない。
