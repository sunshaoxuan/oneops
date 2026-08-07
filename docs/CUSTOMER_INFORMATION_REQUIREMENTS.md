# 顧客情報要件

更新日: 2026年8月6日

## 1. 目的

OneOps の第 1 階層「環境情報」を「顧客情報」へ変更し、選択中の組織機関を顧客として、基本情報、契約、稼働中の製品及びサービス、ネットワーク環境、問合せ、関連タスク及びチケットを一か所で確認できるようにする。

既存の組織機関物理 ID を顧客の強参照として使用する。顧客 Code、名称、略称は表示及び外部検索条件として使用し、内部テーブル間の外部キーには使用しない。

## 2. 画面構成

第 1 階層ナビゲーションは「顧客情報」と表示し、正式 URL は `/customers` とする。旧 `/environments` へのアクセスは同じ顧客情報画面へ正規化する。

顧客情報は次の七つの頁を持つ。

1. 基本情報
2. カスタマイズ情報
3. 契約情報
4. サービス情報
5. ネットワーク環境
6. 問合情報
7. 関連タスク及びチケット

上部の共通組織機関選択を切り替えた場合、全頁は同じ組織機関物理 ID へ切り替わる。前の顧客の一覧、選択状態、エラー及びページ番号を残さない。

## 3. 基本情報

基本情報には組織機関台帳の区分、機関 Code、機関名、略称、保守有無及び備考を表示する。全項目を参照専用とし、顧客情報画面には組織機関台帳及び外部システム対応の編集操作を配置しない。

基本情報の参照には `organizations.read` を使用する。

## 3.1 カスタマイズ情報

カスタマイズ情報は、共通の組織機関基本台帳に含めない顧客向けの個別カスタマイズ内容を表示及び管理するための専用頁とする。日本語は「カスタマイズ情報」、中国語は「客户化信息」、英語は「Customization information」と表示する。

基本情報の直後に独立 Tab を表示し、`２．カスタマイズ情報` の根拠資料から確認された構造化記録を一覧表示する。各記録は名称、区分、概要、業務目的、対象コンポーネント、状態及び備考を持つ。未登録時は専用の空状態を表示する。自由形式項目又は任意 JSON 保存は使用しない。

各カスタマイズ記録は独立した UUID 物理 ID を持ち、組織機関物理 ID を `organizations.id`、反映元 Scan 物理 ID を `customer_knowledge_scans.id`、反映元 Candidate 物理 ID を `customer_knowledge_scan_candidates.id` へ外部キー接続する。Code、名称又は略称を強参照に使用しない。

利用者が根拠付き `customizations` Candidate を確認して反映した場合だけ物理記録を作成する。EXE、Database、Archive 又は Shortcut の Path Evidence だけでカスタマイズ内容を作成しない。

## 4. 契約情報

契約情報は顧客物理 ID に所属する契約明細を管理する。各明細は独立した物理 ID を持ち、次の項目を保持する。

1. 明細種別。`PRODUCT` 又は `SERVICE`
2. 製品物理 ID。明細種別が `PRODUCT` の場合に必須
3. サービス名称。明細種別が `SERVICE` の場合に必須
4. 導入契約状態、開始日、終了日
5. 保守契約状態、開始日、終了日
6. 備考、改訂番号、作成日時、更新日時、アーカイブ日時

契約状態は `NONE`、`PLANNED`、`ACTIVE`、`EXPIRED`、`TERMINATED` とする。終了日は開始日より前にできない。製品明細は製品物理 ID を `products.id` へ外部キー接続する。

契約情報の参照には `environments.read`、追加、変更及びアーカイブには `environments.write` を使用する。

## 5. サービス情報

サービス情報には、現在日が契約期間内で導入契約又は保守契約が `ACTIVE` の契約明細を表示する。現行環境台帳で状態が `ACTIVE`、製品利用状態が `ACTIVE`、確認状態が `CONFIRMED` の製品も表示する。

同一顧客及び同一製品について契約明細と環境台帳の両方に存在する場合、契約明細を主表示とし、環境台帳の版数及び環境数を補足する。

## 6. ネットワーク環境

ネットワーク環境は「VPN 情報」と「サーバー詳細情報」の二つに分ける。

