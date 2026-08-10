# タスク学習受領記録

task_type: 専門 AI アシスタントの調査、設計、実装、検証

reusable_pattern: Session 作成時に目的別助手の物理 ID と継続指示スナップショットを保存し、各 Task へサーバー側で挿入する。利用者向け概要と管理者向け完全設定を API で分離する。

failure_or_correction: Animation を停止しても分割軌道の Border を基礎状態へ残すと、中間 Frame のような半円が静止表示される。静止状態は完成形の完全な円形輪郭を定義し、操作状態だけ分割軌道へ切り替える。

candidate_skill: `D:/workspace/codex-selfimp/outputs/ai-assistant-shortcuts-20260810/CANDIDATE_PERSISTENT_ASSISTANT_PATTERN.md`

candidate_validator: 静止時の全 Border 色一致、Animation `none`、Hover 時だけ分割 Border と Animation `running`、ポインター離脱後の復帰を検査する Validator 候補

install_status: candidate のみ。正式 skill、validator、AGENTS.md へ未導入。

evidence_paths: `docs/investigations/ai-assistant-shortcuts-20260810`、`browser-static-complete-ring-0.18.5.jpg`、`browser-hover-orbit-0.18.5.jpg`
