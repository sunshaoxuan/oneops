import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
} from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ai-markdown.css";

const components: Components = {
  a({ href, children, ...props }) {
    const external = /^https?:\/\//i.test(href ?? "");
    return (
      <a
        {...props}
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  },
  table({ children }) {
    return (
      <div className="ai-markdown-table-wrap">
        <table>{children}</table>
      </div>
    );
  },
  img({ alt }) {
    return (
      <span className="ai-markdown-image-placeholder">
        {alt ? `画像: ${alt}` : "画像"}
      </span>
    );
  },
};

export function AiMarkdown({
  children,
  compact = false,
  className = "",
}: {
  children: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`ai-markdown${compact ? " ai-markdown-compact" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={defaultUrlTransform}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
