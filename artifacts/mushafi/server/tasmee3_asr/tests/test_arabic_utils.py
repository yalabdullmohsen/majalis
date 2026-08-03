from arabic_utils import normalize_arabic, tokenize


def test_normalize_arabic_removes_tashkeel():
    assert normalize_arabic("قُلْ هُوَ ٱللَّهُ أَحَدٌ") == "قل هو الله احد"


def test_tokenize():
    assert tokenize("قُلْ هُوَ ٱللَّهُ أَحَدٌ") == ["قل", "هو", "الله", "احد"]
