enum CategoryType { income, expense }

extension CategoryTypeExt on CategoryType {
  String get value => name;
  static CategoryType fromString(String? s) {
    switch (s?.toLowerCase()) {
      case 'income':
        return CategoryType.income;
      case 'expense':
        return CategoryType.expense;
      default:
        return CategoryType.expense;
    }
  }
}

class CategoryModel {
  final String id;
  final String name;
  final CategoryType type;
  final String? parentCategory;
  final String? user;
  final String? icon;
  final String? color;

  CategoryModel({
    required this.id,
    required this.name,
    required this.type,
    this.parentCategory,
    this.user,
    this.icon,
    this.color,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      type: CategoryTypeExt.fromString(json['type'] as String?),
      parentCategory: json['parentCategory'] as String?,
      user: json['user'] as String?,
      icon: json['icon'] as String?,
      color: json['color'] as String?,
    );
  }
}