VPN 情報は顧客物理 ID に所属する独立物理レコードとして、名称、方式、提供元、接続先、状態、備考及び改訂番号を保持する。パスワード、秘密鍵、共有鍵及び Token は本テーブルへ保存しない。

サーバー詳細情報には従来の環境情報機能をそのまま配置する。環境グループ、環境、製品版数、端点、暗号化済み資格情報、アーカイブ及び既存の権限制御を維持する。

サーバー詳細情報は顧客情報配下の子機能であるため、独立画面用の大見出し、説明、顧客表示及び大型集計カードを表示しない。有効環境、本番、検証、社内及びアーカイブの絞込は軽量な Filter として維持し、「環境を追加」操作を同じ Toolbar の右側に表示する。

環境グループは独立した左 Column を使用せず、選択中グループを示す折畳可能な Tab Bar として一覧及び詳細の上部へ配置する。主表示は環境一覧と環境詳細の 2 Column とし、狭い画面では 1 Column に切り替える。

VPN 情報はネットワーク環境直下の専用子機能で管理するため、サーバー詳細情報内の環境詳細 Tab には重複表示しない。

## 6.1 学習済みナレッジの顧客情報スキャン

顧客情報画面は、選択中の組織機関物理 ID、Code、正式名及び略称を使用し、CAG の学習済みナレッジから基本台帳、契約、サービス、VPN 及び環境の候補を取得する。OneOps は CAG 内の実パス又はファイル一覧を保持しない。

1. スキャン自身は UUID 物理 ID を持ち、組織機関物理 ID、Agent Gateway 設定物理 ID及び CAG Task 物理 ID を保持する。
2. 候補自身も UUID 物理 ID を持ち、スキャン物理 ID と組織機関物理 ID を外部キーで保持する。
3. スキャンは CAG Customer Ledger Extraction schema v1 の非同期 Task として実行し、待機、Scope 解決、資料準備、再取込、抽出、集約、確認待ち、完了及び失敗を表示する。
4. CAG Project 物理 ID、Knowledge Source 物理 ID、優先順位及び有効状態は用途 Code `CUSTOMER_LEDGER_EXTRACTION` のシステム設定として管理する。
5. Request は Catalog Scope、全件 Coverage、基準日時、必要 Version 準備、項目契約及び候補限定方針を明示する。
6. CAG の Coverage、Conflict、Unresolved Field、Document Failure、Source Version、Template Version、Extractor Version 及び Model Version を保存して画面へ表示する。
7. 全候補に Document ID、Document Version ID、Chunk ID、Resource URI、規範 Path、位置情報及び脱敏済み Excerpt を必須とする。
8. 根拠を持たない候補、Citation と一致しない候補、登録 Schema に合わない候補及び許可外 Option ID は台帳候補にしない。
9. 候補は利用者が確認した後に台帳へ反映し、反映先物理 ID と監査参照を保存する。文字列項目は抽出結果の正式なスカラー値を使用し、構造化 Object 全体を台帳文字列へ変換しない。確認前、資料欠落時及び再分析時に既存台帳を変更又は削除しない。
10. 環境候補は環境 Group、製品版数及び Endpoint の物理 ID を一意に確定できるまで確認対象として保持する。
11. 再取込と再分析を別操作とする。再取込は `customer.knowledge.manage`、再分析は `customer.knowledge.scan` を要求し、新 Scan は親 Scan 物理 ID を保持する。
12. 候補の確認、反映及び却下は `customer.knowledge.review` を要求する。
13. Scope 不明、Scope 競合、取込失敗、抽出失敗、部分成功及び Timeout は安定 Error Code と三言語表示へ変換する。
14. Task 状態を取得できない状態が 15 分継続した場合はスキャンを失敗へ確定し、再分析又は再取込を選択できるようにする。
15. CAG の内部例外、SQL、内部 Table 名、Stack Trace 及び資格情報値を API、画面、監査、Console 又は Log へ表示しない。

接続先の認証情報は `environments.credentials.read` を持つ利用者に限り、追加の Modal を開かず接続先行の中へ直接表示する。読取権限を持たない利用者には認証情報の登録状態、値及び操作を表示せず、認証情報取得 API も実行しない。`environments.credentials.write` を併せて持つ利用者は同じ行内で編集及び保存できる。

## 7. 問合情報

