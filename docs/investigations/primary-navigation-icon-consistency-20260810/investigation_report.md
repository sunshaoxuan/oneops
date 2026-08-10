# 第1階層 Navigation Icon 整合 調査及び実装記録

## 1. 当初目的

折畳み状態の主 Navigation で各機能を Icon だけでも識別できるようにし、Page 内部の機能 Icon と同じ業務意味へ統一する。別 Node 間の Icon 重複を解消する。

## 2. 調査範囲

`App.tsx` の第1階層 Navigation 11 Node、顧客情報、問合支援、個人 Task、AI助手、基本台帳、システム管理及び Placeholder Page の Heading Icon を確認した。

## 3. 変更前の検出結果

| Node | Navigation | Page 内部 | 判定 |
| --- | --- | --- | --- |
| ワークベンチ | `HomeOutlined` | 専用 Heading Icon なし | 適合 |
| タスク | `CheckSquareOutlined` | `CheckSquareOutlined` | 適合 |
| 顧客情報 | `CloudServerOutlined` | `SolutionOutlined` | 不一致 |
| 問合支援 | `RobotOutlined` | `MessageOutlined` | 不一致 |
| 製品構築 | `BuildOutlined` | 埋込 Workspace | 適合 |
| AI助手 | `RobotOutlined` | `RobotOutlined` | 適合、問合支援と重複 |
| ナレッジ | `BookOutlined` | Navigation 定義を再利用 | 適合 |
| コードインサイト | `CodeOutlined` | Navigation 定義を再利用 | 適合 |
| レポート | `BarChartOutlined` | Navigation 定義を再利用 | 適合 |
| 基本台帳 | `DatabaseOutlined` | `DatabaseOutlined` | 適合 |
| システム管理 | `SettingOutlined` | `SettingOutlined` | 適合 |

## 4. 実装

1. 顧客情報の Navigation を `SolutionOutlined` へ変更し、顧客台帳 Page Heading と統一した。
2. 問合支援の Navigation を `MessageOutlined` へ変更し、問合支援 Page Heading と統一した。
3. AI助手は `RobotOutlined` を維持し、問合支援との重複を解消した。
4. 全 11 Node の Mapping と Icon 名の一意性を検査する回帰試験を追加した。
5. UI Standard へ第1階層 Navigation の Icon 契約を追加した。

## 5. 影響範囲

表示 Icon だけを変更する。Navigation Key、URL、Permission、表示順、Page Component、API 及び Data Contract は変更しない。

## 6. 検証状態

専用回帰試験 2 Test、Gateway 218 Test、Worker 14 Test、Portal 178 Test、Spring Backend 34 Test、運用 Script 9 件、Production Build、Nginx 設定及び Rolling 配信が合格した。Local と HTTPS Health は `UP`、Version 0.16.3、HTTPS 首页は 200、Dist と WebRoot の Index SHA256 は一致した。

実 Browser のログイン後画面は `evidence_missing` である。接続済み Edge は Windows Domain 認証中継 Page で Page 接続が Timeout し、Chrome Session は利用不可、In App Browser は未 Login 状態だった。一般利用者の認証情報を送信せず、既存の Login 済み Browser Session が利用可能になった後に折畳み Navigation、顧客情報、問合支援、Console 及び Screenshot を確認する。
