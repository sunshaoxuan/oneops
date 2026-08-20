# 製品構築機能要件

更新日：2026-08-20

## 機能境界

1. 旧 One構築コンソールを `D:\nginx\app\builder` へ移し、OneOps の「製品構築」サブ機能として提供する。
2. ブラウザは OneOps の HTTPS エントリだけへアクセスする。製品構築画面、API、履歴、ログ、成果物ダウンロードは `/api/work-center/v1/builder/` に統一する。
3. OneOps Gateway は標準入出力プロトコルで内部 Python worker を管理する。worker は TCP リスナーを作成せず、旧 `8091` ポートを使用しない。
4. ビルド端末はリモート実行ノードとして継続利用する。ビルド端末の画面と API は OneOps の同一オリジン経路で代理し、ブラウザからビルド端末ポートへ直接アクセスしない。
5. 標準版、NHO 版、標準発版、機関封包、顧客化、履歴、ログ、停止、削除、成果物確認、ダウンロードの既存契約を維持する。
6. ビルド端末の停止中も製品構築画面、履歴、端末状態、起動操作を宿主側で提供する。停止状態は正常な運用状態として扱い、OneOps Gateway 全体を障害状態へ変更しない。

## 権限境界

1. 第1階層の「製品構築」入口及び `/api/work-center/v1/builder/` 配下の画面、履歴、端末、構築、ログ及び成果物操作は、システム範囲の `builder.use` を必須とする。
2. `builder.use` は製品構築という業務機能を利用する権限であり、ワークベンチの集計参照に使う `dashboard.read` とは分離する。
3. ロール・権限画面では `builder` 資源の「利用」列として表示し、保存する権限 Code は `builder.use` を使用する。

## 共通コンテキスト

1. ユーザーが「製品構築」を開いた時、OneOps は共通コンテキストで選択中の組織機関 `name` を構築器の `organisation_name` へ設定する。
2. 受け渡す値は組織機関台帳の業務名称とする。組織機関の物理 ID は OneOps データモデル内に保持し、通常の構築画面には表示しない。
3. 機関名は初期値として設定する。入力欄は編集可能な状態を維持し、今回の交付内容に合わせて手動変更できる。
4. 共通コンテキストで組織機関を切り替えた場合、構築画面を新しい機関名で再初期化する。
5. 履歴タスクを表示する場合、そのタスクに保存された機関名を表示し、現在のコンテキストで履歴事実を上書きしない。

## OneOps ネイティブ画面

1. OneOps 埋め込みモードでは旧単独画面の製品ナビゲーションを表示しない。
2. OneOps 埋め込みモードでは単独の言語選択を表示せず、OneOps の現在言語に従う。
3. 構築画面は OneOps ワークスペースの利用可能幅を使用し、旧単独画面の固定最大幅を残さない。
4. OneOps ページ側に追加の縦スクロールを作らず、構築ワークスペース内の内容スクロールを一つに保つ。
5. 単独画面構造はロールバックと回帰試験用に維持する。OneOps は `embedded=oneops` でネイティブワークスペース表示を有効にする。

## OneOps 認証連携

1. 埋め込み画面から送信する POST、PUT、PATCH、DELETE は、`oneops_csrf` Cookie の値を `X-OneOps-CSRF` ヘッダーへ設定する。
2. 単独画面の `X-Management-Token` 契約は維持し、OneOps 埋め込み時だけ存在する CSRF 値と競合させない。
3. タスク作成、停止、削除、設定履歴削除、ビルド端末起動停止、成果物生成の全更新操作に共通認証ヘッダーを使用する。
4. API が構造化エラーを返した場合、画面は `message` と `code` を可読文字列として表示する。`[object Object]` を表示しない。
5. タスク作成 POST が Gateway の CSRF 検証を通過し、構築履歴へ新しいタスクが作成されることを実画面で確認する。

## 実行環境とデータ

