# 前後端単独構築の調査と修正

## 結論

標準発版の OneOps 宿主検証がバックエンド分岐とフロントエンド分岐の両方を必須としていたため、片方だけを指定すると `missing build target` を返していた。リモート build-console は `build_backend` と `build_web_package` を独立して処理できる。

OneOps の検証と成果物収集を独立対象契約へ統一した。

## 現行契約

| バックエンド | フロントエンド | 結果 |
|---|---|---|
| 指定 | 空 | `package.zip` だけを構築、交付 |
| 空 | 指定 | `web.zip` だけを構築、交付 |
| 指定 | 指定 | 二つの ZIP を構築、交付 |
| 空 | 空 | `missing build target` |

Help は Web 資材の独立対象として扱う。Help SQL の外部出力には `web.zip` が必要である。

## 原始構築器との境界

`D:\workspace\droneci\build-console\server.py` は既に `build_backend`、`build_frontend`、`build_web_package` を独立処理する。変更は OneOps の宿主検証と標準発版成果物収集に限定し、リモート構築器と原始打包器を変更していない。
