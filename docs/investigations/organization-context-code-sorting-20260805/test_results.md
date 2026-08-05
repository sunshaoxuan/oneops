# 試験結果

更新日: 2026-08-05

## 自動試験

| 項目 | 結果 |
|---|---|
| Gateway 及び規則試験 | 177 件成功 |
| Portal Shell 試験 | 18 File、150 件成功 |
| TypeScript Build | 成功 |
| Vite Production Build | 成功 |

## 順序確認

入力順 `ONEHR, 0220, 0452, 0280, 0288, 0284` に対し、比較結果は `0220, 0280, 0284, 0288, 0452, ONEHR` となった。

## 配信確認

Nginx 設定検査は成功した。`https://192.168.20.54/` は HTTP 200 を返し、新しい JavaScript `index-CqoDFb4-.js` と CSS `index-5g9VJImV.css` を参照した。

## ブラウザー確認

正式画面で機関 Code の昇順、降順、再読込後の順序保持を確認した。最終状態は機関 Code 昇順で、先頭は `0001, 0008, 0076, 0078, 0100` である。Screenshot は `../organization-inquiry-customer-sync-20260805/organization_directory_final.jpg` に保存した。Browser Console の履歴取得は制御インターフェースの制約により未完了である。
