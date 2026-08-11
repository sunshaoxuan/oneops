# Task Learning Receipt

## task_type

Streaming UI の横幅 Overflow 調査、修正、正式 Browser 受入。

## reusable_pattern

Grid と Flex を跨ぐ Streaming Component は、外側の Scroll Container から Text Copy まで各階層の `scrollWidth`、`clientWidth`、`min-width`、`max-width`、`overflow-x` を同時に計測する。

## failure_or_correction

完成後 Markdown の計測だけでは Streaming 専用 Loader の一時的な超幅を検出できない。認証遷移で Browser 制御対象が失効する場合は Screenshot を推測で補完せず、Release Gate を未合格に保つ。

## candidate_skill

`D:\workspace\codex-selfimp\2026-08-11-oneops-ai-streaming-width\STREAMING_WIDTH_VALIDATOR_CANDIDATE.md`

## candidate_validator

会話 Container、Message Grid、Turn、Message、Loader、Copy の幅一致と横 Overflow 計算値を Streaming 中及び完了後に収集する Browser Validator。

## install_status

Candidate のみ。正式 Skill 又は Validator へ未導入。

## evidence_paths

1. `docs/investigations/ai-assistant-streaming-overflow-20260811/investigation_report.md`
2. `docs/investigations/ai-assistant-streaming-overflow-20260811/test_results.md`
3. `docs/investigations/ai-assistant-streaming-overflow-20260811/FINAL_ACCEPTANCE_CHECKLIST.md`
