# 試験結果

## 自動試験

- Gateway: 314 件成功
- Builder: 18 件成功
- Portal: 46 files、270 件成功
- Portal production build: 成功
- Python compile: 成功

## 組合せ試験

| 組合せ | 結果 |
|---|---|
| Backend だけ | validation 成功、`package.zip` だけを交付 |
| Frontend だけ | validation 成功、`web.zip` だけを交付 |
| 両方 | 既存契約を維持 |
| 両方空 | `missing build target` |

## Runtime Browser 試験

| 組合せ | 主控タスク | ビルド端末番号 | 要求値 | 終端状態 | 実交付ファイル |
|---|---|---|---|---|---|
| Frontend だけ | `20260813185018` | `20260813095018` | `build_backend=False`、`build_frontend=True`、`build_web_package=True` | 成功 | `web.zip` だけ、72,643,010 bytes |
| Backend だけ | `20260813190156` | `20260813100156` | `build_backend=True`、`build_frontend=False`、`build_web_package=False` | 成功 | `package.zip` だけ、224,303,048 bytes |

- 配信先は `https://192.168.20.54/product-builder`、OneOps v0.18.22。
- 両方の単独構築で `missing build target` は発生しなかった。
- 構築開始前と両タスク成功後の Browser Console は error 0 件、warning 0 件。
- スクリーンショットは `docs/evidence/frontend-only-standard-release-success-20260813.png` と `docs/evidence/backend-only-standard-release-success-20260813.png`。
