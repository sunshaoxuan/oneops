import { CopyOutlined } from "@ant-design/icons";
import { Button, Input, Space, Tooltip } from "antd";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

type SecretInputProps = Omit<
  ComponentProps<typeof Input.Password>,
  "visibilityToggle"
> & {
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
};

type CopyState = "idle" | "copied" | "failed";

export function SecretInput({
  copyLabel,
  copiedLabel,
  copyFailedLabel,
  value,
  disabled,
  ...inputProps
}: SecretInputProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const secret = String(value ?? "");

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 1_500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const tooltip = copyState === "copied"
    ? copiedLabel
    : copyState === "failed"
      ? copyFailedLabel
      : copyLabel;

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <Space.Compact block className="secret-input-with-copy">
      <Input.Password
        {...inputProps}
        value={value}
        disabled={disabled}
      />
      <Tooltip title={tooltip}>
        <Button
          htmlType="button"
          className="secret-copy-button"
          icon={<CopyOutlined />}
          aria-label={tooltip}
          disabled={disabled || !secret}
          onClick={() => void copySecret()}
        />
      </Tooltip>
    </Space.Compact>
  );
}
