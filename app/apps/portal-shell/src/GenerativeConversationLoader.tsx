import { TextLoader } from "generative-loaders";
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
      <span
        className="generative-conversation-loader-activity"
        aria-hidden="true"
      >
        {Array.from({ length: 3 }, (_, index) => <i key={index} />)}
      </span>
      <span className="generative-conversation-loader-copy">{statusLabel}</span>
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
