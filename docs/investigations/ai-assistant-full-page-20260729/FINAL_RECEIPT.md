# 最終確認票

## status

実装、公開、ブラウザー検証完了

## implemented

1. タスクセンターを AI アシスタントへ変更した。
2. AI アシスタント専用画面を追加した。
3. 専用画面では浮動入口を非表示にした。
4. 他画面では浮動入口を維持した。
5. 浮動ウィンドウへ最大化操作を追加した。
6. 単一 Component Instance で表示方式を切り替えた。
7. 権限分配画面へ AI アシスタント実行権限を表示した。
8. 正式 URL を `/ai-assistant` へ変更し、旧 `/tasks` を移行対象にした。

## unchanged

1. CAG コード
2. CAG 8000 プロセス
3. OneOps AI 設定画面
4. Agent Gateway 設定画面

## validation

自動テスト、Production build、公開、nginx、Gateway health、HTTPS、認証後ブラウザー、権限画面、コンソール、スクリーンショットを確認した。
