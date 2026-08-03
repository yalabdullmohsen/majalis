import json
from typing import Any, Dict, List, Tuple

from arabic_utils import normalize_arabic
from settings import settings


def word_distance(a: str, b: str) -> int:
    if a == b:
        return 0

    rows = len(a) + 1
    cols = len(b) + 1

    dp = [[0 for _ in range(cols)] for _ in range(rows)]

    for i in range(rows):
        dp[i][0] = i

    for j in range(cols):
        dp[0][j] = j

    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if a[i - 1] == b[j - 1] else 1

            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )

    return dp[-1][-1]


def words_are_close(expected: str, recognized: str) -> bool:
    if expected == recognized:
        return True

    if not expected or not recognized:
        return False

    distance = word_distance(expected, recognized)
    max_len = max(len(expected), len(recognized))

    if max_len <= 3:
        return distance == 1

    ratio = distance / max_len
    return ratio <= 0.34


def build_expected_map(
    expected_words: List[str],
    expected_word_map_raw: str,
    from_surah: int,
    from_ayah: int,
) -> List[Dict[str, Any]]:
    if expected_word_map_raw:
        try:
            decoded = json.loads(expected_word_map_raw)

            if isinstance(decoded, list):
                result = []

                for index, item in enumerate(decoded):
                    if not isinstance(item, dict):
                        continue

                    word = normalize_arabic(str(item.get("word", "")))

                    if not word:
                        continue

                    result.append(
                        {
                            "word": word,
                            "globalWordIndex": int(item.get("globalWordIndex", index)),
                            "wordIndexInAyah": int(item.get("wordIndexInAyah", index)),
                            "surah": int(item.get("surah", from_surah)),
                            "ayah": int(item.get("ayah", from_ayah)),
                        }
                    )

                if result:
                    return result
        except json.JSONDecodeError:
            pass

    return [
        {
            "word": word,
            "globalWordIndex": index,
            "wordIndexInAyah": index,
            "surah": from_surah,
            "ayah": from_ayah,
        }
        for index, word in enumerate(expected_words)
    ]


def align_with_edit_distance(
    expected_map: List[Dict[str, Any]],
    recognized_words: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    n = len(expected_map)
    m = len(recognized_words)

    dp: List[List[float]] = [[0.0] * (m + 1) for _ in range(n + 1)]
    op: List[List[str]] = [[""] * (m + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        dp[i][0] = float(i)
        op[i][0] = "missing"

    for j in range(1, m + 1):
        dp[0][j] = float(j)
        op[0][j] = "extra"

    for i in range(1, n + 1):
        expected_word = expected_map[i - 1]["word"]

        for j in range(1, m + 1):
            recognized_word = recognized_words[j - 1]["word"]

            if expected_word == recognized_word:
                sub_cost = 0.0
            elif words_are_close(expected_word, recognized_word):
                sub_cost = 0.45
            else:
                sub_cost = 1.0

            substitution = dp[i - 1][j - 1] + sub_cost
            deletion = dp[i - 1][j] + 1.0
            insertion = dp[i][j - 1] + 1.0

            best = min(substitution, deletion, insertion)
            dp[i][j] = best

            if best == substitution:
                op[i][j] = "match" if sub_cost == 0.0 else "mismatch"
            elif best == deletion:
                op[i][j] = "missing"
            else:
                op[i][j] = "extra"

    aligned_reversed: List[Dict[str, Any]] = []

    i = n
    j = m

    while i > 0 or j > 0:
        operation = op[i][j]

        if i > 0 and j > 0 and operation in ("match", "mismatch"):
            expected_item = expected_map[i - 1]
            recognized = recognized_words[j - 1]
            confidence = float(recognized.get("confidence", 0.0))

            if operation == "match":
                status = "correct"

                if confidence > 0 and confidence < settings.low_confidence_threshold:
                    status = "lowConfidence"
            else:
                status = "mismatch"

            aligned_reversed.append(
                {
                    "expectedWord": expected_item["word"],
                    "recognizedWord": recognized["word"],
                    "globalWordIndex": expected_item["globalWordIndex"],
                    "wordIndexInAyah": expected_item["wordIndexInAyah"],
                    "surah": expected_item["surah"],
                    "ayah": expected_item["ayah"],
                    "startMs": recognized.get("startMs"),
                    "endMs": recognized.get("endMs"),
                    "confidence": confidence,
                    "status": status,
                }
            )

            i -= 1
            j -= 1
            continue

        if i > 0 and operation == "missing":
            expected_item = expected_map[i - 1]

            aligned_reversed.append(
                {
                    "expectedWord": expected_item["word"],
                    "recognizedWord": None,
                    "globalWordIndex": expected_item["globalWordIndex"],
                    "wordIndexInAyah": expected_item["wordIndexInAyah"],
                    "surah": expected_item["surah"],
                    "ayah": expected_item["ayah"],
                    "startMs": None,
                    "endMs": None,
                    "confidence": 0.0,
                    "status": "missing",
                }
            )

            i -= 1
            continue

        if j > 0:
            j -= 1
            continue

        break

    return list(reversed(aligned_reversed))


def build_ayah_scores(aligned_words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grouped: Dict[Tuple[int, int], List[Dict[str, Any]]] = {}

    for word in aligned_words:
        key = (int(word.get("surah", 0)), int(word.get("ayah", 0)))
        grouped.setdefault(key, []).append(word)

    scores: List[Dict[str, Any]] = []

    for (surah, ayah), words in grouped.items():
        total = len(words)
        correct = sum(1 for w in words if w["status"] == "correct")
        missing = sum(1 for w in words if w["status"] == "missing")
        wrong = sum(1 for w in words if w["status"] == "mismatch")
        low = sum(1 for w in words if w["status"] == "lowConfidence")

        accuracy = 0.0 if total == 0 else correct / total

        scores.append(
            {
                "surah": surah,
                "ayah": ayah,
                "totalWords": total,
                "correctWords": correct,
                "missingWords": missing,
                "wrongWords": wrong,
                "lowConfidenceWords": low,
                "accuracy": accuracy,
            }
        )

    scores.sort(key=lambda item: (item["surah"], item["ayah"]))
    return scores


def build_weak_spots(ayah_scores: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    weak_spots: List[Dict[str, Any]] = []

    for score in ayah_scores:
        surah = int(score["surah"])
        ayah = int(score["ayah"])
        accuracy = float(score["accuracy"])
        missing = int(score["missingWords"])
        wrong = int(score["wrongWords"])
        low = int(score["lowConfidenceWords"])

        if accuracy < 0.85:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "lowAccuracy",
                    "title": "تحتاج الآية إلى مراجعة",
                    "description": f"الدقة التقريبية في هذه الآية {round(accuracy * 100)}%.",
                    "severity": 3 if accuracy < 0.75 else 2,
                }
            )

        if missing > 0:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "missingWords",
                    "title": "كلمات ناقصة",
                    "description": f"يوجد {missing} كلمة ناقصة في الآية.",
                    "severity": 3,
                }
            )

        if wrong > 0:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "repeatedMistake",
                    "title": "كلمات غير مطابقة",
                    "description": f"يوجد {wrong} كلمة غير مطابقة في الآية.",
                    "severity": 2,
                }
            )

        if low > 0:
            weak_spots.append(
                {
                    "surah": surah,
                    "ayah": ayah,
                    "type": "lowConfidence",
                    "title": "جودة تعرف منخفضة",
                    "description": f"يوجد {low} كلمة بثقة منخفضة.",
                    "severity": 1,
                }
            )

    weak_spots.sort(key=lambda item: item["severity"], reverse=True)
    return weak_spots[:10]
