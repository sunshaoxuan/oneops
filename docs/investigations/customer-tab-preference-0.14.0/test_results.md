# Test 結果

作成日: 2026年8月7日

## 自動 Test

| 対象 | 結果 |
|---|---|
| Portal Unit Test | 18 Files、157 Tests 合格 |
| Portal Production Build | 合格 |
| Gateway Test | 合格 |
| Builder Test | 合格 |
| Spring Backend | 33 Tests 合格、条件付き DB Test 7 件 Skip |
| Operations Script | 9 Checks 合格 |
| `git diff --check` | 合格 |

## Browser Test

| 項目 | 結果 |
|---|---|
| 正式 URL | 合格 |
| Tab 順序変更 | 合格 |
| Tab 非表示 | 合格 |
| 再読込後の復元 | 合格 |
| 選択中 Tab の非表示後切替 | 合格 |
| 最低一つの表示保護 | 合格 |
| 既定復元 | 合格 |
| Desktop 横幅 | `clientWidth 1912`、`scrollWidth 1912` |
| 390px 横幅 | `clientWidth 390`、`scrollWidth 390` |
| Console | Warning 0、Error 0 |

最終 Test の再実行結果は `FINAL_RECEIPT.md` に反映する。
