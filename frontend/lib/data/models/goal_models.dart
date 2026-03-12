import 'pagination.dart';

class GoalModel {
  final String id;
  final String title;
  final double targetAmount;
  final double currentAmount;
  final DateTime dueDate;
  final String user;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  GoalModel({
    required this.id,
    required this.title,
    required this.targetAmount,
    this.currentAmount = 0,
    required this.dueDate,
    required this.user,
    this.createdAt,
    this.updatedAt,
  });

  factory GoalModel.fromJson(Map<String, dynamic> json) {
    return GoalModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      targetAmount: (json['targetAmount'] as num?)?.toDouble() ?? 0,
      currentAmount: (json['currentAmount'] as num?)?.toDouble() ?? 0,
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate'] as String) ?? DateTime.now() : DateTime.now(),
      user: json['user'] as String? ?? '',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null,
    );
  }

  double get progress => targetAmount > 0 ? (currentAmount / targetAmount).clamp(0.0, 1.0) : 0;
}

class CreateGoalData {
  final String title;
  final double targetAmount;
  final double? currentAmount;
  final DateTime dueDate;
  final String user;

  CreateGoalData({
    required this.title,
    required this.targetAmount,
    this.currentAmount,
    required this.dueDate,
    required this.user,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{
      'title': title,
      'targetAmount': targetAmount,
      'dueDate': dueDate.toIso8601String(),
      'user': user,
    };
    if (currentAmount != null) m['currentAmount'] = currentAmount;
    return m;
  }
}

class UpdateGoalData {
  final String? title;
  final double? targetAmount;
  final double? currentAmount;
  final DateTime? dueDate;

  UpdateGoalData({this.title, this.targetAmount, this.currentAmount, this.dueDate});

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (title != null) m['title'] = title;
    if (targetAmount != null) m['targetAmount'] = targetAmount;
    if (currentAmount != null) m['currentAmount'] = currentAmount;
    if (dueDate != null) m['dueDate'] = dueDate!.toIso8601String();
    return m;
  }
}

class PaginatedGoalsResponse {
  final List<GoalModel> data;
  final Pagination pagination;

  PaginatedGoalsResponse({required this.data, required this.pagination});

  factory PaginatedGoalsResponse.fromJson(Map<String, dynamic> json) {
    final list = json['data'] as List<dynamic>? ?? [];
    return PaginatedGoalsResponse(
      data: list.map((e) => GoalModel.fromJson(e as Map<String, dynamic>)).toList(),
      pagination: Pagination.fromJson(json['pagination'] as Map<String, dynamic>? ?? {}),
    );
  }
}
