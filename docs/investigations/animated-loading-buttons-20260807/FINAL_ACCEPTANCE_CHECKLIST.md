# 最終受入一覧

| 原要求及び制約 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|
| Appllama 工程を導入する | 独立 workspace package、上流 28 source files、LICENSE、README | upstream file inventory、SHA-256、build | 合格 |
| 必要なアニメーションボタンを選択可能にする | `AnimatedLoadingButton`、25 variant ID、型定義 | metadata 25、unique 25、単体試験 | 合格 |
| 初期性能を保つ | variant dynamic import、图库 lazy import、30fps shared scheduler | production chunk list、frame 動作 | 合格 |
| アクセシビリティを保つ | 業務ラベル、`aria-busy`、disabled、reduced motion | 単体試験、Browser DOM | 合格 |
| 実画面で確認できる | `/ui/loader-buttons` | desktop、mobile、Console、三枚の screenshot | 合格 |
| ライセンスと更新境界を明示する | GPL、`UPSTREAM.md`、要件文書 | 文書実体 | 合格 |
| 既存業務契約を変更しない | UI package と图库に限定 | diff scope | 合格 |
| 既存の並行変更を保持する | task path のみを配信対象にする | staged scope と最終 Git 確認 | 検証待ち |
| 正式配信と remote 一致 | `origin/master` への commit と Portal publish | commit、remote equality、HTTPS | 検証待ち |

全項目が合格するまで完了報告を行わない。Git 配信後に一覧の先頭から再確認し、最終判定を更新する。
