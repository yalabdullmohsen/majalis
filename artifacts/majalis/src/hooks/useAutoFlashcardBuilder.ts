import { useCallback, useState } from "react";
import {
  buildFlashcardFromAdhkar,
  buildFlashcardFromGhareeb,
  buildFlashcardFromMatn,
  buildFlashcardFromMutashabihat,
  buildFlashcardFromVerse,
  listBuiltFlashcards,
  type BuiltFlashcard,
} from "@/lib/auto-flashcard-builder";

/** Automated SM-2 flashcard builder — logic only. */
export function useAutoFlashcardBuilder(userId = "local") {
  const [cards, setCards] = useState<BuiltFlashcard[]>(() => listBuiltFlashcards());

  const refresh = useCallback(() => {
    setCards(listBuiltFlashcards());
  }, []);

  const fromVerse = useCallback(
    async (surah: number, ayah: number, text: string, tags?: string[]) => {
      const card = await buildFlashcardFromVerse({ surah, ayah, text, userId, tags });
      refresh();
      return card;
    },
    [userId, refresh],
  );

  const fromGhareeb = useCallback(
    async (word: string, meaning: string, exampleRef?: string) => {
      const card = await buildFlashcardFromGhareeb({ word, meaning, exampleRef, userId });
      refresh();
      return card;
    },
    [userId, refresh],
  );

  const fromMatn = useCallback(
    async (matnLine: string, answer: string, sourceId?: string) => {
      const card = await buildFlashcardFromMatn({ matnLine, answer, sourceId, userId });
      refresh();
      return card;
    },
    [userId, refresh],
  );

  const fromMutashabihat = useCallback(
    async (prompt: string, answer: string, leftRef: string, rightRef: string) => {
      const card = await buildFlashcardFromMutashabihat({
        prompt,
        answer,
        leftRef,
        rightRef,
        userId,
      });
      refresh();
      return card;
    },
    [userId, refresh],
  );

  const fromAdhkar = useCallback(
    async (text: string, adhkarId?: string) => {
      const card = await buildFlashcardFromAdhkar({ text, adhkarId, userId });
      refresh();
      return card;
    },
    [userId, refresh],
  );

  return {
    cards,
    refresh,
    fromVerse,
    fromGhareeb,
    fromMatn,
    fromMutashabihat,
    fromAdhkar,
  };
}
