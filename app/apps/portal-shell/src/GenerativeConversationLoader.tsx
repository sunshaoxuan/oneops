import { InlineLoader, TextLoader } from "generative-loaders";
import { useEffect, useState } from "react";
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

function ConversationStatusActivity({
  phase,
  statusLabel,
  className,
}: {
  phase: GenerativeConversationLoaderPhase;
  statusLabel: string;
  className?: string;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  const indicatorVariant = phase === "QUEUED" ? "orbit" : "gravity";

  return (
    <span
      className={classNames(
        "generative-conversation-loader",
        "generative-conversation-loader-status",
        className,
      )}
      data-phase={phase.toLowerCase()}
      data-elapsed-seconds={elapsedSeconds}
      role="status"
      aria-live="polite"
    >
      <span
        className="generative-conversation-loader-activity"
        aria-hidden="true"
      >
        <InlineLoader
          variant={indicatorVariant}
          size="1.55em"
          speed={1.1}
          color="#ff6b2c"
          className="generative-conversation-loader-indicator"
        />
        <span className="generative-conversation-loader-meter">
          {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
        </span>
      </span>
      <span className="generative-conversation-loader-copy">
        <span>{statusLabel}</span>
        <small aria-hidden="true">{elapsedSeconds}s</small>
      </span>
    </span>
  );
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

  return (
    <ConversationStatusActivity
      phase={phase}
      statusLabel={statusLabel}
      className={className}
    />
  );
}
