# 问合支援凭据回填调查报告

日期：2026-07-27

## 结论

问合支援登录密码原本已经通过 AES-256-GCM 加密保存，设置读取路径具备解密能力。设置接口使用了隐藏密码的默认映射，前端加载后又把密码设为空值，并关闭了密码控件的可见性切换，因此管理员无法核对或复制已经保存的密码。

本次调整统一了三类管理员凭据的交互：

1. UPDS 实站登录密码。
2. 模型 API Key。
3. Agent Gateway Access Token。

设置加载后完整回填，初始输入类型为 `password`。管理员可以使用眼睛按钮切换为 `text`，也可以使用复制按钮写入系统剪贴板。截图、测试输出、审计和应用日志均不记录凭据原文。

## 调用路径

1. `inquiry_source_settings.encrypted_credentials` 保存加密账号和密码。
2. `decodeCredentials` 使用设置物理 ID 作为附加认证数据完成解密。
3. `GET /api/work-center/v1/inquiry-support/settings` 请求完整凭据映射。
4. API 使用 HTTPS、系统管理员读取权限和 `Cache-Control: no-store`。
5. `InquirySupportSettingsPage` 把完整密码交给 `SecretInput`。
6. `SecretInput` 默认掩码，提供可见性切换和复制按钮。

## 权限边界

设置读取需要 `models.settings.read`，设置保存和测试需要 `models.settings.write`。普通问合支援业务查询继续使用 `inquiries.use`，不会返回网站登录凭据。
