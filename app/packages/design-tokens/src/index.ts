import type { ThemeConfig } from "antd";

export const oneHrColors = {
  primary: "#fd6c26",
  primaryHover: "#ff8348",
  primarySoft: "#fff0e9",
  primarySurface: "#fff8f5",
  teal: "#00c4cc",
  tealSoft: "#e8fbfc",
  ink: "#333333",
  muted: "#717781",
  canvas: "#f7f8fa",
  border: "#e0e3e8",
  white: "#ffffff",
  success: "#20a66a",
  warning: "#f2a516",
  danger: "#e84b4b",
} as const;

export const oneHrTheme: ThemeConfig = {
  cssVar: {
    prefix: "one-ops",
  },
  token: {
    colorPrimary: oneHrColors.primary,
    colorInfo: oneHrColors.teal,
    colorSuccess: oneHrColors.success,
    colorWarning: oneHrColors.warning,
    colorError: oneHrColors.danger,
    colorText: oneHrColors.ink,
    colorTextSecondary: oneHrColors.muted,
    colorBgLayout: oneHrColors.canvas,
    colorBorderSecondary: oneHrColors.border,
    borderRadius: 10,
    borderRadiusLG: 18,
    fontFamily:
      '"Lato", "Noto Sans JP", "Noto Sans SC", "Yu Gothic", "Meiryo", sans-serif',
    boxShadowSecondary: "0 18px 50px rgba(51, 51, 51, 0.08)",
    controlHeight: 40,
  },
  components: {
    Button: {
      borderRadius: 999,
      primaryShadow: "0 8px 20px rgba(253, 108, 38, 0.22)",
    },
    Card: {
      borderRadiusLG: 18,
      boxShadowTertiary: "0 10px 30px rgba(51, 51, 51, 0.05)",
    },
    Menu: {
      itemBorderRadius: 12,
      itemSelectedBg: oneHrColors.primarySoft,
      itemSelectedColor: oneHrColors.primary,
      itemHoverBg: oneHrColors.primarySurface,
    },
    Table: {
      headerBg: "#fafafa",
      headerColor: "#626871",
      rowHoverBg: oneHrColors.primarySurface,
    },
  },
};
