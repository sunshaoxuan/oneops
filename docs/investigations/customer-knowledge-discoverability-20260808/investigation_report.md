# 顧客情報 CAG 分析の発見性改善 調査記録

更新日: 2026-08-08
対象: OneOps 0.16.0 Portal、権限マトリクス及び CAG 顧客台帳抽出入口

## 目的

顧客情報から移動した CAG 顧客台帳分析の入口を利用者が特定できる状態にし、権限マトリクスの表示と実際のメニュー階層を一致させる。顧客情報ページへスキャン操作を戻さず、管理権限の境界を維持する。

## 実装内容

1. システム管理の CAG 入口をグループ配下の二重メニューから単一の「顧客情報 CAG 分析」項目へ変更した。
2. 顧客情報ページの Hero に、`customer.knowledge.manage` を持つ利用者だけが表示できる管理入口ボタンを追加した。選択中の組織機関物理 ID を管理画面へ渡し、対象を同じ組織機関から開始する。
3. 顧客情報 CAG 分析ページとスキャンパネルの見出しを、顧客台帳候補の抽出用途が分かる表現へ統一した。
4. 権限マトリクスの資源名を実際の入口である「システム管理 > 顧客情報 CAG 分析」へ変更した。説明文にも入口を明記した。
5. 現行契約で使用しない `customer.knowledge.scan` と `customer.knowledge.review` を権限マトリクスから除外し、ロール編集時の読み込み及び保存でも除外した。既存の有効操作は `customer.knowledge.manage` とする。

## 維持した境界

顧客情報ページにはスキャン、再取込、再分析、候補反映及び候補却下の操作を配置していない。入口案内は管理権限を持つ利用者だけへ表示し、API の `customer.knowledge.manage` 判定は変更していない。

## 実行環境確認

`publish-portal.ps1 -Reason customer-knowledge-discoverability-20260808 -SkipGatewayRestart` が `delivery_succeeded` で完了した。公開 URL は HTTPS 200、Gateway health は `UP`、Backend version は `0.16.0` である。公開中 JavaScript に新しい三言語メニュー表示、管理入口ボタン、旧メニューグループ除去及び `initialOrganizationId` を確認した。

Browser で公開 URL を開いたが、「Windows ドメイン認証を確認しています。」から進まなかった。認証済みのメニュー、管理入口クリック、選択組織機関の画面表示、Console 及びスクリーンショットは `evidence_missing` と記録する。資格情報の送信は行っていない。
