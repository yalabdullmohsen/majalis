import { SaveToLibraryButton } from "./SaveToLibraryButton";
import { PersonalNotesPanel } from "./PersonalNotesPanel";

type Props = {
  contentType: string;
  contentId: string;
  title?: string;
  contentUrl?: string;
  metadata?: Record<string, unknown>;
  compact?: boolean;
};

/** Save + private notes — drop into any content detail page */
export function PersonalContentActions({ contentType, contentId, title, contentUrl, metadata, compact }: Props) {
  return (
    <div className="personal-content-actions">
      <SaveToLibraryButton
        contentType={contentType}
        contentId={contentId}
        title={title}
        contentUrl={contentUrl}
        metadata={metadata}
        compact={compact}
      />
      <PersonalNotesPanel
        contentType={contentType}
        contentId={contentId}
        contentTitle={title}
        compact={compact}
      />
    </div>
  );
}
