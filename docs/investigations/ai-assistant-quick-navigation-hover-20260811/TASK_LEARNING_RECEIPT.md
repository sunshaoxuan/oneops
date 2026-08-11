# Task Learning Receipt

- task_type: Hover Popup と Scrollbar の UI 不具合
- reusable_pattern: Hover 前、中、後の Root 寸法と Popup Position を Browser で同時計測する
- failure_or_correction: Positioned Container への Portal 移動は座標系不一致を起こしたため、固定 Viewport Layer へ返工した
- candidate_skill: `D:\workspace\codex-selfimp\2026-08-11-oneops-tooltip-scrollbar\CANDIDATE.md`
- candidate_validator: Root Scroll 寸法、Popup Position、Console、2 Frame Screenshot の組合せ
- install_status: candidate_only
- evidence_paths: `investigation_report.md`、`test_results.md`、`quick-navigation-hover-0.18.15.png`、`quick-navigation-away-0.18.15.png`
