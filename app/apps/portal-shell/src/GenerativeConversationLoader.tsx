import { TextLoader } from "generative-loaders";
import { useEffect, useState } from "react";
import "./generative-conversation-loader.css";

const LONG_WAIT_SECONDS = 30;

export type GenerativeConversationLoaderPhase =
  | "QUEUED"
  | "RUNNING"
  | "STREAMING";

interface GenerativeConversationLoaderProps {
  phase: GenerativeConversationLoaderPhase;
  receivedText: string;
  statusLabel: string;
  startedAt: string;
  longWaitLabel: string;
  className?: string;
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function ConversationStatusActivity({
  phase,
  statusLabel,
  startedAt,
  longWaitLabel,
  className,
}: {
  phase: GenerativeConversationLoaderPhase;
  statusLabel: string;
  startedAt: string;
  longWaitLabel: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const started = Date.parse(startedAt);
  const elapsedSeconds = Number.isFinite(started)
    ? Math.max(0, Math.floor((now - started) / 1000))
    : 0;
  const longWait = elapsedSeconds >= LONG_WAIT_SECONDS;

  return (
    <span
      className={classNames(
        "generative-conversation-loader",
        "generative-conversation-loader-status",
        className,
      )}
      data-phase={phase.toLowerCase()}
      data-elapsed-seconds={elapsedSeconds}
      data-long-wait={longWait ? "true" : "false"}
      role="status"
      aria-live="polite"
    >
      <span className="generative-conversation-loader-line">
        <span
          className="generative-conversation-loader-activity"
          aria-hidden="true"
        >
          {Array.from({ length: 3 }, (_, index) => <i key={index} />)}
        </span>
        <span className="generative-conversation-loader-copy">{statusLabel}</span>
        <small aria-hidden="true">{elapsedSeconds}s</small>
      </span>
      {longWait && (
        <span className="generative-conversation-loader-guidance">
          {longWaitLabel}
        </span>
      )}
    </span>
  );
}

export function GenerativeConversationLoader({
  phase,
  receivedText,
  statusLabel,
  startedAt,
  longWaitLabel,
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
      startedAt={startedAt}
      longWaitLabel={longWaitLabel}
      className={className}
    />
  );
}
