# Test 結果

作成日: 2026年8月7日

## 実装中の対象 Test

| 対象 | 結果 |
|---|---|
| Portal | 18 Files、157 Tests 合格 |
| Gateway 対象 Test | 27 Tests 合格 |
| Production Build | 合格 |

## 完全 Test

| 対象 | 結果 |
|---|---|
| Gateway | 206 Tests 合格 |
| Builder | 14 Tests 合格 |
| Portal | 18 Files、157 Tests 合格 |
| Spring Backend | 33 Tests 合格、条件付き DB Test 7 件 Skip |
| Operations Script | 9 Checks 合格 |
| Production Build | 合格 |
| `git diff --check` | 合格 |

## Browser

| 項目 | 結果 |
|---|---|
| `/customers` の Scan 非表示 | 合格 |
| 管理者画面の Scan 表示 | 合格 |
| 組織機関 Code 順 | `0001`、`0008` の順序を確認 |
| Desktop 横幅 | `clientWidth 1912`、`scrollWidth 1912` |
| 390px 横幅 | `clientWidth 375`、`scrollWidth 375` |
| Console | Warning 0、Error 0 |

正式配信結果は `FINAL_RECEIPT.md` に記録する。
