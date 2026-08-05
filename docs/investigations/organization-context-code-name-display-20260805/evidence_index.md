# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 候補に Code と正式名称を表示する | `App.tsx`、Browser DOM Snapshot | 高 | Popup は Screenshot 対象外 |
| 選択後も Code と正式名称を表示する | `docs/evidence/organization-context-code-name-selected-20260805.png` | 高 | 隔離 Fixture |
| Code、正式名称及び略称で検索できる | `utils.test.ts`、`layout.test.ts`、Browser Code 検索 | 高 | なし |
| 705 px 幅で横方向溢れがない | `docs/evidence/organization-context-code-name-narrow-20260805.png`、Browser 計測 | 高 | `clientWidth` と `scrollWidth` は 690 |
| Console が正常である | Browser 開発者 Log | 高 | warning 0、error 0 |
| 正式配信中も HTTPS が継続する | 継続的デリバリー Log、55 件の連続監視 | 高 | 100 ms 間隔 |
| 正式 Backend が 0.9.3 である | `/api/work-center/v1/health` | 高 | なし |
