# CAG スコープ指定顧客台帳抽出要件

更新日: 2026年8月7日

## 1. 文書の位置付け

本書は、OneOps の顧客情報スキャンから CAG の学習済み資料を利用し、組織機関に関係する全資料を対象として顧客台帳候補を抽出するための要求仕様である。

対象例は、OneOps の組織機関 `0408 筑波大学` と、CAG の知識源 `UPDS顧客別情報` に登録済みの `つ_0408_筑波大学/` 配下資料とする。

筑波大学は実環境受入用のサンプルである。`0408`、`筑波大学`、`筑波大` 及び同組織の Directory 名を通用設定、既定値、分岐条件又は分類規則に使用しない。実行時は選択された組織機関物理 ID と業務属性、知識源物理 ID 及び Catalog Scope を動的に解決する。

本書に記載するスコープ指定取込、逐次ファイル抽出及び集約 API は現行契約である。通常の知識源全体取込 API と Knowledge Search API は別用途として維持し、顧客台帳の完全列挙、範囲限定再取込及び業務項目別集約には本契約を使用する。

関連要件は `docs/CUSTOMER_INFORMATION_REQUIREMENTS.md` の「学習済みナレッジの顧客情報スキャン」とする。本書は、その CAG 連携契約、処理責任及び受入方法を詳細化する。

## 2. 背景と解決対象

CAG の通常のナレッジ検索は、質問に関連する少数のファイル又は Chunk を発見し、AI へ根拠を提供する用途に適する。Top K 型検索結果は、組織機関の全資料を確認したことを保証しない。

顧客台帳の初期化及び補足では、対象組織機関の資料を完全列挙し、各ファイルの処理可否を確認し、要求された業務項目を逐次抽出し、結果を集約する必要がある。

2026年8月6日の筑波大学スキャンでは、CAG Task が PostgreSQL の Statement Timeout で失敗した。検索 SQL は広い知識範囲に対して多数のキーワード条件を実行し、資料充足度の判定へ到達しなかった。この事象を、検索再試行又は知識源全体の再学習だけで解決しない。

## 3. 目的

1. OneOps が共有フォルダーの実パス及びファイル一覧を保持せず、組織機関物理 ID、業務識別情報、知識源物理 ID及び抽出項目契約だけを CAG へ伝達できるようにする。
2. CAG が自身の Knowledge Catalog から組織機関に対応する資料範囲を一意に解決し、対象範囲内の全ファイルを列挙できるようにする。
3. CAG が学習済み本文、Chunk、構造情報及び Citation を永久知識として再利用し、未取込、処理失敗又は原資料変更時だけ新しい Document Version を取込できるようにする。
4. CAG が OneOps の要求項目を業務契約として受け取り、逐次ファイル抽出、集約、競合検出及び根拠付与を実行できるようにする。
5. OneOps が候補、資料網羅率、未処理資料、競合及び根拠を確認し、権限を持つ利用者の確認後に物理 ID 台帳へ反映できるようにする。
6. 既存台帳を自動削除又は自動上書きせず、増分補足と人による確認を維持する。

## 4. 用語と能力分離

### 4.1 資料取込

ファイル発見、メタデータ登録、本文抽出、OCR、表構造抽出、Chunk 生成及び検索索引作成を行う。CAG のモデル自体を再訓練する意味では使用しない。

### 4.2 ナレッジ検索

質問に関連するファイル又は Chunk を関連度順に取得する。問合回答、候補資料発見及び限定済みファイル内の関連箇所特定に使用する。

### 4.3 スコープ指定業務分析

組織機関に対応する資料範囲を完全列挙し、OneOps が指定した項目契約に従って全対象ファイルを確認し、構造化候補、根拠、網羅率及び競合を生成する。本書の中心機能とする。

### 4.4 再取込と再分析

`再取込` は本文又は索引が利用できないファイルを再処理する操作とする。`再分析` は利用可能な既存本文を使用して項目抽出を再実行する操作とする。画面及び API で両者を区別する。

### 4.5 永久保持と二種類の Version

永久保持とは、過去 Version とその Evidence を物理削除せず、監査、過去時点再現及び Rollback に利用できる状態を指す。全 Version が現在検索へ常時参加する意味ではない。

#### 4.5.1 学習処理 Version

1. 同じ原資料内容を新しい Parser、OCR、Chunk 規則、Embedding 又は Processor で再処理した結果を学習処理 Version とする。
2. 学習処理 Version は独立した物理 ID、原資料 Document Version 物理 ID、`processor_fingerprint`、作成日時、品質検証結果及び状態を持つ。
3. 新しい学習処理 Version は取込と品質検証に合格した後に `active` となる。
4. 前の学習処理 Version は新 Version の有効化と同一 Transaction で `superseded` となり、通常検索対象から外れる。
5. `superseded` Version の本文、Chunk、Embedding、Evidence 及び監査情報は保持する。
6. 新 Version が失敗した場合、直前の `active` Version を維持し、検索可能な知識を失わない。
7. 学習処理 Version の切替は技術処理の新旧を表し、業務知識の適用開始日時及び適用終了日時を変更しない。

#### 4.5.2 業務知識 Version

1. 現実の業務事実が時間とともに変化する場合、同じ Subject と Fact Key に複数の Knowledge Block Version を持つ。
2. 各 Knowledge Block Version は独立した物理 ID、Subject 物理 ID又は外部参照、Fact Key、値、記録日時及び Evidence を持つ。適用期間は独立した Applicability Revision で管理する。
3. 新しい事実の根拠に適用開始日時がある場合、その日時を新 Version の `effective_from` とし、直前 Version の `effective_to` を同じ境界とする新しい Applicability Revision を追加する。過去の Applicability Revision を上書きしない。
4. 過去 Version は適用期間終了後も歴史知識として保持する。
5. `analysis_context.as_of` に含まれる Version だけを当該時点の候補として使用する。
6. 根拠に適用開始日時がない場合、CAG は資料更新日時を事実の開始日時として断定せず、時点不明又は競合として返す。
7. 同じ適用期間に異なる値が存在する場合、自動上書きせず競合として返す。
8. パスワード、Token、秘密鍵及び資格情報値は業務知識 Version の対象外とし、Knowledge Block、Chunk、検索索引及び抽出結果へ保存しない。

