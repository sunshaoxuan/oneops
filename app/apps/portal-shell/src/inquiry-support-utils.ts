export function formatInquiryLocalDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function displayInquiryUrgency(
  title: string,
  urgency: string | null | undefined,
  normalLabel: string,
) {
  if (String(title).includes("至急")) return "至急";
  const value = String(urgency ?? "").trim();
  if (
    !value ||
    /^(?:未設定|未设定|未设置|not set|none|-|—)$/i.test(value)
  ) {
    return normalLabel;
  }
  return value;
}
