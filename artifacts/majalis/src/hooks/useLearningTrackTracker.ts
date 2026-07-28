import { useCallback, useEffect, useState } from "react";
import {
  completeTrackLesson,
  getResumePointers,
  listLearningTracks,
  loadAllTrackProgressAsync,
  setTrackLessonPointer,
  snapshotTrack,
  getTrackDefinition,
  type TrackKind,
  type TrackProgressSnapshot,
} from "@/lib/learning-track-tracker";

/** Methodological learning tracks — logic only. */
export function useLearningTrackTracker(kind?: TrackKind) {
  const [tracks] = useState(() => listLearningTracks(kind));
  const [snapshots, setSnapshots] = useState<TrackProgressSnapshot[]>([]);
  const [resume, setResume] = useState<TrackProgressSnapshot[]>(() => getResumePointers());

  const refresh = useCallback(() => {
    const snaps = listLearningTracks(kind).map((t) => snapshotTrack(t));
    setSnapshots(snaps);
    setResume(getResumePointers());
  }, [kind]);

  useEffect(() => {
    void loadAllTrackProgressAsync().then(() => refresh());
  }, [refresh]);

  const complete = useCallback(
    (trackId: string, lessonId: string) => {
      const snap = completeTrackLesson(trackId, lessonId);
      refresh();
      return snap;
    },
    [refresh],
  );

  const setPointer = useCallback(
    (trackId: string, lessonId: string) => {
      setTrackLessonPointer(trackId, lessonId);
      refresh();
    },
    [refresh],
  );

  const getSnapshot = useCallback((trackId: string) => {
    const t = getTrackDefinition(trackId);
    return t ? snapshotTrack(t) : null;
  }, []);

  return { tracks, snapshots, resume, complete, setPointer, getSnapshot, refresh };
}
