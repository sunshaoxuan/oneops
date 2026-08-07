import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const secondaryHeadingStyles = styles.slice(
  styles.indexOf("/* 第2階層の見出しはページ大見出しより軽い情報密度で表示する。 */"),
);

describe("第2階層見出し", () => {
  it("ページ大見出しと異なる軽量な表現を使用する", () => {
    expect(secondaryHeadingStyles).toContain("min-height: 72px");
    expect(secondaryHeadingStyles).toContain("background: #fff !important");
    expect(secondaryHeadingStyles).toContain("box-shadow: 0 8px 22px");
    expect(secondaryHeadingStyles).toContain("font-size: 22px !important");
    expect(secondaryHeadingStyles).toContain("font-weight: 700 !important");
    expect(secondaryHeadingStyles).toContain(
      ".portal-section-heading::before,\n.portal-section-heading::after",
    );
    expect(secondaryHeadingStyles).toContain("display: none");
  });
});
