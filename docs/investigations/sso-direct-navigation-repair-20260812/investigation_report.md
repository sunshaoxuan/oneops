# Windows SSO 直接 Navigation 修復

## 原因

Commit `df92515` は Windows SSO を Browser Top-level Navigation から同一 Origin Hidden iframe `/sso/windows/silent` へ変更し、nginx で `OHR0067:8998` へ Reverse Proxy した。Windows Integrated Authentication は Origin、SPN 及び Connection Context に依存するため、`192.168.20.54` への Browser 認証を `OHR0067` へ単純転送できない。

Production Access Log は Silent Route が `401, 401, 400` となり、EnvPortal Callback と OneOps Failure Audit が発生しないことを示した。Direct Upstream と Silent Route は `WWW-Authenticate: Negotiate, NTLM` を返した。

## 修復

1. 初回自動 SSO を `window.location.replace` で EnvPortal SSO URL へ直接遷移する。
2. 手動 SSO Button を `window.location.assign` で同じ URL へ直接遷移する。
3. Hidden iframe、Session Poll、5 秒 Timer 及び nginx Silent Proxy を削除する。
4. Session Storage の一回試行 Marker を維持し、OneOps へ戻った後の自動 Loop を防ぐ。
5. LOCAL Login と手動 SSO Button を維持する。

## 安全境界

Token、Cookie、Password、Shared Secret を取得又は出力していない。EnvPortal 短期 Token の POST Callback 契約と OneOps Session 発行契約は変更していない。
