# 証拠索引

| 主張 | 証拠 | 判定 |
| --- | --- | --- |
| 三言語機能名から LOCAL を削除 | `i18n.ts`、`password-labels.test.ts` | 確認済み |
| 関連 Message から LOCAL を削除 | Contract Test | 確認済み |
| 内部表示条件を維持 | `App.tsx` の `identity.provider === "LOCAL"` | 確認済み |
| 要件文書を同期 | `AUTHENTICATION_AND_RBAC_REQUIREMENTS.md` | 確認済み |
| Portal Test、Build | 45 File、256 Test、Production Build | 合格 |
| 熱配信 | `index-Bs6m1OUM.js` を原子的に配信 | 合格、Gateway Restart なし |
| 公開 Bundle | 三言語旧 LOCAL 文言 0 件 | 合格 |
| Browser Console | 正式 HTTPS Login 画面で Error 0、Warning 0 | 合格 |
| 認証後 Menu Screenshot | 隔離 Browser に認証 Session がない | evidence_missing |
