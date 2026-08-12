import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Button, Divider, Form, Input, Modal } from "antd";
import {
  changeLocalPassword,
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
  const [passwordForm] = Form.useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();
  const windowsIdentity = user.identities?.find(
    (identity) => identity.provider === "WINDOWS",
  );
  const hasLocalIdentity = user.identities?.some(
    (identity) => identity.provider === "LOCAL",
  );
  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: ({ user: savedUser }) => onSaved(savedUser),
  });
  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => changeLocalPassword({ currentPassword, newPassword }),
    onSuccess: () => passwordForm.resetFields(),
    onError: (error) => {
      const code = (error as Error & { code?: string }).code;
      const details = (error as Error & { details?: unknown }).details;
      if (code === "CURRENT_PASSWORD_INCORRECT") {
        passwordForm.setFields([
          {
            name: "currentPassword",
            errors: [t("profileCurrentPasswordIncorrect")],
          },
        ]);
      } else if (
        details &&
        typeof details === "object" &&
        !Array.isArray(details) &&
        "newPassword" in details
      ) {
        passwordForm.setFields([
          {
            name: "newPassword",
            errors: [t("profileNewPasswordRequirements")],
          },
        ]);
      }
    },
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
    passwordForm.resetFields();
    passwordMutation.reset();
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
      width={880}
      className="profile-dialog"
      styles={{ body: { maxHeight: "76vh", overflowY: "auto" } }}
    >
      <p>{t("profileDescription")}</p>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(values) => saveMutation.mutate(values)}
      >
        <div className="profile-information-grid">
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
              value={memberships
                .filter((item) => !item.isPrimary)
                .map((item) => item.departmentName)
                .join("、") || "－"}
              disabled
            />
          </Form.Item>
          <Form.Item label={t("profileBusinessResponsibilities")}>
            <Input
              value={responsibilities
                .map(
                  (item) =>
                    `${item.departmentName}: ${item.responsibilityName}`,
                )
                .join("、") || "－"}
              disabled
            />
          </Form.Item>
        </div>
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
      {hasLocalIdentity && (
        <section className="profile-password-section">
          <Divider />
          <h3>{t("profilePasswordChange")}</h3>
          <p>{t("profilePasswordDescription")}</p>
          <Form
            form={passwordForm}
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => passwordMutation.mutate(values)}
          >
            <div className="profile-password-grid">
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
            </div>
            <Button
              onClick={() => passwordForm.submit()}
              loading={passwordMutation.isPending}
            >
              {t("profilePasswordSave")}
            </Button>
            {passwordMutation.isSuccess && (
              <Alert
                className="profile-password-alert"
                type="success"
                showIcon
                message={t("profilePasswordChanged")}
              />
            )}
            {passwordMutation.isError &&
              (passwordMutation.error as Error & { code?: string }).code !==
                "CURRENT_PASSWORD_INCORRECT" && (
                <Alert
                  className="profile-password-alert"
                  type="error"
                  showIcon
                  message={t("profilePasswordChangeFailed")}
                />
              )}
          </Form>
        </section>
      )}
    </Modal>
  );
}
