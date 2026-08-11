# 最終受入記録

## 状態

未完了。正式受入の Browser 項目が未合格である。

## 確定済み

1. 根因を会話領域の横 Overflow、Grid と Flex の縮小境界、Streaming Loader の折返し境界へ特定した。
2. 修正、要件文書、Test、Version 0.18.17 を Commit `9c67956` として `origin/master` へ反映した。
3. 全関連 Test と Production Build が合格した。
4. 継続配信、HTTPS Health、nginx、8092 単独待受、Build と配信 Asset の一致を確認した。

## 未合格

1. 正式 Browser の長文 Streaming 中 Screenshot。
2. 同一回答の完了後 Screenshot。
3. 上記操作中の Console Error と Warning が零であることの証拠。

内蔵 Browser は Windows SSO 認証代理へ遷移した時点で制御対象を閉じた。再作成 Tab は未認証状態へ戻ったため、上記証拠を取得できなかった。

## Release Gate

`v0.18.17` Tag は作成しない。認証済み Browser Session を取得後、`FINAL_ACCEPTANCE_CHECKLIST.md` の先頭から全項目を再実行する。