例えば、2025年に適用された保守担当窓口と2026年から適用された保守担当窓口は、二つの業務知識 Version として保持する。2026年に同じ原資料を新しい Parser で再処理した場合は、学習処理 Version だけを更新し、窓口情報の業務適用期間を変更しない。

#### 4.5.3 共通保持規則

1. 原資料が更新された場合は新しい Document Version を追加する。旧 Document Version を上書き又は自動削除しない。
2. 原資料が知識源から見えなくなった場合は Source Entry の現状を記録する。学習済み Version を削除しない。
3. 法令、機密情報、権利又は誤登録により利用を停止する場合は、通常の Version 更新と区別した管理状態及び監査記録を使用する。
4. 再取込は新しい原資料 Version 又は学習処理 Version を追加し、抽出失敗を修復する操作とする。

## 5. システム責任

| 項目 | OneOps | CAG |
| --- | --- | --- |
| 組織機関台帳 | 正式な物理 ID、Code、名称、略称及び基本台帳を管理する | 外部業務対象として参照する |
| 知識源選択 | システム設定で CAG 知識源物理 ID を保持する | 共有場所、資格情報、Source Scope 及び収集状態を管理する |
| 資料範囲 | 実パス及びファイル一覧を保持しない | Catalog から組織機関の Scope を解決して保持する |
| 抽出項目 | 項目 Code、型、選択肢、必須性及び反映規則を指定する | 契約を検証して逐次ファイル抽出する |
| 再取込 | Scope と目的を指定して要求する | 対象ファイルを判定し、必要分だけ取込する |
| 結果集約 | 候補を表示し、利用者確認後に台帳へ反映する | 候補、根拠、信頼度、競合、未解決及び網羅率を返す |
| 強参照 | OneOps 内部では物理 ID と外部キーを使用する | CAG 内部では物理 ID と外部キーを使用する |
| システム間参照 | CAG Task ID と CAG Scope ID を外部参照として保持する | `external_system` と OneOps 物理 ID の対応を保持する |

異なるデータベース間にはデータベース外部キーを設定できない。各システム内部の参照は物理 ID 外部キーを使用し、システム間は発行元を含む外部参照と一意制約で対応する。

## 6. 筑波大学の処理対象例

### 6.1 OneOps が保持する情報

| 項目 | 値 |
| --- | --- |
| 組織機関物理 ID | OneOps `organizations.id` の UUID |
| 機関 Code | `0408` |
| 正式名 | `筑波大学` |
| 略称 | `筑波大` |
| 知識源物理 ID | システム設定に登録した CAG Source UUID |

### 6.2 CAG が保持する情報

知識源 `UPDS顧客別情報` の Catalog には、次のような登録済みパスが存在する。

1. `つ_0408_筑波大学/０．保守契約書`
2. `つ_0408_筑波大学/０．保守契約書/20210107-仕様書案-SP確認ーIF確認-CSC確認.docx`
3. `つ_0408_筑波大学/０．保守契約書/見積審査_筑波大_人事給与システム賃貸借一式_20160113.xlsx`
4. `つ_0408_筑波大学/１．導入システム一覧/【筑波大】導入システム一覧.xlsx`
5. `つ_0408_筑波大学/２．カスタマイズ情報/` 配下の SQL、設計書、帳票定義及び画像資料
6. `つ_0408_筑波大学/６．リモート接続情報/` 配下の VPN 及び環境資料

CAG は Scope 解決後、同じ Prefix に属する Catalog Entry を全件列挙する。上記四件だけを固定対象としない。

### 6.3 期待する Scope

```json
{
  "id": "cag-scope-uuid",
  "source_id": "cag-source-uuid",
  "subject_type": "organization",
  "external_system": "ONEOPS",
  "external_subject_id": "oneops-organization-uuid",
  "canonical_prefix": "つ_0408_筑波大学/",
  "matched_by": [
    "organization_code",
    "official_name"
  ],
  "confidence": 1.0,
  "status": "resolved"
}
```

Scope 自身は CAG の物理 ID を持つ。同じ知識源、外部システム、外部対象物理 ID及び有効期間に対して、有効な Scope を一件に限定する。

## 7. 全体処理フロー

1. OneOps はスキャン物理レコードを作成する。
2. OneOps は組織機関物理 ID、Code、名称、略称、知識源物理 ID及び項目契約を CAG へ送る。
3. CAG は要求形式、知識源の利用権限及び項目契約を検証する。
4. CAG は Catalog から組織機関 Scope を解決する。
5. Scope が複数候補又は未検出の場合、CAG は安定 Error Code と候補又は不足情報を返して処理を停止する。
6. CAG は Scope 配下の全 Catalog Entry を列挙し、ファイル Manifest を確定する。
7. CAG は各ファイルを `ready`、`source_changed`、`processing_upgrade_required`、`observed_only`、`metadata_only`、`extraction_failed` 又は `excluded` に分類する。
8. 取込 Policy に従い、未取込、失敗又は原資料変更があるファイルだけを再取込し、新しい Version を追加する。
9. CAG は利用可能になった各ファイルから、要求項目を独立して構造化抽出する。
10. CAG はファイル単位結果を集約し、重複、優先順位、競合及び未解決項目を判定する。
11. CAG は候補、Citation、網羅率、失敗資料及び処理 Version を OneOps へ返す。
12. OneOps は利用者へ結果を表示し、確認された候補だけを物理 ID 台帳へ反映する。
13. OneOps は CAG Task ID、Scope ID、候補、採用結果及び監査履歴を保存する。

## 8. OneOps から CAG への API 契約

