# 調査コマンド

秘密情報を出力しない読み取りコマンドだけを記録する。

```powershell
Invoke-RestMethod http://127.0.0.1:8000/openapi.json
Invoke-RestMethod http://127.0.0.1:8000/api/v1/projects
rg -n "UploadFile|multipart|attachment|conversation_id|task.created|task.started" D:\workspace\cag\backend
rg -n "workspace_path|additional_workspace_roots" D:\workspace\cag\backend
rg -n "ai-assistant|readJsonBody|requiredPermission" D:\nginx\app\gateway
```

実装後の検証コマンドと結果は `test_results.md` へ追記する。