問合情報は組織機関台帳で管理する問合システム顧客 Code を用いて問合支援ソースを検索する。未設定時は組織機関 Code を使用する。検索条件へ担当者及び担当者名を設定せず、担当者の有無にかかわらず顧客に属する問合せを対象とする。

一覧には問合番号、件名、状態、担当者、更新日時及び顧客名を表示する。全表示列を昇順及び降順で並べ替えられるようにし、初期表示は件名の昇順とする。外部サイトから今回取得した全結果を並べ替えた後にページングし、ページ変更時は選択中の列と方向を保持し、列変更時は 1 ページ目へ戻す。ページ番号と 1 ページ件数を保持し、顧客切替時は 1 ページ目へ戻す。詳細表示は既存の問合支援画面と同じ案件詳細へ遷移できるようにする。

問合情報の利用には `inquiries.use` が必要である。権限がない場合は顧客情報画面内に権限不足を表示し、外部検索を実行しない。

## 8. 関連タスク及びチケット

顧客と Backlog プロジェクトの関係は顧客物理 ID と Backlog プロジェクト物理 ID の対応として保存する。プロジェクト名称又はプロジェクト Key を強参照に使用しない。

一覧はシステム共通 Backlog 設定の API Key を使用し、対応付け済みプロジェクトの全チケットを取得する。担当者条件は送信しない。Backlog API の `offset` と `count` を利用し、件数 API の総件数と一致するページングを行う。

一覧にはチケット Key、件名、プロジェクト、状態、担当者、優先度、期限及び更新日時を表示する。全表示列を昇順及び降順で並べ替えられるようにし、初期表示は件名の昇順とする。チケット Key から許可済み Backlog Origin の詳細画面を開けるようにする。並べ替えは課題 ID による重複排除後、ページング前の全課題を対象とし、ページ変更時は選択中の列と方向を保持し、列変更時は 1 ページ目へ戻す。

問合情報及び関連タスク及びチケットの全表示列には列幅のドラッグ調整を提供する。最小幅を設け、調整値は同一ブラウザーの顧客情報画面で再利用する。狭い画面では既存の横方向スクロールを維持する。

API Key が未設定、接続が無効、プロジェクト対応が未設定の場合は、原因を区別した案内を表示する。資格情報をブラウザー、エラー、監査及びログへ出力しない。

## 9. API

顧客ナレッジスキャンは CAG の専用
`POST /api/v1/knowledge/extractions/customer-ledger` を使用する。OneOps は
CAG Project、Knowledge Source、組織機関及び Option の物理 ID、Code、名称、
基準日時並びに `requested_fields` を schema v1 の構造 Request として送る。
実パス、ファイル一覧及び自由形式 Prompt は送らない。

`２．カスタマイズ情報` は `customizations`、`６．リモート接続情報` は
`vpns` と `environments` の構造化候補として扱う。独立した
`remote_access` 及び `repositories` 候補は使用しない。VPN と Environment
は明示的な根拠を必要とし、資格情報値は候補、根拠表示、監査及びログへ
保存しない。

1. `GET /api/work-center/v1/customers/{organizationId}/information`
2. `POST /api/work-center/v1/customers/{organizationId}/contracts`
3. `PUT /api/work-center/v1/customers/{organizationId}/contracts/{contractId}`
4. `DELETE /api/work-center/v1/customers/{organizationId}/contracts/{contractId}`
5. `POST /api/work-center/v1/customers/{organizationId}/vpn-connections`
6. `PUT /api/work-center/v1/customers/{organizationId}/vpn-connections/{vpnId}`
7. `DELETE /api/work-center/v1/customers/{organizationId}/vpn-connections/{vpnId}`
8. `GET /api/work-center/v1/customers/{organizationId}/inquiries?page={page}&pageSize={pageSize}&sortField={sortField}&sortOrder={sortOrder}`
9. `GET /api/work-center/v1/customers/{organizationId}/backlog-project-options`
10. `PUT /api/work-center/v1/customers/{organizationId}/backlog-projects`
11. `GET /api/work-center/v1/customers/{organizationId}/backlog-issues?page={page}&pageSize={pageSize}&sortField={sortField}&sortOrder={sortOrder}`
12. `GET /api/work-center/v1/customer-knowledge-source-settings`
13. `PUT /api/work-center/v1/customer-knowledge-source-settings`
14. `POST /api/work-center/v1/customers/{organizationId}/knowledge-scans`
15. `GET /api/work-center/v1/customers/{organizationId}/knowledge-scans/latest`
16. `GET /api/work-center/v1/customers/{organizationId}/knowledge-scans/{scanId}`
17. `POST /api/work-center/v1/customers/{organizationId}/knowledge-scans/{scanId}/reanalyze`
18. `POST /api/work-center/v1/customers/{organizationId}/knowledge-scans/{scanId}/reingest`
19. `POST /api/work-center/v1/customers/{organizationId}/knowledge-scans/{scanId}/candidates/{candidateId}/apply`
20. `POST /api/work-center/v1/customers/{organizationId}/knowledge-scans/{scanId}/candidates/{candidateId}/dismiss`

