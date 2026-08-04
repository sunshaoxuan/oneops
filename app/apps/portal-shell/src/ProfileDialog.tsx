import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Form, Input, Modal } from "antd";
import {
  fetchMyWorkforceProfile,
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
  const windowsIdentity = user.identities?.find(
    (identity) => identity.provider === "WINDOWS",
  );
  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: ({ user: savedUser }) => onSaved(savedUser),
  });
  const workforceQuery = useQuery({
    queryKey: ["my-workforce-profile", user.id],
    queryFn: ({ signal }) => fetchMyWorkforceProfile(signal),
    enabled: open,
  });
  const memberships = workforceQuery.data?.departmentMemberships ?? [];
  const responsibilities = workforceQuery.data?.responsibilityAssignments ?? [];

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
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
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
        {windowsIdentity && (
          <>
            <Form.Item label={t("profileDomainAccount")}>
              <Input value={windowsIdentity.subject} disabled />
            </Form.Item>
            <Form.Item label={t("profileDomainUpn")}>
              <Input value={windowsIdentity.upn} disabled />
            </Form.Item>
          </>
        )}
        <Form.Item label={t("profilePrimaryDepartment")}>
          <Input
            value={memberships.find((item) => item.isPrimary)?.departmentName || "－"}
            disabled
          />
        </Form.Item>
        <Form.Item label={t("profileAdditionalDepartments")}>
          <Input
            value={memberships.filter((item) => !item.isPrimary).map((item) => item.departmentName).join("、") || "－"}
            disabled
          />
        </Form.Item>
        <Form.Item label={t("profileBusinessResponsibilities")}>
          <Input
            value={responsibilities.map((item) => `${item.departmentName}: ${item.responsibilityName}`).join("、") || "－"}
            disabled
          />
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
