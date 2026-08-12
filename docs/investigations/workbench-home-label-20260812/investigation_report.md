# HOME 表示名変更記録

## 要求

第 1 階層ナビゲーションの Workbench 表示名を HOME 系名称へ変更します。

## 表示契約

| 言語 | 表示名 |
| --- | --- |
| 日本語 | ホーム |
| 中国語 | 首页 |
| 英語 | HOME |

内部 Navigation Key `workbench`、URL `/`、Permission `dashboard.read`、Dashboard API 及び Component 名は技術契約として維持します。

## 変更範囲

1. `i18n.ts` の三言語表示名を変更しました。
2. `PROJECT_RULES.md` の第 1 階層ナビゲーション名称を更新しました。
3. `home-labels.test.ts` で三言語表示契約を固定しました。
4. ロール権限画面の利用者向け機能名も同じ三言語名称へ統一しました。