全 API はセッション、CSRF、RBAC、組織機関範囲及び操作監査を既存 OneOps 契約に従って適用する。

## 10. 最終受入条件

1. 第 1 階層の表示名が三言語で顧客情報へ変更される。
2. `/customers` を直接開き、再読み込み後も顧客情報を表示する。
3. 旧 `/environments` が顧客情報へ正規化される。
4. 七つの頁が指定順序で表示され、基本情報の直後に三言語のカスタマイズ情報 Tab がある。
5. 基本情報が選択中顧客の組織機関物理 ID と一致する。
6. 基本情報に問合システム顧客 Code の入力欄及び保存操作が表示されない。
7. 製品及びサービス契約を追加、変更、アーカイブできる。
8. サービス情報に有効契約と生效中の環境製品が表示される。
9. VPN 情報を追加、変更、アーカイブできる。
10. 従来の環境、サーバー端点及び資格情報機能がサーバー詳細情報内で使用できる。
11. 問合一覧が顧客で限定され、担当者条件を送信せず、全表示列の並べ替え、件名昇順の初期表示、全結果を対象とするページング及び列幅調整を確認できる。
12. Backlog 一覧が対応付け済みプロジェクトで限定され、担当者条件を送信せず、全表示列の並べ替え、件名昇順の初期表示、重複排除後の全結果を対象とするページング及び列幅調整を確認できる。
13. 権限不足及び外部設定不足が安全な案内となり、外部資格情報が露出しない。
14. 単体試験、Production Build、対象環境配信、ブラウザー表示、Console 及び Screenshot が合格する。
15. 最終受入の全項目を先頭から確認し、成果物、実行時挙動及び配信状態の証拠を保存する。
16. 中国語又は英語の意味検索から日文の顧客資料を取得し、カスタマイズ、VPN 及び Environment 候補を根拠と一緒に表示する。
17. `remote_access` 及び `repositories` の旧候補を生成又は表示しない。
18. 日文の利用者名、パスワード及び接続先が候補、API、監査、Console 又は画面へ露出しない。
19. Scope、Manifest 件数、逐次ファイル状態、Coverage、Conflict、Unresolved Field 及び Document Failure が CAG Response と画面で一致する。
20. 再取込と再分析が別 Task と別監査 Event になり、親 Scan と新 Scan の物理 ID 関係を確認できる。
21. システム管理で用途別 CAG Project 物理 ID、Source 物理 ID、優先順位及び有効状態を保存できる。
22. `customer.knowledge.scan`、`customer.knowledge.review` 及び `customer.knowledge.manage` の権限境界が API と画面で一致する。
23. カスタマイズ情報 Tab は根拠付き Candidate から反映した物理記録を一覧表示し、未登録時に当該言語の空状態を表示する。
24. `２．カスタマイズ情報` の SQL 等の取込可能資料が Manifest で除外されず、`CUSTOMER_CUSTOMIZATION_V1` Candidate を生成できる。
25. `６．リモート接続情報` の根拠は VPN と Environment Candidate へ分類され、確認後に各物理台帳へ反映できる。
26. Environment Candidate は組織機関の `お客様環境` Group 物理 ID を参照し、製品 Code と Version が指定された場合は一意な Product Version 物理 ID と外部キー接続する。曖昧又は未解決時は反映しない。
27. 再取込要求の CAG Ingestion 物理 ID は `customer_knowledge_scans.cag_ingestion_id` に保存し、旧表が存在する正式 DB にも幂等に列を追加する。
