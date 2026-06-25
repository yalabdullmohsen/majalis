import { fromDbLesson } from "@/lib/unified-lesson-card";
import { UnifiedLessonCard } from "./UnifiedLessonCard";

type LessonLike = {
  id: string;
  title: string;
  category?: string;
  mosque?: string;
  city?: string;
  region?: string;
  description?: string;
  schedule?: string;
  day_of_week?: string;
  lesson_time?: string;
  speaker_name?: string;
  sheikhs?: { name?: string };
  sortKey?: number;
};

type Props = {
  lesson: LessonLike;
  showRegister?: boolean;
  registered?: boolean;
  onToggleRegister?: () => void;
  compact?: boolean;
};

export function LessonCard({ lesson, showRegister, registered, onToggleRegister, compact }: Props) {
  const unified = fromDbLesson(lesson);
  return (
    <UnifiedLessonCard
      lesson={unified}
      compact={compact}
      showRegister={showRegister}
      registered={registered}
      onToggleRegister={onToggleRegister}
    />
  );
}

export default LessonCard;