1. ソースは `D:\nginx\app\builder` に置く。
2. Python ランタイムは `D:\nginx\runtime\python` を使用する。
3. 固定テンプレート、SQL テンプレート、ミドルウェアキャッシュ、データ連携キャッシュは `D:\nginx\app\builder\.standalone-template` に置く。
4. 構築履歴は `D:\nginx\app\builder-data\standalone-builds` に置く。
5. 正式交付結果は `D:\nginx\app\builder-data\deliveries` に置く。
6. ローカル資格情報は `D:\nginx\app\builder\vm-access.env` と `git-access.env` に保存し、バージョン管理へ含めない。
7. 旧履歴データは `scripts\migrate-onebuild-data.ps1` で移行する。移行前に待機中または実行中タスクが存在しないことを確認する。
8. Redis と Nginx の選択可能バージョンは、各数値セグメントを比較した降順で表示する。配布元 API の公開日時順には依存しない。
9. 新規構築画面の初期選択は Nginx `1.30.2`、Redis `8.8.0` とする。「同梱版」の選択肢と同梱物は変更しない。指定バージョンを配布元カタログで確認できない場合は「同梱版」へ戻す。
10. 顧客化構築で Help を選択した場合、SQL 資材の選択状態にかかわらず `製品/1.tenant/ohr_help.sql` を生成する。`製品/1.tenant` が存在しない場合は Help SQL の書込処理が作成する。完全な SQL 資材を選択した場合の `1.tenant` と `2.ohr` の入力検証は維持する。
11. 標準発版はバックエンド単独、フロントエンド単独、両方の構築を受け付ける。バックエンド単独は `package.zip`、フロントエンド単独は `web.zip`、両方は二つの成果物を出力する。両方の分岐が空の場合だけ構築対象不足として拒否する。

## HTTPS 証明書資材

1. HTTPS を有効にする場合は PEM 形式の WEB 証明書ファイルと暗号化されていない PEM 形式の秘密鍵ファイルを一組でアップロードする。
2. OneOps は証明書と秘密鍵の形式、256 KiB の単一ファイル上限及び鍵の組合せを構築開始前に検証する。
3. HTTPS を有効にする構築は `conf_prod` の生成を必須とする。
4. ファイル選択後は WEB 証明書名と WEB Key 名へ選択した実ファイル名を直ちに表示する。画面表示名、タスク値、封包名及び Nginx 設定参照を同じ値に統一する。
5. アップロード資材は選択した実ファイル名のまま `web.zip` の `ohr-cicd/conf_prod` に収録する。
6. `ohr-cicd/conf_prod/nginx.conf` と `nginx_https.conf` は、収録した証明書と Key の実ファイル名を参照する。
7. インストーラーが `web.zip` を Nginx 実行ディレクトリへ展開した時点で証明書、秘密鍵及び HTTPS 設定を同じ構成ディレクトリへ配置し、追加コピーなしでサービスを起動できる状態にする。
8. 証明書及び秘密鍵の内容は構築タスクの metadata、設定履歴、実行ログ、公開証拠及び Git に保存しない。タスクには検証済み実ファイル名とアップロード済み状態だけを保存する。
9. 実ファイル名は英数字で開始し、英数字、ピリオド、下線及びハイフンだけを許可する。証明書は `.crt` 又は `.pem`、Key は `.key` 又は `.pem` を許可し、経路文字、Windows 保留名及び同一ファイル名を拒否する。
10. タスク削除時はタスク専用ディレクトリに保存したアップロード原本も同時に削除する。

## オブジェクトストレージ選択

