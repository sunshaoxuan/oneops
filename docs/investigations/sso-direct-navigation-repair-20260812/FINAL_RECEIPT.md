# 最終受入記録

| 原要求 | 成果物 | 証拠 | 判定 |
|---|---|---|---|
| Windows SSO Login の Browser 契約を復旧する | EnvPortal Host への Top-level Direct Navigation | UI 試験、Production Asset、Auth Config | 合格 |
| 実 Domain User で SSO Login を完了する | EnvPortal Callback、OneOps Session | Domain 認証可能 Browser が接続されていない | `evidence_missing` |
| Silent Proxy Regression を削除する | AuthPage、nginx.conf | Production Asset、Formal Config、Operations Test、配信後 Access Log 0 件 | 合格 |
| 自動 Login Loop を防ぐ | Session Storage Marker | UI 試験 | 合格 |
| LOCAL Login と手動 SSO を維持する | Login Page | UI 試験、Browser DOM、Console 0、Screenshot | 合格 |
| Production へ配信する | Static Asset、nginx Config | `delivery_succeeded`、HTTPS 200、Health UP 0.18.20 | 合格 |

実 Domain User の認証成立を除く全項目は合格した。Application 内 Browser は Windows Integrated Authentication の Domain Credential を提供できず、System Chrome も未接続であるため、`WINDOWS_SSO_SUCCEEDED` と Callback の実証は `evidence_missing` とする。
