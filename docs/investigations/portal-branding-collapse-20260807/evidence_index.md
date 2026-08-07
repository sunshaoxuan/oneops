# 証跡一覧

| ID | 確認対象 | 証跡 | 判定 |
|---|---|---|---|
| E-01 | ブランド条件付き描画 | `app/apps/portal-shell/src/App.tsx` の `Brand` | 合格 |
| E-02 | ブランド主色 | `app/apps/portal-shell/src/styles.css` の `.brand strong` と `.brand small` | 合格 |
| E-03 | 収縮時 OneOps 表示 | `app/apps/portal-shell/src/styles.css` の `.brand-collapsed` 規則 | 合格 |
| E-04 | 自動試験 | `layout.test.ts`、28 件合格 | 合格 |
| E-05 | 全体試験 | Gateway 205 件、Portal 155 件、Builder 14 件 | 合格 |
| E-06 | Production build | Portal production build | 合格 |
| E-07 | 静的公開 | `publish-portal.ps1` の `delivery_succeeded` | 合格 |
| E-08 | 展開状態画面 | `docs/evidence/portal-branding-expanded-20260807.png` | 合格 |
| E-09 | 収縮状態画面 | `docs/evidence/portal-branding-collapsed-20260807.png` | 合格 |
| E-10 | ブラウザーコンソール | 展開、収縮の両状態で warning と error なし | 合格 |
