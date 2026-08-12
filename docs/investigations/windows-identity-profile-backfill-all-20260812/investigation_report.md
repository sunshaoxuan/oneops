# Windows Identity 全利用者档案補完調査

## 目的

特定の管理者に限定せず、Windows Domain 認証が有効な全利用者について Identity Metadata とユーザー管理画面の基本档案を補完する。

## Production 調査結果

Production Database には Windows Identity が 14 件あり、全件が `TOKYO` Domain である。UPN、Username 及び表示名の欠損は 0 件、機械 Account は 0 件だった。Windows Domain と Domain Username は 14 件とも Metadata に未保存で、API が Subject を実行時に分解していた。企業メールは 12 件が未登録である。

既存の EnvPortal 契約は `onehr.jp` の確認済み企業メールだけを移行し、信頼できる企業メールがない場合は空欄を維持する。UPN は Windows 認証主体であり企業メールとは別のため、企業メールへ転用しない。

## 修正

1. Migration 049 で全 Windows Identity の Domain、Domain Username、UPN、表示名及び存在する企業メールを User Physical ID に基づいて保存する。
2. SSO Provision、管理者 Binding 及び EnvPortal Import の将来書込みでも同じ Metadata を保存する。
3. API は持続化済み Metadata を返し、Subject 分解の表示時補完を使用しない。
4. ユーザー管理一覧と編集 Context に Domain、Domain Username、完全 Domain Account、UPN、Username、表示名及び企業メール状態を表示する。

## 安全境界

Password、Token、Hash 及び秘密情報は取得又は出力していない。企業メール、所属及び職責は確認済み情報がない場合に生成しない。Windows Identity は `auth_identities.user_id` で既存 User Physical ID を参照し続ける。
