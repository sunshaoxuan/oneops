# タスク学習記録

task_type: Portal UI 第三者 React 動的表示ライブラリ統合

reusable_pattern: 公式デモ、npm metadata、型定義を順に確認し、実行依存を固定したうえで、プロジェクト固有の薄い共通ラッパーへ状態とアクセシブルなラベルを集約する。

failure_or_correction: 新規テストで未登録の jest-dom 型マッチャーを使ったため TypeScript が失敗した。既存の型環境に合わせて DOM 属性の取得と `toBe` に変更し、対象テストと TypeScript を再実行した。

candidate_skill: third-party-react-visual-library-integration

candidate_validator: 依存 metadata、型定義、lockfile、共通ラッパーの状態と label、単体テスト、production build、実画面 DOM、console、screenshot を一つの受入表で検証する validator。

install_status: candidate only。正式 skill、validator、AGENTS.md の変更は行っていない。

evidence_paths: `docs/investigations/progress-orb-integration-20260805/`、`app/apps/portal-shell/src/ProgressOrb.tsx`、`app/apps/portal-shell/src/ProgressOrb.test.tsx`
