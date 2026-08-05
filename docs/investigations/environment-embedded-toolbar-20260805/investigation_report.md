# サーバー詳細情報の軽量 Toolbar 化 調査記録

更新日: 2026-08-05

## 目的

顧客情報配下のサーバー詳細情報を子機能として扱い、独立画面向けの大見出し、説明、顧客表示及び大型集計カードを取り除く。「環境を追加」は画面右側に維持する。

## 実装結果

`EnvironmentPage` の大見出し領域を軽量 Toolbar に置き換えた。有効環境、本番、検証、社内及びアーカイブは既存の `viewFilter` を使用する小型 Filter として維持した。「環境を追加」は既存の権限判定、環境グループ存在判定及び編集画面起動処理を維持し、Toolbar 右側へ配置した。

幅 705 px 以下では Filter と追加操作を縦方向へ配置し、追加操作を全幅表示する。

## 確認結果

| 確認事項 | 証拠 | 状態 |
|---|---|---|
| 大見出しと大型集計カードの削除 | `EnvironmentPage.tsx`、`styles.css`、静的試験 | 合格 |
| 5 種類の絞込機能の維持 | `EnvironmentPage.tsx`、Portal 試験 141 件 | 合格 |
| 「環境を追加」の右側配置 | `styles.css`、静的試験 | 合格 |
| Production Build | 3405 modules、`index-oTjgBeAa.js`、`index-Zc99fetr.css` | 合格 |
| 正式静的配信との一致 | 正式 `index.html` と Production Build の Asset 名及び内容一致 | 合格 |
| 実ブラウザ表示、Console、Screenshot | 同一 Production Build Fixture、Console 0 件、Screenshot | 合格 |
| Backend 0.9.4 Rolling 配信 | 522 Sample、HTTP 失敗 0 件、Health 0.9.4 | 合格 |

## 制限事項

内蔵 Browser は本機 LAN へ接続できなかった。後から接続可能になった Edge では正式 HTTPS へ到達できたが、正式 SSO 中継が `ERR_BLOCKED_BY_CLIENT` となった。認証後 UI は正式配信と同一 Production Build の隔離 Fixture で検証し、正式 Static Asset 一致及び Runtime Health を別途確認した。

追加要求を含む最終結果は `docs/investigations/environment-two-panel-credential-inline-20260805/investigation_report.md` に記録した。
