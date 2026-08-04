# Spring Boot SSO 設定契約復旧調査

## 1. 結論

Spring Boot 移行時に、既存の `OPS_ENVPORTAL_SSO_URL` ではなく未設定の `OPS_SSO_WINDOWS_SSO_URL` を参照したため、認証設定 API が SSO 有効状態と空の遷移先を同時に返していました。Portal は SSO ボタンを表示しましたが、空の URL を検出して処理を終了するため、利用者は Windows ドメイン認証へ移動できませんでした。

## 2. 修正内容

1. Spring Boot は `OPS_ENVPORTAL_SSO_URL` と `OPS_ENVPORTAL_PROFILE_URL` の両方が設定済みの場合だけ EnvPortal SSO を有効化します。
2. `OPS_WINDOWS_SSO_PROXY_URL` と `OPS_SSO_SHARED_SECRET` による署名代理方式も既存契約として維持します。
3. 自動ログインは、SSO 入口が有効であり、かつ `OPS_SSO_AUTO_LOGIN=true` の場合だけ有効化します。
4. Runtime Supervisor は EnvPortal SSO URL、プロファイル検証 URL、自動ログイン設定を一括して復旧します。
5. 版数を `0.8.7` へ更新しました。

## 3. 実行結果

正式環境の認証設定 API は次の状態へ復旧しました。

```json
{"windowsSsoEnabled":true,"windowsSsoAutoLogin":true,"windowsSsoUrl":"http://OHR0067:8998/oneops_sso.jsp"}
```

Spring Boot health は `UP`、版数は `0.8.7` です。Gateway、HTTPS、Runtime Supervisor は稼働中です。

## 4. 制約

自動化ブラウザーは HTTP の Windows 統合認証入口をクライアント側で遮断するため、実ドメイン資格情報による最終回帰は通常の Windows Edge で確認します。未認証ブラウザーでは OneOps の自動 SSO 待機画面まで、既存認証済み Edge では `0.8.7` の業務画面とエラーのないコンソールを確認しました。
