import 'package:equatable/equatable.dart';

sealed class Failure extends Equatable {
  const Failure(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}

class DataFailure extends Failure {
  const DataFailure(super.message);
}

class AudioFailure extends Failure {
  const AudioFailure(super.message);
}

class PermissionFailure extends Failure {
  const PermissionFailure(super.message);
}

class IntegrityFailure extends Failure {
  const IntegrityFailure(super.message);
}
