# OneOps 管理页面间距调查

日期：2026-07-27

## 结论

管理页面的共同问题来自 `.management-shell .ant-card-body { padding: 0; }`。该后代选择器会命中管理外壳内的全部嵌套 Card Body，模型设置、问合设置、用户管理和基本台账卡片的四边内边距因此全部变为 0。

模型设置还有第二个结构问题。操作按钮位于表单末尾，更新时间位于操作栏之后。存在更新时间的卡片高度为 458 像素，无更新时间的卡片高度为 406 像素；操作按钮分别贴近不同的卡片边界。

本次建立统一间距 Token，把 Card Body 清零限制为 `management-shell` 的直属元素。管理内容区和嵌套卡片桌面内边距统一为 24px，720px 及以下统一为 18px。模型设置、Agent Gateway 和问合设置统一使用 `management-card-footer` 与 `management-card-actions`。

## 影响路径

1. `App.tsx` 使用 `management-shell` 承载系统管理和基本台账。
2. 原后代选择器覆盖管理内容区内的所有 Ant Design Card。
3. `ModelDesignPage.tsx` 的两类设置卡片各自组织操作按钮和更新时间。
4. `InquirySupportSettingsPage.tsx` 使用独立的操作区样式。
5. 修正后，外壳直属 Card Body 继续为 0，嵌套 Card Head 和 Card Body 使用统一 Token。
6. 三类设置卡片使用同一 Footer 和按钮组规则。

## 范围边界

环境工作区中的分组、列表和详情面板具有明确的专用布局，其 Card Body 规则保持独立。认证页、工作台指标卡和问合详情抽屉也保持各自业务布局。本次统一覆盖系统管理、基本台账及其嵌套设置和表格卡片。
