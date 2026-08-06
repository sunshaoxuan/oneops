# 顧客情報ナレッジスキャン調査

更新日: 2026-08-06

## 目的

顧客情報の契約、サービス及びネットワーク情報を、利用者が一件ずつ入力する前に学習済みナレッジから抽出する。

## 確認結果

| 確認事項 | 証拠 | 結果 |
| --- | --- | --- |
| OneOps 顧客情報 | `CustomerInformationPage.tsx`、Migration 028 | 契約、サービス、VPN 及び環境は物理 ID 台帳を使用する |
| OneOps ナレッジ | Portal Navigation | 現行のナレッジ画面は入口のみで、顧客情報抽出 API は存在しない |
| CAG API | CAG 0.22.8 `/api/v1/knowledge/search`、`/api/v1/tasks` | Citation 付き検索と `knowledge_mode=required` の非同期 Task を提供する |
| 実 Code 検索 | `9330` と岡山市立総合医療センター | 直接検索は 45 秒又は 60 秒で Timeout |
| CAG 運用影響 | Gateway Supervisor Log | 検索中に Ready 判定が連続失敗し、8000 Process が再起動された |
| 非同期 Task | Task `bef77c56-d378-417b-bd83-120c57419dd8` | 作成は成功したが、検索中は Task 状態参照も Timeout |

## 設計判断

OneOps は物理スキャン記録を作成して CAG Task を非同期起動する。画面は進捗と失敗を表示する。候補は Citation と一致する根拠を必須とし、利用者確認後に台帳へ反映する。

CAG には次の改善が必要である。

1. Knowledge Retrieval を API Process から独立 Worker へ隔離する。
2. 検索中も Health、Task 状態及び Queue 状態を一定時間内に返す。
3. 組織 Code、正式名、略称の完全一致を先行する高速検索経路を追加する。
4. 検索 Timeout、候補件数、索引 Generation、対象 Source 及び失敗段階を Task Event へ記録する。
5. 顧客情報抽出用の構造化 Schema を CAG 側で検証し、自由形式 JSON の解析を呼出側へ委ねない。
