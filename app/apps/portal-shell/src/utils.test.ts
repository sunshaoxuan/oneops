import { describe, expect, it } from "vitest";
import {
  clampColumnWidth,
  compareLocalizedText,
  formatBytes,
  matchesSearchFields,
  statusMeta,
} from "./utils";

describe("work center formatting", () => {
  it("formats operational byte values", () => {
    expect(formatBytes(16 * 1024 ** 3)).toBe("16.0 GB");
    expect(formatBytes(null)).toBe("—");
  });

  it("maps failed jobs to an error state", () => {
    expect(statusMeta("failed")).toEqual({
      color: "error",
      labelKey: "statusFailed",
    });
  });

  it("clamps manually resized columns to usable bounds", () => {
    expect(clampColumnWidth(50, 100)).toBe(100);
    expect(clampColumnWidth(244.4, 100)).toBe(244);
    expect(clampColumnWidth(900, 100)).toBe(720);
  });

  it("sorts localized text and numeric business codes", () => {
    expect(compareLocalizedText("0008", "0076", "ja-JP")).toBeLessThan(0);
    expect(compareLocalizedText("筑波大学", "北海道大学", "ja-JP")).not.toBe(0);
  });

  it("matches organization selectors by code or name", () => {
    expect(matchesSearchFields("oneh", "ONEHR", "OneHR株式会社")).toBe(true);
    expect(matchesSearchFields("株式会社", "ONEHR", "OneHR株式会社")).toBe(true);
    expect(matchesSearchFields("ＯＮＥＨＲ", "ONEHR", "OneHR株式会社")).toBe(true);
    expect(
      matchesSearchFields(
        "JIRCAS",
        "9082",
        "国際農林水産業研究センター",
        "JIRCAS",
      ),
    ).toBe(true);
    expect(matchesSearchFields("東京", "ONEHR", "OneHR株式会社")).toBe(false);
    expect(matchesSearchFields("", "ONEHR", "OneHR株式会社")).toBe(true);
  });
});