### 8.1 共通規則

1. Base Path は `/api/v1` とする。
2. JSON の文字コードは UTF-8 とする。
3. 日時は UTC の RFC 3339 形式とする。
4. 物理 ID は UUID 文字列とする。
5. OneOps は `Authorization`、`X-CAG-Source`、`X-CAG-Client-ID`、`X-Request-ID` 及び `Idempotency-Key` を送る。
6. `Idempotency-Key` が同一で Body が同一の場合、同じ CAG Task を返す。Body が異なる場合は `409 IDEMPOTENCY_CONFLICT` とする。
7. 資格情報、パスワード、秘密鍵及び Token を Body、結果、Event、監査又は Log に含めない。
8. 自由形式 Prompt に JSON Schema を埋め込まない。
9. 現行の Code、名称及び Section だけの契約は本契約へ直接置き換える。互換用 API 又は変換 Layer は設けない。

### 8.2 顧客台帳抽出開始

```http
POST /api/v1/knowledge/extractions/customer-ledger
```

#### Request Header 例

```http
Authorization: Bearer <access-token>
Content-Type: application/json
X-CAG-Source: oneops-customer-scan
X-CAG-Client-ID: oneops-system
X-Request-ID: 2b8a3a5f-845a-4ffc-a81a-5655aeb782a7
Idempotency-Key: oneops-customer-scan-<OneOps Scan UUID>
```

#### Request Body 例

```json
{
  "schema_version": 1,
  "project_id": "oneops-project-uuid",
  "knowledge_source_id": "cag-source-uuid",
  "analysis_template": {
    "code": "ORGANIZATION_PROFILE_ENRICHMENT",
    "version": 2
  },
  "subject": {
    "type": "organization",
    "external_system": "ONEOPS",
    "external_id": "oneops-organization-uuid",
    "code": "0408",
    "official_name": "筑波大学",
    "short_name": "筑波大",
    "aliases": []
  },
  "scope_policy": {
    "resolution": "catalog",
    "coverage": "exhaustive"
  },
  "analysis_context": {
    "as_of": "2026-08-06T09:00:00Z",
    "learning_processing_selection": "active",
    "business_knowledge_selection": "applicable_at"
  },
  "ingestion_policy": {
    "mode": "prepare_required_versions",
    "retry_failed_documents": true
  },
  "requested_fields": [
    {
      "code": "organization_category",
      "type": "master_reference",
      "required": true,
      "options": [
        {
          "id": "oneops-master-item-uuid",
          "code": "CUSTOMER",
          "label": "顧客"
        }
      ]
    },
    {
      "code": "organization_code",
      "type": "string",
      "required": true
    },
    {
      "code": "organization_name",
      "type": "string",
      "required": true
    },
    {
      "code": "short_name",
      "type": "string",
      "required": false
    },
    {
      "code": "maintenance_status",
      "type": "enum",
      "required": false,
      "options": [
        {
          "id": "oneops-maintenance-yes-uuid",
          "code": "YES",
          "label": "○"
        },
        {
          "id": "oneops-maintenance-no-uuid",
          "code": "NO",
          "label": "×"
        },
        {
          "id": "oneops-maintenance-unknown-uuid",
          "code": "UNKNOWN",
          "label": "空欄"
        }
      ]
    },
    {
      "code": "remarks",
      "type": "text",
      "required": false
    },
    {
      "code": "contracts",
      "type": "object_list",
      "required": false,
      "schema_ref": "CUSTOMER_CONTRACT_V1"
    },
    {
      "code": "services",
      "type": "object_list",
      "required": false,
      "schema_ref": "CUSTOMER_SERVICE_V1"
    },
    {
      "code": "vpns",
      "type": "object_list",
      "required": false,
      "schema_ref": "CUSTOMER_VPN_V1"
    },
    {
      "code": "environments",
      "type": "object_list",
      "required": false,
      "schema_ref": "CUSTOMER_ENVIRONMENT_V1"
    },
    {
      "code": "customizations",
      "type": "object_list",
      "required": false,
      "schema_ref": "CUSTOMER_CUSTOMIZATION_V1"
    }
  ],
  "result_policy": {
    "mode": "candidates_only",
    "require_evidence": true,
    "report_conflicts": true,
    "minimum_confidence": 0.7,
    "allow_automatic_overwrite": false,
    "allow_delete": false
  }
}
```

#### 入力規則

