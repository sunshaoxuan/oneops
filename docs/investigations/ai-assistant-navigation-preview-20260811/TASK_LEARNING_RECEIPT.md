# Task Learning Receipt

## task_type

Hover Preview、Portal 座標、会話 Navigation、Keyboard Focus の正式 Browser 調査と修正。

## reusable_pattern

Portal Tooltip の DOM 内容だけで表示成功を判定せず、Popup Rectangle、Viewport 内包、Root Scroll 寸法、Focus 維持及び Click 後状態を同時に検証する。

## failure_or_correction

`position: fixed` を Tooltip Root へ追加すると、配置処理が初期退避座標から復帰せず内容が画面外へ残る場合がある。Hover と Focus に同じ State を使うと Pointer 離脱又は Active 更新で Focus Preview を消すため、入力方式別 State を分離する。

## candidate_skill

`D:\workspace\codex-selfimp\2026-08-11-oneops-navigation-preview\PORTAL_PREVIEW_VALIDATOR_CANDIDATE.md`

## candidate_validator

Popup Rectangle、Viewport、Root Scroll、Hover、Focus、Click Target 及び Console を検証する UI Validator。

## install_status

Candidate のみ。正式 Skill 又は Validator へ未導入。

## evidence_paths

1. `docs/investigations/ai-assistant-navigation-preview-20260811/investigation_report.md`
2. `docs/investigations/ai-assistant-navigation-preview-20260811/test_results.md`
3. `docs/evidence/ai-assistant-navigation-preview-0.18.19.png`
