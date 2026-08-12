# タスク学習回执

- task_type: 画面別オンラインヘルプの調査、実装、配信、Browser 受入
- reusable_pattern: Navigation Key から同一 Origin の静的 Help 文書を解決し、Source の Field、Button、Default、Validation、State、Result を Task 単位の詳細操作 Manual へ変換する
- failure_or_correction: 初版は一般的な機能説明に留まり、実作業の入力、状態、結果確認に利用できなかった。画面 Source と操作 Label を抽出し、97 件の明示 Step と Field Table へ再構成した。Browser Client は Loopback Preview を遮断した。目次の既定 Marker と Padding は共通 Style で解除した
- candidate_skill: なし。既存の engineering-investigation-evidence と browser skill で処理可能
- candidate_validator: Navigation Key、文書存在、現行 Label、操作 Step 下限、Field Contract、Trouble Section、目次 Target、OneHR Style を一括検査する Vitest
- install_status: Candidate の正式 Install なし
- evidence_paths: `docs/investigations/contextual-help-20260812`、`app/apps/portal-shell/src/contextual-help-documents.test.ts`