1. `knowledge_source_id` は OneOps のシステム設定に登録済みの CAG Source 物理 ID と一致させる。
2. `subject.external_id` は OneOps 組織機関物理 ID とする。
3. Code、正式名及び略称は Scope 解決用の業務属性であり、強参照として使用しない。
4. `requested_fields.code` は OneOps が管理する安定 Code とする。
5. `master_reference` と `enum` は許可された候補の物理 ID、Code 及び表示名を指定する。
6. CAG は指定外の選択肢物理 ID を生成しない。該当値がない場合は未解決として返す。
7. `coverage=exhaustive` は Scope 配下の全対象ファイルを Manifest に含めることを要求する。
8. `prepare_required_versions` は未取込、処理失敗、原資料の内容 Hash 変更又は Processor 更新があるファイルだけを処理し、既存 Version を保持したまま新 Version を追加する。
9. `candidates_only` は CAG が OneOps 台帳を書き換えないことを意味する。
10. OneOps の既存値を比較に使用する場合は、将来の `current_values` 契約で明示的に追加する。CAG が OneOps を逆参照して取得しない。
11. `schema_ref` は CAG の当該 Analysis Template Version に登録済みの構造 Schema Code とする。CAG は未登録 Code を `REQUEST_SCHEMA_INVALID` として拒否する。
12. `analysis_context.as_of` は業務分析の基準日時とする。CAG は `active` の学習処理 Version から、Knowledge Block の業務適用期間及び管理状態を評価し、採用又は除外した Block と理由を Task に記録する。
13. `２．カスタマイズ情報` は除外対象ではない。本文抽出可能な SQL、Office、Spreadsheet 及び OCR 資料から `customizations` を生成する。
14. `６．リモート接続情報` は `vpns` と `environments` へ分類する。独立した `remote_access` 項目は使用しない。
15. Scoped Extraction は Knowledge Ingestion と同じ対応拡張子定義を使用する。二重の拡張子許可表で取込済み資料を再度除外しない。
16. EXE、Database、Archive、Shortcut 等の Metadata Only 資料は資産の存在だけを示す。Path 又はファイル名だけから Customize、VPN 又は Environment の内容を推定しない。
17. CAG は各 `requested_fields` の型に対応する構造化出力 Schema をモデル実行時に適用する。`object_list` の値は登録済み Object Schema の必須項目、snake_case 項目名、Enum 及び追加項目禁止を生成段階から満たし、生成後の互換変換で補正しない。
18. CAG は既存 Chunk を再利用する場合もモデル Prompt と Citation Excerpt の直前に資格情報を再検査する。Label 付き接続情報、資格情報 URL 及び Spreadsheet 内の account と strong-password の組合せを脱敏し、通常の Directory 又はファイル Path は維持する。
19. CAG は全顧客に共通する業務 Directory Taxonomy で特殊項目を絞り込む。`２．カスタマイズ情報` では `customizations`、`６．リモート接続情報` では `vpns` と `environments` だけをモデルへ要求し、他 Directory からこの三項目を推定しない。顧客固有 Code 又は名称を分岐条件に使用しない。
20. `object_list` の異なる値は別の業務記録候補として独立表示する。単一値を選ぶ Scalar、Enum 又は Master Reference の同一優先度値競合を、複数記録を持てる Customize、VPN 及び Environment へ適用しない。

#### カスタマイズ情報 Schema

`CUSTOMER_CUSTOMIZATION_V1` の各要素は次の項目を持つ。

| 項目 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `name` | string | 必須 | カスタマイズの識別名 |
| `category` | string or null | 任意 | 帳票、連携、Database、運用等の資料記載区分 |
| `summary` | string | 必須 | 根拠資料から確認できる変更内容 |
| `business_purpose` | string or null | 任意 | 根拠資料に明記された業務目的 |
| `affected_components` | string array | 必須 | 影響対象として明記された Component。空配列を許可する |
| `status` | enum | 必須 | `PLANNED`、`ACTIVE`、`RETIRED`、`UNKNOWN` |
| `notes` | string or null | 任意 | 資格情報を含まない補足 |

#### 受付 Response 例

```json
{
  "id": "cag-extraction-task-uuid",
  "schema_version": 1,
  "status": "queued",
  "subject_external_id": "oneops-organization-uuid",
  "created_at": "2026-08-06T09:00:00Z",
  "status_url": "/api/v1/knowledge/extractions/customer-ledger/cag-extraction-task-uuid"
}
```

受付成功は `202 Accepted` とする。

### 8.3 抽出状態及び結果取得

```http
GET /api/v1/knowledge/extractions/customer-ledger/{task_id}
```

状態は次を使用する。

| 状態 | 意味 |
| --- | --- |
| `queued` | Worker の実行待ち |
| `resolving_scope` | 組織機関の資料範囲を解決中 |
| `preparing_documents` | Manifest と処理状態を確認中 |
| `ingesting` | 必要ファイルを再取込中 |
| `extracting` | ファイル単位で項目抽出中 |
| `aggregating` | 候補、競合及び網羅率を集約中 |
| `review_required` | OneOps の確認が必要な候補を生成済み |
| `completed` | 候補なしを含め、確認不要で正常終了 |
| `failed` | 継続不能な安定 Error Code で終了 |

`review_required`、`completed` 及び `failed` を終了状態とする。

#### 完了 Response 例

```json
{
  "id": "cag-extraction-task-uuid",
  "schema_version": 1,
  "status": "review_required",
  "subject_external_id": "oneops-organization-uuid",
  "scope": {
    "id": "cag-scope-uuid",
    "source_id": "cag-source-uuid",
    "canonical_prefix": "つ_0408_筑波大学/",
    "confidence": 1.0
  },
  "coverage": {
    "total_documents": 25,
    "ready_documents": 19,
    "analyzed_documents": 21,
    "failed_documents": 2,
    "excluded_documents": 2,
    "coverage_rate": 0.913
  },
  "field_candidates": [
    {
      "id": "cag-field-candidate-uuid",
      "field_code": "short_name",
      "value": "筑波大",
      "option_id": null,
      "confidence": 0.91,
      "evidence": [
        {
          "document_id": "cag-document-uuid",
          "document_version_id": "cag-document-version-uuid",
          "chunk_id": "cag-chunk-uuid",
          "resource_uri": "knowledge://document/cag-document-uuid",
          "canonical_path": "つ_0408_筑波大学/１．導入システム一覧/【筑波大】導入システム一覧.xlsx",
          "sheet": "基本情報",
          "cell_range": "B3",
          "page": null,
          "section": null,
          "excerpt": "略称 筑波大"
        }
      ]
    },
    {
      "id": "cag-field-candidate-uuid-2",
      "field_code": "maintenance_status",
      "value": "YES",
      "option_id": "oneops-maintenance-yes-uuid",
      "confidence": 0.94,
      "evidence": [
        {
          "document_id": "cag-document-uuid-2",
          "document_version_id": "cag-document-version-uuid-2",
          "chunk_id": "cag-chunk-uuid-2",
          "resource_uri": "knowledge://document/cag-document-uuid-2",
          "canonical_path": "つ_0408_筑波大学/０．保守契約書/20210107-仕様書案-SP確認ーIF確認-CSC確認.docx",
          "sheet": null,
          "cell_range": null,
          "page": null,
          "section": "保守対象",
          "excerpt": "保守対象を確認できる原文抜粋"
        }
      ]
    }
  ],
  "conflicts": [],
  "unresolved_fields": [
    {
      "field_code": "organization_category",
      "reason_code": "EVIDENCE_NOT_FOUND"
    }
  ],
  "document_failures": [
    {
      "document_id": "cag-document-uuid-3",
      "canonical_path": "つ_0408_筑波大学/参考資料/体制図.pdf",
      "reason_code": "EMPTY_TEXT",
      "retryable": true
    }
  ],
  "versions": {
    "source_generation_id": "cag-generation-uuid",
    "analysis_template_code": "ORGANIZATION_PROFILE_ENRICHMENT",
    "analysis_template_version": 2,
    "extractor_version": "customer-ledger-v1",
    "model_id": "configured-model-id"
  },
  "created_at": "2026-08-06T09:00:00Z",
  "completed_at": "2026-08-06T09:08:00Z"
}
```

