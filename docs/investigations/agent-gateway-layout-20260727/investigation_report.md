# Agent Gateway 表单排版调查

日期：2026-07-27

## 结论

Agent Gateway 表单原先使用 `minmax(260px, 0.42fr) minmax(420px, 1fr)` 两列网格。字段按名称、Endpoint、Access Token、启用状态的顺序自动排列，导致 Access Token 落入窄列，启用状态落入宽列。

在 1265 像素浏览器视口中，窄列宽度为 261 像素，宽列宽度为 620 像素。Access Token 说明在窄列中形成多行，高度达到 138 像素；同行的启用状态只有一个开关，由此产生大面积无内容区域。

修正后，左列固定承担名称和启用状态，右列固定承担 API Endpoint 和 Access Token。长地址、Token 及其说明使用宽列。900 像素及以下继续使用现有单列响应式布局。

## 行为路径

1. `ModelDesignPage.tsx` 渲染 Agent Gateway 设置卡片及四个表单字段。
2. 字段类名确定桌面网格位置。
3. `styles.css` 在桌面宽度将名称与启用状态放入左列，将 Endpoint 与 Token 放入右列。
4. 900 像素断点把四个字段恢复为单列和自然顺序。
5. 测试读取组件与样式源文件，校验长字段位于宽列并存在窄屏恢复规则。

## 风险边界

本次只调整前端布局和验收文档。Agent Gateway API、数据库、Token 保存与回填、权限和连接测试行为保持原有契约。
