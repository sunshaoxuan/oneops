import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Form, Input, Modal } from "antd";
import {
  updateProfile,
  type AuthUser,
} from "@one-ops/api-client";
import type { MessageKey } from "./i18n";

export function ProfileDialog({
  open,
  user,
  t,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: AuthUser;
  t: (key: MessageKey) => string;
  onClose: () => void;
  onSaved: (user: AuthUser) => void;
}) {
  const [form] = Form.useForm<{ displayName: string }>();
  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: ({ user: savedUser }) => onSaved(savedUser),
  });

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ displayName: user.displayName });
    saveMutation.reset();
  }, [form, open, user.displayName]);

  return (
    <Modal
      open={open}
      title={t("profile")}
      okText={t("profileSave")}
      cancelText={t("close")}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saveMutation.isPending}
      width={560}
    >
      <p>{t("profileDescription")}</p>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(values) => saveMutation.mutate(values)}
      >
        <Form.Item label={t("profileUsername")}>
          <Input value={user.username} disabled />
        </Form.Item>
        <Form.Item label={t("profileEmail")}>
          <Input value={user.email} disabled />
        </Form.Item>
        <Form.Item
          name="displayName"
          label={t("profileDisplayName")}
          rules={[
            {
              required: true,
              whitespace: true,
              max: 120,
              message: t("profileDisplayNameRequired"),
            },
          ]}
        >
          <Input maxLength={120} autoComplete="name" />
        </Form.Item>
        {saveMutation.isError && (
          <Alert
            type="error"
            showIcon
            message={t("profileSaveFailed")}
          />
        )}
      </Form>
    </Modal>
  );
}