`total_documents` 等の数値は形式例であり、筑波大学の固定件数ではない。実行時の Catalog Manifest を正とする。

### 8.4 Scope 単位の管理者再取込

分析結果から本文欠落又は取込失敗が判明した場合、管理権限を持つ OneOps 操作から次を呼び出す。

```http
POST /api/v1/knowledge/scopes/{scope_id}/ingestions
```

```json
{
  "reason": "ORGANIZATION_PROFILE_ENRICHMENT",
  "mode": "prepare_required_versions",
  "retry_statuses": [
    "observed",
    "metadata_only",
    "empty_text",
    "failed"
  ]
}
```

`Idempotency-Key: oneops-customer-scan-repair-<OneOps Scan UUID>` を Header に指定する。

1. Scope 未解決時に本 API を使用しない。最初の抽出要求で Scope を解決する。
2. 一般利用者へ本操作を提供しない。OneOps と CAG の双方で管理権限を検証する。
3. CAG は対象 Manifest と予定処理件数を記録する。
4. 成功した未変更ファイルを再処理しない。
5. 取込完了後、元の抽出 Task を新しい実行物理 ID で再実行し、前回 Task との関連を保存する。

## 9. CAG の実装要求

### 9.1 永続データ

CAG は少なくとも次の物理レコードを保持する。

1. `knowledge_analysis_scopes`。Scope 物理 ID、Source 物理 ID、外部対象対応、Prefix、解決根拠、信頼度及び有効期間を持つ。
2. `knowledge_extraction_tasks`。Task 物理 ID、Scope 物理 ID、依頼元、Idempotency Key、Template Version、状態及び Error Code を持つ。
3. `knowledge_extraction_task_documents`。Task 物理 ID、Document 物理 ID、Document Version 物理 ID、処理状態及び失敗理由を持つ。
4. `knowledge_field_candidates`。候補物理 ID、Task 物理 ID、項目 Code、値、Option 外部参照、信頼度及び集約状態を持つ。
5. `knowledge_candidate_evidence`。候補物理 ID、Document 物理 ID、Document Version 物理 ID、Chunk 物理 ID及び位置情報を持つ。
6. `knowledge_field_conflicts`。競合物理 ID、Task 物理 ID、項目 Code、候補集合及び判定理由を持つ。
7. `knowledge_processing_versions`。学習処理 Version 物理 ID、Document Version 物理 ID、Processor Fingerprint、状態、品質検証結果、作成日時、有効化日時及び置換元 Version 物理 ID を持つ。
8. Knowledge Block 管理。Block Version 物理 ID、学習処理 Version 物理 ID、Subject 参照、Fact Key、値、Version 関係及び Evidence を持つ。
9. `knowledge_block_applicabilities`。Applicability Revision 物理 ID、Block Version 物理 ID、適用開始日時、適用終了日時、管理状態、適用 Scope、置換元 Revision 物理 ID、変更理由及び監査情報を持つ。

CAG 内部の Source、Scope、Task、Document、Chunk、Candidate 及び Evidence の関係は物理 ID 外部キーで接続する。Code、名称及び Path を外部キーに使用しない。

Knowledge Block の値と Evidence、Document Version、学習処理 Version 及び Chunk の内容は作成後に上書きしない。訂正、原資料変更又は Processor 更新は新しい物理 ID の Version を追加し、Version 関係から追跡する。業務適用期間の変更は新しい Applicability Revision を追加する。

### 9.2 Scope 解決

1. 指定された Source の Catalog Entry だけを対象とする。
2. Code の完全一致を最優先し、正式名、略称及び Alias の正規化一致で補強する。
3. Prefix の区切りを考慮し、`0408` が別 Code の一部として一致しないようにする。
4. 一件の Directory Scope を一意に解決できた場合だけ自動継続する。
5. 複数候補は `SCOPE_AMBIGUOUS`、候補なしは `SCOPE_NOT_FOUND` とする。
6. 解決結果は Scope 物理レコードとして保存し、後続処理は Scope ID を参照する。
7. Directory が移動した場合は新しい Scope Revision を作り、過去 Task の再現性を維持する。

### 9.3 Manifest と再取込

1. Scope Prefix 配下の Catalog Entry を全件取得する。
2. Directory Entry と一時 Office File は分析対象件数から区別する。
3. 原資料の `content_hash` から新しい Document Version の追加要否を判定し、`processor_fingerprint` から新しい学習処理 Version の追加要否を独立して判定する。
4. `ready` は既存本文と Chunk を再利用する。
5. `source_changed`、`observed_only`、`metadata_only`、`extraction_failed` は Policy に従って再取込し、既存 Version を保持する。
6. 原資料内容が同じでも Processor Fingerprint が変化した場合は `processing_upgrade_required` とし、新しい学習処理 Version を作成する。
7. 新しい学習処理 Version の品質検証成功後にだけ `active` を切り替える。
8. `unsupported_extension` は対応 Parser がない理由を返す。
9. `empty_text` の PDF は OCR 対象可否を判定する。
10. 一件の失敗で全 Task を破棄せず、Manifest に失敗を残して許容された範囲で分析を継続する。
11. Source 全体を走査する場合も、抽出 Task の対象 Manifest は解決済み Scope に限定する。
12. 原資料が Source から消えた場合は Source Entry を `source_absent` として記録し、既存の Document Version、学習処理 Version、Knowledge Block 及び Chunk を削除しない。

