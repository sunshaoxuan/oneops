# タスク学習受領記録

task_type: 階層 Menu Popup の Viewport 外配置修正

reusable_pattern: DOM の存在と `visibility: visible` に加えて、各階層の Popup Rect、Containing Block、Computed Position、Ancestor Overflow、最小Viewport、浮動Window、Responsive方向及びScreenshotを確認する。

failure_or_correction: Portalled Submenu は内容が生成されても異常なInline InsetによりViewport外へ移動できる。LibraryがSemantic Classを上書きする場合は常時存在するContainerと標準Popup Classを契約にする。中間幅だけの確認では携帯幅と浮動WindowのOverflow裁切を検出できない。

candidate_skill: `D:/workspace/codex-selfimp/outputs/ai-assistant-shortcut-submenu-20260811/CANDIDATE_NESTED_POPUP_VIEWPORT_VALIDATION.md`

candidate_validator: nested_popup_rect、containing_block、absolute_position、ancestor_overflow、minimum_viewport、floating_window、responsive_direction、category_alignment、screenshot_visibility

install_status: candidate のみ。正式 Skill、Validator、AGENTS.md へ未導入。

evidence_paths: `docs/investigations/ai-assistant-shortcut-submenu-20260811`
