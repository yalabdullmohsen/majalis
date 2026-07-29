/// Per-word recitation outcome used by the alignment engine and UI highlighter.
enum WordRecitationStatus {
  /// Not yet spoken / awaiting the learner.
  pending,

  /// Spoken and matched the expected target word.
  correct,

  /// Spoken but did not match the expected word (within lookahead).
  incorrect,

  /// Expected word was skipped by the learner (passed beyond it).
  missing,
}