### 9.4 逐次ファイル抽出

1. 全対象ファイルに Task Document レコードを作成する。
2. Excel は Sheet、Table、Header、Cell 及び数式結果を優先して構造的に処理する。
3. Word は Heading、Paragraph 及び Table を保持する。
4. PDF は Page、Text Block 及び OCR 状態を保持する。
5. 長文はファイル単位の小 Batch に分け、Checkpoint から再開できるようにする。
6. 各項目の候補は Evidence を一件以上持つ。
7. 要求項目に証拠がない場合、値を推測せず `unresolved_fields` へ記録する。
8. ファイル内検索を使用する場合、検索範囲を当該 Document ID 又は Scope ID に限定する。
9. 完全 Prompt と Schema 項目名を大量の `LIKE OR` 条件へ展開して全 Knowledge Chunk を検索しない。

### 9.5 集約

1. 同一項目、同一値及び同一根拠を重複排除する。
2. 正式契約書、台帳及び導入一覧等の資料種別優先順位を Template に定義する。
3. 学習処理 Version と業務知識 Version を別軸で評価する。技術的に `active` の処理 Version から、`analysis_context.as_of` に業務上適用する Knowledge Block を選択する。
4. 同一優先度で異なる値が存在する場合は競合として返す。
5. `master_reference` と `enum` は Request 内の Option へだけ対応付ける。
6. Option を一意に選べない場合は候補文字列と競合理由を返し、未登録物理 ID を生成しない。
7. CAG の集約結果を一般ナレッジとして再学習しない。派生結果として Template Version と Source Generation に結び付けて保存する。
8. 適用期間外の Knowledge Block は歴史知識として保持し、現在値候補から除外した理由を Task へ記録する。
9. 学習処理 Version の切替を理由に、Knowledge Block の業務適用期間を変更しない。

### 9.6 非同期実行と可用性

1. Scope 解決、取込、抽出及び集約は Worker で実行する。
2. Health、Task 状態及び Queue 状態 API は長時間処理中も応答する。
3. Task は段階、処理件数、失敗件数及び更新日時を Event として記録する。
4. 再試行は失敗段階と対象ファイルを引き継ぐ。
5. OneOps が同じ Task を再送しても Idempotency 契約を維持する。

## 10. OneOps の利用要求

### 10.1 システム設定

OneOps は顧客情報スキャンに使用する CAG 知識源をシステム設定で管理する。設定レコードは物理 ID を持ち、CAG Source 物理 ID、用途 Code、有効状態及び Agent Gateway 設定物理 ID を保持する。一般利用者は変更できない。

用途 Code は `CUSTOMER_LEDGER_EXTRACTION` とする。将来複数 Source を利用する場合、優先順位と適用条件を独立レコードで管理する。

### 10.2 スキャン開始

1. 利用者が顧客情報画面で「ナレッジからスキャン」を実行する。
2. OneOps は選択中の組織機関物理 ID から Code、正式名及び略称を取得する。
3. OneOps は有効な知識源設定と抽出 Template を取得する。
4. OneOps は自身の Scan 物理 ID を先に作成し、同 ID から Idempotency Key を生成する。
5. OneOps は本書の構造化 Request を CAG へ送信する。
6. OneOps は CAG Task 物理 ID と、解決後に返る CAG Scope 物理 ID を Scan へ保存する。

### 10.3 進捗と結果表示

画面は少なくとも次を表示する。

1. Scope 解決中、資料準備中、再取込中、抽出中、集約中及び確認待ちの段階。
2. 発見ファイル数、分析済み数、失敗数、除外数及び網羅率。
3. 項目ごとの候補値、信頼度及び根拠ファイル。
4. 根拠の Sheet、Cell、Page 又は Section。
5. 項目競合、未解決項目及び処理失敗ファイル。
6. 管理権限を持つ利用者向けの「資料を再取込」と「顧客情報を再分析」の別操作。

### 10.4 台帳反映

1. 候補は自動反映しない。
2. OneOps は利用者が採用した候補の物理 ID、Scan 物理 ID及び根拠を保存する。
3. 基本台帳参照項目は Request で渡した Option 物理 ID を保存する。
4. 既存値との不一致は上書き前に競合として表示する。
5. 外部資料に存在しないことを理由に既存台帳を削除しない。
6. 一部ファイルが失敗した場合、網羅率と失敗内容を確認画面に残す。

## 11. Error Code

| Error Code | 発生条件 | OneOps の扱い |
| --- | --- | --- |
| `REQUEST_SCHEMA_INVALID` | Request 又は項目契約が不正 | 管理設定エラーとして表示 |
| `KNOWLEDGE_SOURCE_NOT_FOUND` | Source 物理 ID が存在しない | 知識源設定を確認 |
| `KNOWLEDGE_SOURCE_UNAVAILABLE` | Source 又は共有場所へ接続できない | 管理者向け再実行を提示 |
| `SCOPE_NOT_FOUND` | 組織機関に対応する範囲がない | Code、名称、略称及び Source を確認 |
| `SCOPE_AMBIGUOUS` | 複数範囲が同順位で一致 | 候補を管理者へ提示して対応付け |
| `INGESTION_FAILED` | 必須資料の再取込が継続不能 | 失敗ファイルと理由を表示 |
| `EXTRACTION_FAILED` | ファイル分析又は集約が継続不能 | 失敗段階と再分析操作を表示 |
| `EXTRACTION_PARTIAL` | 一部資料だけ分析可能 | 候補と網羅率を表示して確認を要求 |
| `RETRIEVAL_FAILED` | 限定検索又は索引照会が失敗 | 検索修復後に再分析 |
| `EVIDENCE_NOT_FOUND` | 項目の根拠がない | 項目を未解決として表示 |
| `IDEMPOTENCY_CONFLICT` | 同じ Key で異なる Request | OneOps の Request 管理を修正 |

