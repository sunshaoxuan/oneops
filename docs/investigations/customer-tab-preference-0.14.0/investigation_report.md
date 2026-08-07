# 顧客情報 Tab 個人設定 調査報告

作成日: 2026年8月7日

## 目的

顧客情報画面の Tab Bar 右端に個人設定入口を設置し、現在の利用者が Tab の表示順と表示状態を変更できるようにする。

## 実装結果

利用者物理 ID を含む Browser Storage Key を用いて、同じ Browser 内で利用者別に設定を保存する。設定画面では七つの Tab を上移動及び下移動でき、任意の Tab を非表示にできる。最低一つの表示 Tab を維持し、選択中 Tab を非表示にした場合は先頭の表示 Tab へ切り替える。

新しい Tab が追加された場合は保存済み設定の末尾へ表示状態で追加する。未知の Key と重複 Key は正規化時に除外する。

## 検証結果

| 確認事項 | 結果 | 証拠 |
|---|---|---|
| 歯車 Icon の配置 | 合格 | `docs/evidence/customer-tab-preference-0.14.0.png` |
| 順序変更と非表示 | 合格 | Browser 操作、`customer-information.test.ts` |
| 再読込後の復元 | 合格 | Browser 操作 |
| 選択中 Tab の自動切替 | 合格 | Browser 操作 |
| 最低一つの表示保護 | 合格 | Browser 操作、`customer-information.test.ts` |
| 既定復元 | 合格 | Browser 操作 |
| 390px Narrow View | 合格 | `docs/evidence/customer-tab-preference-0.14.0-narrow.png` |
| 水平 Overflow | 合格 | Desktop `1912 = 1912`、Narrow `390 = 390` |
| Console | 合格 | Warning 0、Error 0 |
| 正式 Version | 合格 | 画面 `v0.14.0`、Health `0.14.0` |

## 制約

現行設定は同じ Browser 内で利用者別に保存する。複数端末間の同期は Server 側個人設定 API の別要件とする。