1. MinIO の右側に RustFS の選択欄とバージョン一覧を表示する。
2. MinIO、RustFS、Azure Blob Storage は同じ業務ストレージ用途を持つため、同時選択を禁止する。一つを選択した場合は他の二つを解除する。
3. RustFS の選択可能バージョンは公式 `dl.rustfs.com` Download Center から取得し、同じ公式 CDN の Windows x86_64 バージョン固定 ZIP を使用する。`latest` ZIP は正式構築に使用しない。
4. RustFS を選択した場合だけ `OneHrStandalone/software/rustfs.zip` を生成する。ZIP は `rustfs/rustfs.exe`、`rustfs/start.bat`、構築器バージョンメタデータを含む。
5. RustFS は同梱版を持たない。Windows 実行試験で API とコンソールを確認した `1.0.0-beta.11` を初期選択とし、RustFS 未選択時はバージョン欄を無効化する。
6. RustFS は既存 MinIO と同じオブジェクトストレージ接続設定を利用する。API ポート、コンソールポート、アクセスキー、シークレットキー、保存先を既存 `MINIO_*` 設定から RustFS 実行環境へ渡す。
7. RustFS は NSSM の `mid-rustfs` サービスとして登録し、`rustfs.exe server` で API とコンソールを起動する。業務サービスには既存 `INFRA_MINIO_*` 接続変数を渡し、S3 クライアント契約を維持する。
8. Windows 版 RustFS は公式資料上、単一ノード単一ディスク用途である。構築成果物も同じ実行形態とする。
9. Azure Blob Storage を選択した場合は、Storage アカウント名、現在使用するアカウント Key、接続文字列、コンテナ名、Blob Host 及び接続先を入力する。接続文字列を省略した場合はアカウント名と Key から標準接続文字列を生成する。Blob Host を省略した場合は `<account>.blob.core.windows.net` を使用する。
10. Azure 接続先は HTTP 又は HTTPS の Origin とする。Private Endpoint の IP を指定する場合も Blob Host を分離して保持し、Nginx の `Host`、`proxy_ssl_server_name` 及び `proxy_ssl_name` へ Blob Host を設定する。
11. Azure の `api-proxy.conf` は `/azure/<path>` を `/<container>/<path>` へ変換し、指定した接続先へ代理する。`api-proxy-debug.conf` にも同じ設定を適用する。
12. 選択したストレージだけの代理 Block を有効化する。MinIO 選択時は `/minio/`、RustFS 選択時は `/rustfs/`、Azure 選択時は `/azure/` を有効化し、未選択 Block は全行を注釈化する。いずれも選択しない場合は三つの Block を注釈化する。
13. Azure のアカウント名、Key、接続文字列、コンテナ名、Blob Host 及び接続先を最終 `OneHrStandalone/bin/kernel/config.ini` へ書き込み、インストール後の実行設定として利用できる状態にする。
14. Azure の Key と接続文字列はタスク専用私密ファイル及び最終交付資材だけに保存する。構築 metadata、設定履歴、実行ログ、公開証拠及び Git には保存しない。

## Nginx と Redis のサービスポート

1. 製品構築画面に Nginx HTTP、Nginx HTTPS、Nginx Dumi Basic、Nginx Dumi Nocode 及び Redis のサービスポートを表示し、全項目を利用者が編集できる状態にする。
2. 既定値は Nginx HTTP `80`、Nginx HTTPS `443`、Dumi Basic `8005`、Dumi Nocode `8006`、Redis `6379` とする。静的生成前 Template の `40443` は正式生成物の既定値として使用しない。
3. 全サービスポートは 1 以上 65535 以下とし、五項目間の重複及び OHR サービスポート `3198` との重複を拒否する。
4. HTTPS を有効にした場合も Nginx HTTP ポートを利用者入力値のまま保持し、同ポートから選択した HTTPS ポートへ Redirect する。HTTPS ポートが `443` 以外の場合は Redirect URL と Portal Origin にポートを明記する。
5. Nginx HTTP と HTTPS の選択値を `ohr-cicd/conf_prod/nginx.conf` 及び `nginx_https.conf` の Listen へ同期する。
6. Dumi Basic と Dumi Nocode の選択値を各 `conf_prod` 配下の `nginx.conf` へ同期する。
7. Nginx HTTP の選択値を `conf_prod/cicd.json` の `hostPort` へ同期し、現在の Scheme と主ポートから `common-settings.conf` の `$ohr_portal_origin` を生成する。
8. Redis の選択値を最終 `OneHrStandalone/bin/kernel/config.ini` の `REDIS_PORT` と `software/redis.zip` の `redis.windows.conf` へ同期する。
9. インストール時は同じ `REDIS_PORT` を Redis サービスの起動引数及び業務 Backend の `INFRA_REDIS_PORT` に渡し、サービス側と呼出側のポートを一致させる。

## 受入条件

