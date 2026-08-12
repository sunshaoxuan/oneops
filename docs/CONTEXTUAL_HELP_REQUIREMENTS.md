# 画面別オンラインヘルプ要件

更新日: 2026-08-12

## 1. 目的

利用者が業務画面を離れて文書を探すことなく、現在表示中の画面に対応する操作説明を参照できるようにする。ヘッダーの言語選択と通知の間へ画面別ヘルプ入口を配置する。

## 2. 対象画面と文書

| 画面 | Portal Route | ヘルプ文書 |
|---|---|---|
| 問合支援 | `/inquiry-support` | `/help/inquiry-support.html` |
| AI アシスタント | `/ai-assistant` | `/help/ai-assistant.html` |
| 製品構築 | `/product-builder` | `/help/product-builder.html` |
| 基本台帳 | `/master-data` 及び配下 | `/help/basic-master.html` |

## 3. 表示及び遷移契約

1. 対象画面では、ヘッダーの言語選択と通知の間に円形の疑問符アイコンを表示する。
2. アイコンの Tooltip とアクセシブル名称は Portal の選択言語へ合わせる。
3. 操作時は現在の業務画面を保持し、対応文書を新しい Tab で開く。
4. 新しい Tab の Link には `rel="noreferrer"` を指定する。
5. 対象外画面では、対応しない文書へ誤誘導するヘルプ入口を表示しない。
6. 文書は Portal の静的成果物へ同梱し、Portal と同じ配信単位及び同じ Origin で提供する。
7. 目次は項目符号を表示せず、Link の文字基線と項目間隔を揃える。狭幅では一列へ切り替える。

## 4. 操作 Manual の内容

各文書は、現行 Source、要件、Test 及び API Contract で確認できる操作だけを説明する。一般的な機能紹介を本文の中心にせず、利用者が画面を見ながら完了できる Task 単位で構成する。

1. 画面入口、必要権限、Data Source 及び開始前提。
2. 現行画面に表示される Label、Button、Icon、Field 及び初期値。
3. 一操作ずつの入力、選択、実行及び確認手順。
4. 操作後に画面へ表示される Loading、State、Result 及び保存範囲。
5. Field の必須条件、入力上限、相互排他、無効化及び Validation Message。
6. AI、外部 System、Download、削除及び停止操作の実行境界。
7. Error 発生時に利用者が画面上で確認する順序と管理者へ渡す情報。
8. 実装に存在しない操作、未確定機能及び内部 ID を一般利用者向け手順へ追加しない。

## 5. OneHR Design Language

1. 背景は `#f7f8fa`、本文は `#333`、Brand Accent は `#fd6d26` を基準とする。
2. Font は Lato と Noto Sans JP を使用する。
3. Content は白色、8 px Radius、軽い Border と Shadow を使用する。
4. Page Hero、Brand Header、Breadcrumb、Task Navigation、Step Card、Field Table、Callout を共通化する。
5. Desktop は左側 Task Navigation と右側 Manual、狭幅は一列の順序へ切り替える。
6. 情報階層は大見出し、橙色 Eyebrow、十分な余白及び軽量な第 2 階層見出しで示す。
7. Brand Header は OneHR の Logo と OneOps の製品名、HOME と同じ「導入・保守・支援」を表示し、OneOps の同一 Origin HOME へ遷移する。
8. 文書種別は「オンラインマニュアル」と日本語で表示し、`ONLINE MANUAL` 又は OneHR 製品名を OneOps の製品名として表示しない。

## 6. 受入条件

1. 四つの画面からそれぞれ固有の文書が開く。
2. 文書の HTTP Response が成功し、見出し、目次、本文及び更新日が表示される。
3. 元の業務画面は同じ Tab に保持される。
4. Browser Console に本機能起因の Error がない。
5. Desktop 幅と狭幅で本文が読め、横方向の Page Overflow がない。
6. 各文書の詳細操作 Contract Validator が合格する。
7. onehr.jp の現行 Font、背景色、Brand Accent、Card Radius 及び情報階層と一致する。