内部 SQL、Table 名、Stack Trace、共有資格情報及び秘密情報を Error Response に含めない。内部例外は CAG の監査可能な Log と Task Event に関連 ID 付きで記録する。

## 12. セキュリティと監査

1. OneOps と CAG の双方で呼出元、利用者、権限、Source Scope 及び組織機関範囲を検証する。
2. Scope 単位再取込はシステム管理権限を必須とする。
3. 候補 Evidence にパスワード、秘密鍵、Token 又は資格情報値を含めない。
4. CAG は秘密情報検出時に値を Mask し、資料存在と項目種別だけを返す。
5. OneOps は Scan 開始、CAG Task、候補確認、台帳反映、再取込及び再分析を監査記録へ残す。
6. Audit は OneOps Scan ID、CAG Task ID、CAG Scope ID及び対象組織機関物理 ID を相関可能にする。
7. 表示用 Code、名称、略称及び Path 変更後も、過去結果は物理 ID と Version から追跡可能にする。

## 13. 非機能要件

1. API 受付は通常負荷で 3 秒以内に `202 Accepted` を返す。
2. 状態取得 API は抽出処理中も 2 秒以内に応答する。
3. Worker 再起動後、未完了 Task を Checkpoint から再開又は明示失敗へ確定する。
4. 1ファイルの失敗が Scope 全体の処理履歴を消失させない。
5. Manifest の全対象ファイルに最終処理状態を持たせる。
6. 同一 Document Version と同一 Template Version のファイル単位抽出結果は再利用可能にする。
7. Source Generation、Document Version、Template Version、Extractor Version 及び Model ID を結果へ保存する。
8. 長時間抽出中も CAG Health、Task 状態及び通常 API の応答性を維持する。
9. 再取込、原資料変更、Processor 更新及び Source からの消失によって、学習成功済みの Document Version、学習処理 Version、Knowledge Block 又は Chunk を自動削除しない。
10. 通常検索は `active` の学習処理 Version を使用する。過去時点再現及び Rollback は指定 Version を明示して実行する。

## 14. 筑波大学サンプルによる実環境受入

### 14.1 受入前提

1. OneOps に物理 ID を持つ `0408 筑波大学` が存在する。
2. OneOps のシステム設定に `UPDS顧客別情報` の CAG Source 物理 ID が登録されている。
3. CAG Catalog に `つ_0408_筑波大学/` と、その配下の既知資料が登録されている。
4. 検証用利用者はスキャン権限を持ち、再取込検証用管理者は再取込権限を持つ。
5. 受入で期待値を固定する資料は、機密情報を除いた管理済み Fixture 又は承認済み実資料とする。

### 14.2 最終受入一覧

| No. | 原要求 | 検査方法 | 合格証拠 |
| --- | --- | --- | --- |
| 1 | Ops が実パスを知らずに分析を開始できる | Request に実パスとファイル一覧がなく、組織機関物理 ID と Source 物理 ID があることを確認 | OneOps Request 記録 |
| 2 | CAG が筑波大学 Scope を解決する | `0408`、`筑波大学`、`筑波大` から一意に解決する | Scope ID と `つ_0408_筑波大学/` |
| 3 | 全ファイルを列挙する | Scope Prefix の Catalog File 件数と Manifest 件数を照合 | 件数比較結果 |
| 4 | 学習済み資料を再利用する | 未変更 `ready` ファイルが再取込されず抽出されることを確認 | Task Document と取込 Event |
| 5 | 必要ファイルだけ再取込する | `empty_text`、`metadata_only` 又は失敗 Fixture を一件設定して実行 | 対象限定 Ingestion Manifest |
| 6 | 逐次ファイル抽出する | 全対象 File に Task Document 最終状態があることを確認 | Task Document 一覧 |
| 7 | Ops の項目契約に従う | 区分、Code、名称、略称、保守有無、備考、契約、サービス、VPN 及び環境の結果を確認 | Response Schema 検証 |
| 8 | 基本台帳参照を物理 ID で返す | 区分と保守有無が Request 内 Option ID 又は未解決になることを確認 | Candidate JSON |
| 9 | 根拠を必須にする | 全候補に Document ID、Version ID、Resource URI と位置情報があることを確認 | Evidence 整合性試験 |
| 10 | 根拠なし推測を防ぐ | 資料に存在しない項目を要求する | `EVIDENCE_NOT_FOUND` |
| 11 | 競合を明示する | 同順位で異なる値を持つ二資料 Fixture を分析する | Conflict JSON と両 Evidence |
| 12 | 網羅率を表示する | Total、Analyzed、Failed、Excluded から率を再計算する | API 値と画面表示 |
| 13 | 既存値を保護する | 候補生成後の OneOps 台帳を確認する | 確認前は変更 0 件 |
| 14 | 確認後に物理 ID 台帳へ反映する | 一候補を採用する | 反映先 UUID、FK、監査記録 |
| 15 | 外部資料欠落で削除しない | 資料から既存項目を除いた Fixture で再分析する | 既存台帳削除 0 件 |
| 16 | 状態 API を維持する | 抽出中に Health と Task API を定期取得する | 応答時間記録と Error 0 件 |
| 17 | Error を分類する | Scope 不明、取込失敗、抽出失敗及び部分成功を発生させる | 安定 Error Code と画面文言 |
| 18 | 秘密情報を露出しない | API、画面、Console、監査及び Log を検査する | 資格情報値検出 0 件 |
| 19 | 再取込と再分析を区別する | 管理者操作をそれぞれ実行する | 別 Task、別監査 Event |
| 20 | 再実行を追跡する | 再取込後に元 Scan を再分析する | 親 Task ID と新 Task ID の関連 |
| 21 | UI の実運用を確認する | 対象環境でスキャン、進捗、候補、根拠、競合を操作する | Browser Screenshot と Console Error 0 件 |
| 22 | 最終配信を確認する | Build、関連 Test、配信版、Health、Local HEAD と `origin/master` を確認する | Test Log、配信 Version、Commit ID |
| 23 | 学習処理 Version を切り替える | 同じ原資料を新 Processor で再処理する | 新 Version が `active`、旧 Version が `superseded`、旧データが残存 |
| 24 | 学習処理失敗時に現行知識を守る | 新 Processor の品質検証を失敗させる | 旧 Version が `active` のまま、検索結果欠落 0 件 |
| 25 | 業務知識の時間的適用性を管理する | 異なる適用期間の保守担当窓口二 Version を基準日時別に分析する | 基準日時ごとの採用 Block と除外理由 |
| 26 | 二つの Version 軸を混同しない | Processor だけを更新して再分析する | 業務 Knowledge Block の適用期間変更 0 件 |
| 27 | 学習済み知識を永久保持する | 原資料更新と Source からの消失を発生させ、旧 Version を照会する | 旧 Document Version、処理 Version、Block、Chunk の残存と監査記録 |

