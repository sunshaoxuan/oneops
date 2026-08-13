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

Runtime Browser と Console の結果は正式配信後に追記する。
