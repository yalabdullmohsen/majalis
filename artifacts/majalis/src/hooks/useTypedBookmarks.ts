import { useCallback, useEffect, useState } from "react";
import {
  getBookmarksByType,
  loadTypedBookmarks,
  loadTypedBookmarksAsync,
  migrateLegacyBookmarks,
  removeTypedBookmark,
  restoreAllBookmarkPositions,
  restoreBookmarkPosition,
  upsertTypedBookmark,
  type BookmarkPositionMarker,
  type BookmarkType,
  type TypedBookmark,
} from "@/lib/typed-bookmarks-engine";

/** Typed dynamic bookmarks — logic only. */
export function useTypedBookmarks() {
  const [bookmarks, setBookmarks] = useState<TypedBookmark[]>(() => loadTypedBookmarks());
  const [positions, setPositions] = useState<Record<string, BookmarkPositionMarker>>(() =>
    restoreAllBookmarkPositions(),
  );

  const refresh = useCallback(() => {
    setBookmarks(loadTypedBookmarks());
    setPositions(restoreAllBookmarkPositions());
  }, []);

  useEffect(() => {
    migrateLegacyBookmarks();
    void loadTypedBookmarksAsync().then((list) => {
      setBookmarks(list);
      setPositions(restoreAllBookmarkPositions());
    });
  }, []);

  const add = useCallback(
    (input: Parameters<typeof upsertTypedBookmark>[0]) => {
      const row = upsertTypedBookmark(input);
      refresh();
      return row;
    },
    [refresh],
  );

  const remove = useCallback(
    (id: string) => {
      removeTypedBookmark(id);
      refresh();
    },
    [refresh],
  );

  const byType = useCallback((type: BookmarkType) => getBookmarksByType(type), []);

  const restore = useCallback((type: BookmarkType) => restoreBookmarkPosition(type), []);

  return { bookmarks, positions, add, remove, byType, restore, refresh };
}
