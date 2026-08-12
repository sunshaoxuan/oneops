import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Form, Input, Modal } from "antd";
import { changeLocalPassword } from "@one-ops/api-client";
import type { MessageKey } from "./i18n";

export function PasswordChangeDialog({
  open,
  t,
  onClose,
}: {
  open: boolean;
  t: (key: MessageKey) => string;
  onClose: () => void;
}) {
  const [form] = Form.useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();
  const mutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => changeLocalPassword({ currentPassword, newPassword }),
    onSuccess: () => form.resetFields(),
    onError: (error) => {
      const code = (error as Error & { code?: string }).code;
      const details = (error as Error & { details?: unknown }).details;
      if (code === "CURRENT_PASSWORD_INCORRECT") {
        form.setFields([{
          name: "currentPassword",
          errors: [t("profileCurrentPasswordIncorrect")],
        }]);
      } else if (
        details &&
        typeof details === "object" &&
        !Array.isArray(details) &&
        "newPassword" in details
      ) {
        form.setFields([{
          name: "newPassword",
          errors: [t("profileNewPasswordRequirements")],
        }]);
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    mutation.reset();
  }, [form, open]);

  return (
    <Modal
      open={open}
      title={t("profilePasswordChange")}
      okText={t("profilePasswordSave")}
      cancelText={t("close")}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      width={560}
      destroyOnHidden
    >
      <p>{t("profilePasswordDescription")}</p>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(values) => mutation.mutate(values)}
      >
        <Form.Item
          name="currentPassword"
          label={t("profileCurrentPassword")}
          rules={[{
            required: true,
            message: t("profileCurrentPasswordRequired"),
          }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label={t("profileNewPassword")}
          extra={t("profileNewPasswordRequirements")}
          rules={[
            {
              required: true,
              message: t("profileNewPasswordRequirements"),
            },
            {
              pattern:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,256}$/,
              message: t("profileNewPasswordRequirements"),
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t("profileConfirmPassword")}
          dependencies={["newPassword"]}
          rules={[
            {
              required: true,
              message: t("profileConfirmPasswordRequired"),
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return !value || value === getFieldValue("newPassword")
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(t("profilePasswordMismatch")),
                    );
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        {mutation.isSuccess && (
          <Alert type="success" showIcon message={t("profilePasswordChanged")} />
        )}
        {mutation.isError &&
          (mutation.error as Error & { code?: string }).code !==
            "CURRENT_PASSWORD_INCORRECT" && (
            <Alert
              type="error"
              showIcon
              message={t("profilePasswordChangeFailed")}
            />
          )}
      </Form>
    </Modal>
  );
}
