class MushafPageRange {
  final int fromPage;
  final int toPage;

  const MushafPageRange({
    required this.fromPage,
    required this.toPage,
  });

  int get pagesCount {
    if (toPage < fromPage) {
      return 0;
    }

    return toPage - fromPage + 1;
  }

  bool get isValid {
    return fromPage >= 1 && toPage >= fromPage;
  }

  String get label {
    if (fromPage == toPage) {
      return 'صفحة $fromPage';
    }

    return 'من صفحة $fromPage إلى صفحة $toPage';
  }
}
