import { splitAssistantLines } from "@/lib/assistant-text";

export function AssistantReply({ content }: { content: string }) {
  const lines = splitAssistantLines(content);

  return (
    <div className="assistant-reply space-y-2">
      {lines.map((line, index) => {
        const isTitle = index === 0 && !line.startsWith("•");

        return (
          <p
            key={`${index}-${line.slice(0, 24)}`}
            className={isTitle ? "assistant-reply-title" : "assistant-reply-line"}
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default AssistantReply;
