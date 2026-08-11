import { InlineLoader, TextLoader } from "generative-loaders";
import "./generative-conversation-loader.css";

export type GenerativeConversationLoaderPhase =
  | "QUEUED"
  | "RUNNING"
  | "STREAMING";

interface GenerativeConversationLoaderProps {
  phase: GenerativeConversationLoaderPhase;
  receivedText: string;
  statusLabel: string;
  className?: string;
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function GenerativeConversationLoader({
  phase,
  receivedText,
  statusLabel,
  className,
}: GenerativeConversationLoaderProps) {
  if (receivedText) {
    return (
      <TextLoader
        text={receivedText}
        variant="cascade"
        color="currentColor"
        paused={phase !== "STREAMING"}
        className={classNames(
          "generative-conversation-loader",
          "generative-conversation-loader-text",
          className,
        )}
        aria-label={receivedText}
      />
    );
  }

  const indicatorVariant = phase === "QUEUED" ? "orbit" : "gravity";

  return (
    <span
      className={classNames(
        "generative-conversation-loader",
        "generative-conversation-loader-status",
        className,
      )}
      data-phase={phase.toLowerCase()}
      role="status"
      aria-live="polite"
    >
      <InlineLoader
        variant={indicatorVariant}
        size="1.35em"
        speed={1.1}
        color="#ff6b2c"
        className="generative-conversation-loader-indicator"
      />
      <span>{statusLabel}</span>
    </span>
  );
}