一項目でも不合格の場合は修正し、最終受入一覧の先頭から全項目を再実行する。全項目の成果物、実行時挙動及び配信状態が確認された時点で実装完了とする。

## 15. 必須試験

### 15.1 CAG 単体試験

1. Scope の一意解決、未検出及び複数候補。
2. Path 区切りを考慮した Code 完全一致。
3. Manifest の完全列挙と Directory、一時 File の区別。
4. `ready` 再利用、`source_changed` の新 Document Version 追加、`processing_upgrade_required` の新学習処理 Version 追加、`empty_text` OCR 分岐及び未対応拡張子。
5. Excel、Word、PDF の位置情報付き抽出。
6. Enum と Master Reference の Option 制約。
7. Evidence なし候補の拒否。
8. 競合集約、資料優先順位及び日付評価。
9. Idempotency と Worker 再開。
10. Error Response の内部情報及び秘密情報除去。
11. 原資料更新、Processor 更新及び Source 消失後の旧 Version 永久保持。
12. 学習処理 Version の `active` と `superseded` の排他切替及び失敗時 Rollback。
13. `analysis_context.as_of` による業務 Knowledge Block 適用期間選択。
14. 学習処理 Version 切替時の業務 Knowledge Block 適用期間不変性。

### 15.2 OneOps 単体及び結合試験

1. Request Schema、Header、物理 ID及び Idempotency Key。
2. CAG 全状態から OneOps Scan 状態への対応。
3. Scope、Coverage、Candidate、Evidence、Conflict 及び Failure の保存。
4. Enum と Master Reference の物理 ID 検証。
5. 確認前の台帳非更新と確認後の反映。
6. 既存台帳の非削除及び非自動上書き。
7. 再取込と再分析の権限制御及び監査。
8. CAG Timeout、部分成功及び状態取得不能時の表示。

### 15.3 実環境試験

1. `0408 筑波大学` で Scope と Manifest を確認する。
2. 既知の DOCX、XLSX 及び PDF の処理状態を確認する。
3. 抽出中の CAG Health と Task API を確認する。
4. OneOps 画面で候補、根拠、網羅率、失敗及び競合を確認する。
5. Browser Console に Error がないことを確認する。
6. 資格情報及び内部 SQL が API と画面へ表示されないことを確認する。
7. Screenshot、API Response、Task Event、Test Result 及び Commit ID を受入証拠として保存する。

## 16. 実装順序

1. CAG に Scope、Task、Task Document、Candidate、Evidence 及び Conflict の物理データモデルを追加する。
2. CAG に Catalog ベースの Scope 解決と Manifest API 内部処理を追加する。
3. CAG に Scope 単位の差分再取込を追加する。
4. CAG に Template 駆動の逐次ファイル抽出と集約を追加する。
5. CAG に顧客台帳抽出開始、状態取得及び管理者再取込 API を追加する。
6. OneOps の現行顧客ナレッジスキャン Request を本契約へ置き換える。
7. OneOps に進捗、網羅率、資料失敗、競合、再取込及び再分析を追加する。
8. 筑波大学 Fixture、結合試験及び実環境最終受入を実施する。

各段階で最小の End to End 経路を動作させ、段階内の関連試験を完了してから次へ進む。

## 17. 現行実装状態

2026年8月7日時点の実装状態は次のとおりである。

1. OneOps Gateway は組織機関物理 ID、知識源物理 ID、Scope Policy、取込 Policy、Template Version 2 及び項目型契約を顧客台帳抽出 API へ送る。
2. CAG は Catalog から物理 Scope を解決し、Directory Prefix を Connector の収集開始点へ下推して Scope 配下の Manifest を生成する。
3. 範囲限定再取込は Scope 物理 ID と Prefix を幂等識別に含め、範囲外 Source Entry の状態を変更しない。
4. CAG は Task Document、逐次ファイル抽出、Coverage、Candidate、Evidence、Conflict、Unresolved Field 及び安定 Error Code を物理保存する。
5. `２．カスタマイズ情報` は `CUSTOMER_CUSTOMIZATION_V1`、`６．リモート接続情報` は `CUSTOMER_VPN_V1` と `CUSTOMER_ENVIRONMENT_V1` により構造化する。
6. OneOps は確認済み候補を組織機関物理 ID、Scan 物理 ID 及び Candidate 物理 ID の強参照を持つ台帳へ反映する。
7. 実環境最終受入は本書 15.3 と 18 の証拠を揃えた時点で確定する。

## 18. 完了定義

本要件の完了は文書作成完了を意味しない。CAG と OneOps の実装、関連文書、Migration、単体試験、別組織 Fixture を含む結合試験、実環境配信、ブラウザー確認、Console 確認、Screenshot 及び筑波大学サンプルによる実環境受入がすべて合格した時点を機能完了とする。
