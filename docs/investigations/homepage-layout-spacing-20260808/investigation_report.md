# ホーム画面の Hero と個人タスク概要の間隔調査記録

更新日: 2026-08-08
対象: OneOps 0.16.0 Portal Workbench

## 目的

ホーム画面の Hero 区域と個人タスク概要カードが接近して見える原因を特定し、画面全体のレイアウトを変えずに、隣接するカード区域と整合する垂直間隔を設定する。

## 調査結果

`app/apps/portal-shell/src/App.tsx` の Workbench は `hero-panel` の直後に `personal-task-summary workbench-personal-task-summary` を描画している。`app/apps/portal-shell/src/styles.css` の専用ルールには `margin-top: 0` が設定されていたため、Hero の直後に個人タスク概要が配置されていた。

専用ルールの `margin-top` を `18px` に変更した。既存のカード区域で使用している間隔と揃え、Hero の内部余白、カードの幅、レスポンシブ列数には変更を加えていない。

## 変更内容

| 対象 | 変更 | 確認方法 |
| --- | --- | --- |
| `styles.css` | `.workbench-personal-task-summary` の上辺余白を `18px` に設定 | スタイルの静的検査、Portal テスト |
| `workbench-spacing.test.ts` | Hero と個人タスク概要のクラス構造及び `18px` を検証 | Vitest |

## 実行環境の確認

公開済み URL `https://192.168.20.54/` を Browser で開いた。ページは「Windows ドメイン認証を確認しています。」の状態で停止し、認証済みの Workbench DOM は取得できなかった。自動入力された資格情報の送信は行っていない。このため、実行環境における実測ピクセル値、Browser Console、変更後スクリーンショットは `evidence_missing` とする。

同じ公開 URL の HTML と CSS は読み取り確認でき、配信中の `/assets/index-cx8Vq2Yu.css` に `.workbench-personal-task-summary{margin-top:18px}` が含まれることを確認した。これにより静的配信物への反映は確認できる。

## 結論

接近の直接原因は専用上辺余白が `0` だったことである。コード変更、Portal テスト、全体チェック、ビルド及び公開スクリプトの成功を確認した。認証後の Browser 画面証拠だけが未取得である。
