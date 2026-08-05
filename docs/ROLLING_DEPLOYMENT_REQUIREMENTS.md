# ローリング配信要件

更新日: 2026年8月5日

## 1. 目的

OneOps のリアルタイム開発、試験、配信及び公開において、利用者が公開 HTTPS を継続利用できる状態を維持する。

## 2. Backend 切替

1. 正式主系は Spring Boot `127.0.0.1:8092` と内部互換 Gateway `127.0.0.1:8093` とする。
2. 予備系は Spring Boot `127.0.0.1:8094` と内部互換 Gateway `127.0.0.1:8095` とする。
3. 新成果物の予備系 Health が `UP` になるまで Nginx の公開流量を変更しない。
4. Nginx は `conf/oneops-backend-upstream.conf` の原子的更新、設定試験及び平滑 Reload で流量を切り替える。
5. 予備系へ切替後に主系を新成果物で再起動し、主系 Health が `UP` になってから流量を主系へ戻す。
6. 主系の更新に失敗した場合は予備系を終了せず、公開流量を予備系へ維持する。
7. 正常終了時は予備系と内部互換 Gateway の Process を終了し、正式主系だけを残す。

## 3. Portal 切替

1. Hash 付き JavaScript、CSS 及びその他 Asset を先に正式 Web Root へ配置する。
2. Backend を新成果物へ切り替えた後に `index.html.next` を `index.html` へ原子的に移動する。
3. 失敗時に主系が利用可能である場合は旧 `index.html` を復元する。
4. 予備系が公開流量を継続する場合は新 `index.html` を維持する。

## 4. 排他及び監視

配信処理は `Global\OneOpsContinuousDelivery` Mutex を取得する。Runtime Supervisor は同じ Mutex が使用中の場合に復旧処理を見送り、ローリング切替と障害復旧を競合させない。

## 5. 最終受入条件

1. PowerShell Script の構文試験に合格する。
2. 運用 Script 試験が予備系起動、Nginx 切替、主系復帰及び予備系保持契約を確認する。
3. Nginx 設定試験に合格する。
4. 正式配信中に HTTPS Health を連続監視し、失敗応答が 0 件である。
5. 配信後に `8092` が `UP`、`8094` と `8095` が停止している。
6. 正式 Portal と配信成果物の Asset Hash が一致する。
7. 正式 Browser、Console、Layout 及び Screenshot が合格する。
