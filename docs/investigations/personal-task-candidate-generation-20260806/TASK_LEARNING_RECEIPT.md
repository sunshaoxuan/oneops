# TASK_LEARNING_RECEIPT

task_type: external_candidate_filter_generation

reusable_pattern: 外部 Options の物理値、返却分布 Guard、Filter Revision、全件再生成、STALE 照合を一つの候補生成契約として扱う。

failure_or_correction: ログイン ID を外部担当者値へ使用すると検索画面が全件一覧へ退行する。増分 upsert だけでは条件変更前の候補が残る。

candidate_skill: external_candidate_generation_contract

candidate_validator: Options 有効性、状態分布、担当者分布、切捨て、Revision、STALE、ADOPTED 保持を検査する。

install_status: candidate only

evidence_paths: docs/investigations/personal-task-candidate-generation-20260806
