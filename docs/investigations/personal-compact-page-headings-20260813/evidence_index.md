# 証拠索引

| Claim | Evidence | Confidence | Limitation |
|---|---|---|---|
| 設定は利用者単位で永続化する | Migration 052、IdentityService、Profile API Test、正式 DB の boolean NOT NULL DEFAULT false | 高 | 認証済み実利用者による保存操作は evidence_missing |
| 一つの設定を全大見出しへ適用する | PortalPageHero、PortalPageHeroProvider、6 入口 | 高 | 認証済み実ブラウザーは evidence_missing |
| 面包屑は意味を持つ Navigation である | PortalPageHero の nav、ol、aria-current、DOM Test | 高 | 支援技術固有の読み上げは未確認 |
| 無効時は従来表示を維持する | DB 既定値 false、PortalPageHero DOM Test | 高 | なし |
| 三言語の個人設定を提供する | i18n.ts、ProfileDialog.tsx | 高 | 正式 Browser は Login 画面で停止 |
| 正式配信物は Build と一致する | html/index.html と dist/index.html の SHA256 一致、同一 JS/CSS Hash | 高 | なし |
| 正式 Runtime は稼働する | 8092 Health UP、0.18.22、legacyGatewayReady、nginx -t | 高 | なし |
| Browser Login 前 Console | 正式 Login Page の warning/error 0 件 | 高 | Profile と Page Heading は認証後だけ表示 |
| Screenshot | Page.captureScreenshot | 低 | Timeout のため evidence_missing |
