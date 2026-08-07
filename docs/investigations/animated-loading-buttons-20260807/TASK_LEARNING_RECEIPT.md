# タスク学習回执

task_type: 第三者動的 UI 工程の React Portal 統合

reusable_pattern: 公開ページ、README、LICENSE、import graph、描画 lifecycle を確認し、上流 snapshot を独立境界で保持する。metadata と動的 import を共通 package に集約し、Portal の薄いアダプターでアクセシビリティ、停止条件、描画頻度及び業務状態を制御する。

failure_or_correction: 初回実装は 25 種類を主 bundle に含めたため、图库と variant を動的 import へ変更した。Ant Design の二文字自動間隔により accessible name が空白を含んだため、単体試験を空白許容の業務ラベル照合へ修正した。動的 Canvas の full-page screenshot に結合重複が発生したため、top、bottom、mobile の通常 viewport screenshot と frame hash へ分割した。

candidate_skill: third-party-animated-ui-integration

candidate_validator: license、upstream snapshot hash、import graph、stable IDs、lazy chunks、lifecycle cleanup、reduced motion、unit tests、production build、DOM mount count、frame change、Console、responsive screenshot、Git scope、remote equality

install_status: candidate only

evidence_paths: `docs/investigations/animated-loading-buttons-20260807/`、`docs/evidence/loader-buttons-gallery-top-20260807.png`、`docs/evidence/loader-buttons-gallery-bottom-20260807.png`、`docs/evidence/loader-buttons-gallery-mobile-20260807.png`
