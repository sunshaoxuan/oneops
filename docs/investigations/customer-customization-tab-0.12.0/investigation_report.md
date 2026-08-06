# カスタマイズ情報 Tab 0.12.0 実装・受入記録

更新日: 2026年8月7日

## 目的

顧客情報に、顧客向けの個別カスタマイズ内容を配置する独立した「カスタマイズ情報」Tab を追加する。

## 要求確定

利用者の用語訂正に従い、日本語表示は「顧客別情報」ではなく「カスタマイズ情報」とした。中国語は「客户化信息」、英語は「Customization information」とする。

項目及び入力規則は本タスクで定義されていないため、初期実装は独立 Tab と明示的な空状態までとした。自由形式項目及び任意 JSON 保存は追加していない。

## 実装

1. 顧客情報の基本情報直後に `customization` Tab を追加した。
2. 日中英の Tab 名、説明及び空状態を追加した。
3. 顧客情報を六頁から七頁へ更新した。
4. 将来のカスタマイズ記録は独立物理 ID と組織機関物理 ID 外部キーを使用する要件を追加した。
5. `VERSION`、Change Log、Portal、Spring Backend 及び画面表示を `0.12.0` へ同期した。

## 配信

常駐 Continuous Delivery は 2026年8月7日 08:16:01 JST に対象変更を正常配信した。正式 HTTPS 入口は本 Build と同じ `assets/index-mnao5iAm.js` を参照し、Health API は `UP` と Version `0.12.0` を返した。

手動の追加配信は Nginx 旧 Main Process の Global Reload Event 参照権限不足で失敗し、Script が Index を Rollback した。Rollback 元は既に Continuous Delivery が配信した同じ 0.12.0 Build であり、正式 Asset Hash、Health、Browser 及び Console の再検証で正式配信状態を確認した。

## 結果

正式顧客情報画面には七つの Tab が表示され、二番目の「カスタマイズ情報」を選択できた。説明と未登録空状態が表示され、Desktop と 390px Narrow View の双方で Page 全体の横方向 Overflow は発生しなかった。Browser Console の Error と Warning は 0 件であった。

## 残る境界

カスタマイズ情報の項目、登録 API、編集権限及び CAG 抽出結果との関連付けは未定義であり、本タスクの実装対象外とする。追加時は物理 ID、組織機関外部キー、項目型、履歴及び監査要件を先に確定する。
