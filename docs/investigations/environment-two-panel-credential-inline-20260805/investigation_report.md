# 環境 2 Column と認証情報直接表示 調査記録

更新日: 2026-08-05

## 目的

サーバー詳細情報の左、中、右 3 Column を整理し、環境グループが実内容の表示幅を占有しない構成へ変更する。VPN 情報の重複を解消し、権限に応じて認証情報を接続先行へ直接表示する。

## 実装

環境グループは独立した左 Column から折畳可能な Tab Bar へ変更した。折畳時は選択中グループと件数だけを表示し、展開時は全グループを横方向の Tab として表示する。グループ追加、並替、編集及び空グループの Archive は維持した。

主表示は環境一覧と環境詳細の 2 Column に変更した。幅 991 px 以下では 1 Column に切り替える。

環境詳細から VPN Tab を削除した。VPN 情報は親画面のネットワーク環境直下にある専用 Tab だけで表示する。

`environments.credentials.read` を持つ利用者には、接続先の認証情報を追加 Modal なしで接続先行へ表示する。Password は同じ行内の Password Input で Mask し、利用者が必要な時に表示できる。`environments.credentials.write` を併せて持つ場合は同じ行内で編集する。読取権限がない場合は登録状態、値、操作及び認証情報取得 Request を生成しない。

## Browser 検証

正式 HTTPS の Static Asset と同一の Production Build を、隔離 API Fixture で表示した。正式画面の SSO 中継は Edge で `ERR_BLOCKED_BY_CLIENT` となるため、認証後 UI の検証には Fixture を使用した。

通常幅 1912 px では環境一覧 567 px、環境詳細 1008 px の 2 Column となり、折畳状態のグループ Bar は高さ 60 px だった。700 px 幅では 1 Column となり、横方向 Overflow は発生しなかった。

認証情報読取権限ありでは 2 件の接続先行に認証情報が直接表示された。読取権限なしでは認証表示 0 件、認証状態 0 件、認証操作 0 件であり、Fixture Request Log に認証情報取得 API は記録されなかった。

Console Warning 及び Error は 0 件だった。

## Rolling 配信

0.9.4 の完全 Rolling 配信は 2026-08-05 15:04:13 から 15:04:56 まで実行し、成功した。配信中の正式 HTTPS を 100 ms 間隔で監視し、522 Sample 全てが HTTP 200 だった。実測最大 Sample 間隔は 254 ms だった。

配信後は Spring Backend 0.9.4 が 127.0.0.1:8092、Gateway が 127.0.0.1:8093 で Listen している。8094 と 8095 は停止し、Nginx Upstream は 8092 へ戻った。正式 HTTPS Health は `UP`、Static Asset は Production Build と一致し、Rolling、Rollback 及び Next の一時 Artifact は残っていない。
