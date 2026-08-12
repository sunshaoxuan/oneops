# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| Silent Proxy は認証に失敗する | Access Log `401, 401, 400` | 高 | 個人 Header は出力していない |
| OneOps Callback に到達しない | Audit に対応 Failure Event がない | 高 | Browser 前半段階の失敗 |
| Regression は df92515 で導入された | Git Log、Blame | 高 | なし |
| Top-level Direct Navigation は既存成功契約である | AuthPage 旧実装、認証要件 | 高 | Runtime Browser を配信後に確認する |
| Cross-Origin Proxy は削除済み | AuthPage、nginx.conf、運用試験 | 高 | 正式配信後に再確認する |
