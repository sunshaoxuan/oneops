# コマンド記録

## OneOps

```powershell
git fetch origin master
node --check gateway/ai-assistant-routing.mjs
node --check gateway/ai-assistant-routes.mjs
node --test gateway/ai-assistant-routing.test.mjs gateway/ai-assistant.test.mjs
node --test gateway/*.test.mjs
git diff --check
```

## CAG

```powershell
git fetch origin master
python -m compileall -q app tests/fixtures/fake_app_server.py
python -m pytest tests/test_codex_app_server_runtime.py tests/test_tasks_api.py -q --no-cov
python -m pytest
git diff --check
```

## 公式資料

```text
https://learn.chatgpt.com/docs/app-server
```
