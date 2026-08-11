# 実行記録

1. `git fetch origin master`
2. `rg` による Streaming Loader、Markdown、Grid、Overflow の追跡
3. 正式 Browser で Root、会話領域、Message、Loader、Copy の幅を計測
4. 長文回答を実行し Streaming と Completed を計測
5. Portal Test と Production Build
6. Gateway Test、Worker Test、Backend Test、運用 Script Test
7. 0.18.17 配信後の Browser、Console、Screenshot、Health、Asset Hash 検証
8. `Get-Content D:\nginx\app\logs\continuous-delivery.log -Tail 20`
9. `Get-NetTCPConnection -State Listen` による 8092 と 8094 の確認
10. `D:\nginx\nginx.exe -t -p D:\nginx`
11. `Invoke-RestMethod https://192.168.20.54/api/work-center/v1/health`
12. `Get-FileHash -Algorithm SHA256` による Build と `D:\nginx\html` の配信 Asset 比較

## Browser 復旧記録

1. 正式ページを新しい内蔵 Browser Tab で再読込した。
2. Windows SSO の自動確認後に Login Page が表示された。
3. Windows Account 認証を実行すると認証代理遷移時に制御対象が閉じた。
4. 再作成した Tab は未認証へ戻るため、Streaming Screenshot と完了後 Screenshot を取得できなかった。
