# TASK_LEARNING_RECEIPT

task_type: external_search_candidate_investigation

reusable_pattern: 外部 Select 条件は表示名、ログイン ID、自由入力値を送信せず、外部 Options の物理値を保存前と実行前に検証する。返却結果の状態分布と担当者分布を要求条件と照合する。

failure_or_correction: 無効な担当者値が外部検索の全件一覧退行を起こし、Parser が正常結果として 500 件を保存した。条件変更後の upsert は旧 PENDING を失効させない。

candidate_skill: external_form_filter_contract_investigation

candidate_validator: 保存値が Options に存在すること、要求状態と返却状態が一致すること、要求担当者と返却担当者が一致すること、外部上限で切り捨てられていないこと、Generation Run の Seen 照合が完了したことを検査する。

install_status: candidate only

evidence_paths: docs/investigations/personal-task-candidate-query-20260806