1. `8091` にリスナーが存在しない。
2. OneOps Gateway `127.0.0.1:8092` と Nginx `443` の既存入口を維持する。
3. OneOps の「製品構築」メニューから構築器全体を表示できる。
4. 構築器の機関名が共通コンテキストの選択機関名と一致する。
5. 機関名入力欄を手動編集できる。
6. 旧 13 件の成功タスクと既存交付ディレクトリを読み取れる。
7. 構築器、Gateway、フロントエンドの単体試験と本番ビルドが成功する。
8. リリース画面でブラウザ表示、コンソール、スクリーンショットを確認する。
9. OneOps 埋め込み画面に重複する製品ナビゲーションと言語選択を表示しない。
10. 構築内容がワークスペース幅を使用し、二重の縦スクロールを発生させない。
11. 内部 Gateway ポートは `127.0.0.1:8092` に固定し、builder worker 障害で OneOps Gateway または SSO を停止させない。
12. 「構造を開始」で新規タスクを作成でき、CSRF 拒否と `[object Object]` の警告が発生しない。
13. Redis バージョン一覧で `8.10.0`、`8.8.1`、`8.8.0`、`8.6.5` の順序を維持する。
14. 初回表示で Nginx `1.30.2` と Redis `8.8.0` が選択され、「同梱版」へ手動変更できる。
15. MinIO の右側に RustFS のチェックボックスとバージョン一覧を表示し、MinIO と RustFS を同時選択できない。
16. RustFS を選択した実成果物に `rustfs.zip` が含まれ、MinIO を選択していない場合は `minio.zip` が含まれない。
17. RustFS 成果物のインストールスクリプトが `rustfs.zip` を解凍し、`mid-rustfs` サービスを登録し、API とコンソールの起動引数を設定する。
18. RustFS `1.0.0-beta.11` を隔離ポートで起動し、S3 API 健康確認と `/rustfs/console/index.html` が 200 を返す。
19. ビルド端末が停止した状態で製品構築画面が 200 を返し、端末状態が停止中として表示され、起動操作を実行できる。
20. 顧客化の Help 単独構築で SQL テンプレートを使用しない場合も、`製品/1.tenant/ohr_help.sql` と同ディレクトリの `all.sql` が生成される。
21. 標準発版でバックエンド分岐だけを指定した場合は `package.zip` だけ、フロントエンド分岐だけを指定した場合は `web.zip` だけを生成し、`missing build target` を返さない。
22. HTTPS を有効にした構築では証明書と秘密鍵の両ファイルを必須とし、不一致、暗号化鍵、不正 PEM 又は上限超過を受理しない。
23. `wildcard.crt` と `wildcard.key` を選択した場合、画面の WEB 証明書名と WEB Key 名が同じ値へ変化する。
24. HTTPS 構築の `web.zip` に選択した実ファイル名の証明書と Key が存在し、二つの Nginx 設定が同じファイル名を参照する。
25. HTTPS 構築の最終 `OneHrStandalone.zip` 内の `software/web.zip` に同じ証明書資材と設定が保持される。
26. MinIO、RustFS、Azure Blob Storage の選択は相互排他であり、画面操作と API validation の双方で同時選択できない。
27. Azure を選択すると専用入力欄を表示し、必須値を入力するまで構築を開始できない。選択解除後は専用入力欄を非表示にする。
28. Azure を選択した成果物では `api-proxy.conf` と debug 版の Azure Block だけが有効であり、MinIO と RustFS Block は注釈化される。
29. Azure の最終 `config.ini` に入力した非秘密項目と資格情報が存在し、タスク metadata と設定履歴に Key 及び接続文字列が存在しない。
30. 初回画面で Nginx `80`、`443`、`8005`、`8006` 及び Redis `6379` を表示し、各値を変更できる。
31. Nginx の五桁カスタムポートを指定した成果物では、主設定、HTTPS 設定、二つの Dumi 設定、Redirect、Portal Origin 及び `cicd.json` が同じ選択値を使用する。
32. Redis のカスタムポートを指定した成果物では、`config.ini` と `redis.windows.conf` が同じ値を使用し、インストールスクリプトの Redis サービス及び Backend 接続が `config.ini` の値を参照する。
33. 範囲外、公開項目間の重複及び OHR `3198` との重複を構築開始前に拒否する。
