# 証拠索引

更新日: 2026-08-05

| ID | 主張 | 証拠 | 確度 | 制限 |
|---|---|---|---|---|
| E-01 | グループは折畳可能な Tab Bar である | `EnvironmentPage.tsx`、`environment-two-panel-collapsed-20260805.png` | 高 | なし |
| E-02 | 主表示は 2 Column である | Browser Layout Metric、通常幅 Screenshot | 高 | Fixture 表示 |
| E-03 | 700 px では 1 Column かつ横 Overflow なし | Browser Layout Metric、`environment-two-panel-narrow-20260805.png` | 高 | Fixture 表示 |
| E-04 | 環境詳細内の VPN Tab は存在しない | Scoped Browser Locator 0 件、Source 試験 | 高 | 親画面 VPN Tab は維持 |
| E-05 | 読取権限ありでは認証情報を直接表示する | `environment-inline-credentials-20260805.png`、Component 試験 | 高 | Screenshot は Fixture 値 |
| E-06 | 読取権限なしでは認証 UI と API Request がない | Browser DOM Count、Fixture Request Log、Component 試験 | 高 | Fixture 表示 |
| E-07 | Console に Warning と Error がない | Browser Console Log | 高 | Fixture 表示 |
| E-08 | Static Asset は正式配信と一致する | Production Build と正式 HTTPS `index.html` の比較 | 高 | SSO 後正式画面は Edge 中継制約あり |
