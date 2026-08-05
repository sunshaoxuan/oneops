# Portal 機能アイコン補充調査記録

## 目的

参考画面の視覚言語を Portal の主要画面と管理区画へ適用した後、先頭アイコンが表示されていない見出しを調査し、業務内容に対応する機能アイコンを補充する。

## 実装経路

1. React のページ見出しが `portal-page-hero-icon` 又は `portal-section-heading-icon` を出力する。
2. Ant Design Icons の業務意味に対応するコンポーネントを各ページで選択する。
3. `styles.css` が表示領域、色、背景、枠線、角丸及び窄屏時の配置を共通化する。
4. Portal の単体試験が各見出し種別と CSS クラスの存在を確認する。
5. 本番ビルドと静的公開後、実ページの DOM、表示寸法、横幅及びコンソールを確認する。

## 対応表

| 画面又は区画 | アイコン | クラス | 確認結果 |
|---|---|---|---|
| 顧客情報 | `SolutionOutlined` | `portal-page-hero-icon` | 62×62px、合格 |
| 個人タスク | `CheckSquareOutlined` | `portal-page-hero-icon` | 62×62px、合格 |
| 基本台帳の組織機関 | `TeamOutlined` | `portal-section-heading-icon` | 48×48px、合格 |
| 基本台帳の組織区分 | `AppstoreOutlined` | `portal-section-heading-icon` | 48×48px、合格 |
| 基本台帳の製品・版数 | `DatabaseOutlined` | `portal-section-heading-icon` | 48×48px、合格 |
| モデル接続 | `ApiOutlined` | `portal-section-heading-icon` | 48×48px、合格 |
| エージェント連携 | `CloudServerOutlined` | `portal-section-heading-icon` | 48×48px、合格 |
| 外部タスク設定 | `SafetyCertificateOutlined` | `portal-section-heading-icon` | 48×48px、合格 |
| 業務部門・職責 | `TeamOutlined` | `portal-section-heading-icon` | 48×48px、合格 |
| 問合検索テンプレート | `SearchOutlined` | `portal-section-heading-icon` | 48×48px、合格 |

## 既知の制約

640px の顧客情報ページではタブ列がコンポーネント内部で横スクロール可能になる。ページ全体の `body.clientWidth` と `body.scrollWidth` は一致し、画面外へページ全体の横スクロールを発生させない。見出しの装飾円は `overflow: hidden` で表示領域内へ切り取る。
