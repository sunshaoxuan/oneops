# タスク学習受領記録

task_type: 重複操作を一体型分割 Button へ統合する UI 改版

reusable_pattern: 主操作と関連 Menu を一体化する時は、主 Segment と Menu Segment の操作領域を分離し、通常時、Group Hover、Menu Segment Hover、Keyboard、Reduced Motion を独立して受入する。

failure_or_correction: Animation の停止だけを調整すると入口の重複と視覚的な騒がしさが残る。Popup DOM の存在だけでは Menu の視認性を証明できず、正式 Screenshot で Viewport 外座標を検出した。Header の重複入口と旧 Animation を削除し、左側の主操作へ Menu Segment を統合し、Popup を Row 直下へ固定した。

candidate_skill: `D:/workspace/codex-selfimp/outputs/ai-assistant-split-shortcut-trigger-20260811/CANDIDATE_SPLIT_ACTION_TRIGGER.md`

candidate_validator: duplicate_entry_absence、idle_animation_none、group_hover_glint、menu_segment_hover、popup_viewport_rect、reduced_motion_static

install_status: candidate のみ。正式 skill、validator、AGENTS.md へ未導入。

evidence_paths: `docs/investigations/ai-assistant-split-shortcut-trigger-20260811`
