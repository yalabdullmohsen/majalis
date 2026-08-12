/// Daily Adhkar checklist item.
class SharedAdhkarItem {
  const SharedAdhkarItem({
    required this.id,
    required this.titleAr,
    required this.done,
  });

  final String id;
  final String titleAr;
  final bool done;

  SharedAdhkarItem copyWith({
    String? id,
    String? titleAr,
    bool? done,
  }) {
    return SharedAdhkarItem(
      id: id ?? this.id,
      titleAr: titleAr ?? this.titleAr,
      done: done ?? this.done,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'titleAr': titleAr,
        'done': done,
      };

  factory SharedAdhkarItem.fromJson(Map<String, dynamic> json) {
    return SharedAdhkarItem(
      id: json['id'] as String? ?? '',
      titleAr: json['titleAr'] as String? ?? '',
      done: json['done'] as bool? ?? false,
    );
  }
}
