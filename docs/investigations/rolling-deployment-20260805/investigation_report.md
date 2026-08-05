# OneOps ローリング配信 調査及び実装記録

## 1. 当初目的

リアルタイム配信中も利用者が OneOps を継続利用できるようにする。

## 2. 変更前の状態

`publish-portal.ps1` は Portal の原子配信後に主系 Windows Task を停止し、`8092` の解放を 5 秒確認してから再起動していた。この区間では Nginx の API 転送先に稼働 Backend が存在しない。

## 3. 実装

1. `start-oneops-backend.ps1` へ Gateway と内部互換 Gateway の Port 引数を追加した。
2. Nginx の Backend 転送先を独立 Include へ移した。
3. `publish-portal.ps1` へ予備系起動、Health、Nginx 平滑切替、主系更新、主系復帰、予備系終了を追加した。
4. 主系復帰失敗時は予備系を維持する。
5. Portal Asset と `index.html` の公開順序を Backend 互換性に合わせた。

## 4. 検証状態

運用 Script、Maven Rolling Profile、Nginx 設定、正式ローリング配信及び HTTPS 連続監視が合格した。

最初の手動実行は、SYSTEM が起動した Nginx の Reload Event へ現在の対話 Process がアクセスできず切替前に終了した。この間の HTTPS 132 件はすべて HTTP 200 であり、正式流量は主系に維持された。

高権限の継続的デリバリー Task から再実行し、予備系、Nginx、主系及び Portal の切替に成功した。成功配信の HTTPS 174 件と Queue 収口中の 1301 件はすべて HTTP 200 であった。

Maven は Windows で稼働中の主系 JAR を上書きできないため、`rolling` Profile で分類 JAR を作成する。予備系は分類 JARを使用し、主系停止後に正式 JAR を原子的に交換する。
