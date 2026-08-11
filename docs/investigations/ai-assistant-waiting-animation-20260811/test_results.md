# 試験結果

| 対象 | 結果 | 備考 |
| --- | --- | --- |
| Portal 全量 | 205 passed | 32 Test Files、Reduced Motion 回帰を含む |
| Portal Production Build | passed | 指紋化 JS と CSS を生成 |
| Spring Backend | 40 tests、8 skipped | Build Success |
| Project Language、Version | 5 passed | README を含む公開 Version 一致 |
| `git diff --check` | passed | 空白 Error なし |
| OneOps Runtime | passed | 0.18.11、Health `UP`、継続配信成功 |
| Browser Animation | passed | Reduced Motion、Opacity `0.56` から `0.649456`、Filter 変化 |
| Browser Screenshot | passed | `docs/evidence/ai-assistant-waiting-orbit-20260811.png` |
| Browser Console | passed | Error 0、Warning 0 |

正式機能受入は全項目合格した。正式 Tag は並行作業の未 Commit Runtime Asset と Repository Artifact が一致するまで保留する。
