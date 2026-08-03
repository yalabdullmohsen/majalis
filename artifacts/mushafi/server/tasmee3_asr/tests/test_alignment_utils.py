from alignment_utils import align_with_edit_distance, build_ayah_scores


def test_align_correct_words():
    expected_map = [
        {
            "word": "قل",
            "globalWordIndex": 0,
            "wordIndexInAyah": 0,
            "surah": 112,
            "ayah": 1,
        },
        {
            "word": "هو",
            "globalWordIndex": 1,
            "wordIndexInAyah": 1,
            "surah": 112,
            "ayah": 1,
        },
    ]

    recognized = [
        {
            "word": "قل",
            "startMs": 0,
            "endMs": 100,
            "confidence": 0.9,
        },
        {
            "word": "هو",
            "startMs": 100,
            "endMs": 200,
            "confidence": 0.9,
        },
    ]

    result = align_with_edit_distance(expected_map, recognized)

    assert len(result) == 2
    assert result[0]["status"] == "correct"
    assert result[1]["status"] == "correct"


def test_align_missing_word():
    expected_map = [
        {
            "word": "قل",
            "globalWordIndex": 0,
            "wordIndexInAyah": 0,
            "surah": 112,
            "ayah": 1,
        },
        {
            "word": "هو",
            "globalWordIndex": 1,
            "wordIndexInAyah": 1,
            "surah": 112,
            "ayah": 1,
        },
    ]

    recognized = [
        {
            "word": "قل",
            "startMs": 0,
            "endMs": 100,
            "confidence": 0.9,
        },
    ]

    result = align_with_edit_distance(expected_map, recognized)

    assert result[1]["status"] == "missing"


def test_build_ayah_scores():
    aligned = [
        {
            "surah": 112,
            "ayah": 1,
            "status": "correct",
        },
        {
            "surah": 112,
            "ayah": 1,
            "status": "missing",
        },
    ]

    scores = build_ayah_scores(aligned)

    assert len(scores) == 1
    assert scores[0]["totalWords"] == 2
    assert scores[0]["missingWords"] == 1
