import { loaderDesigns } from "@one-ops/animated-loading-buttons";
import { Tag, Typography } from "antd";
import { AnimatedLoadingButton } from "./AnimatedLoadingButton";
import "./loader-button-gallery.css";

const { Paragraph, Text, Title } = Typography;

export function LoaderButtonGallery() {
  return (
    <main className="loader-button-gallery">
      <header className="loader-button-gallery-header">
        <Text className="loader-button-gallery-eyebrow">OneOps UI コンポーネント</Text>
        <Title level={1}>アニメーションボタン</Title>
        <Paragraph>
          25 種類のローディング表現を共通コンポーネントから選択できます。
          各カードの variant ID を業務画面の <code>loaderVariant</code> に指定します。
        </Paragraph>
        <div className="loader-button-gallery-summary" aria-label="収録方式">
          <Tag color="geekblue">WebGL 13 種類</Tag>
          <Tag color="cyan">SVG・Canvas・CSS 12 種類</Tag>
          <Tag color="orange">30fps 共通制御</Tag>
        </div>
      </header>

      <section className="loader-button-gallery-grid" aria-label="ローダー一覧">
        {loaderDesigns.map((design, index) => (
          <article className="loader-button-gallery-card" key={design.id}>
            <div className="loader-button-gallery-preview">
              <AnimatedLoadingButton
                loading
                loaderVariant={design.id}
                type="primary"
              >
                処理中
              </AnimatedLoadingButton>
            </div>
            <div className="loader-button-gallery-meta">
              <Text className="loader-button-gallery-index">
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text strong>{design.name}</Text>
              <code>{design.id}</code>
              <Text type="secondary">{design.technique}</Text>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
