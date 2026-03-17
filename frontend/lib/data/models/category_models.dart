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

class CreateCategoryData {
  final String name;
  final CategoryType type;
  final String? parentCategory;
  final String? user;
  final String? icon;
  final String? color;

  CreateCategoryData({
    required this.name,
    required this.type,
    this.parentCategory,
    this.user,
    this.icon,
    this.color,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{'name': name, 'type': type.value};
    if (parentCategory != null) m['parentCategory'] = parentCategory;
    if (user != null) m['user'] = user;
    if (icon != null) m['icon'] = icon;
    if (color != null) m['color'] = color;
    return m;
  }
}

class UpdateCategoryData {
  final String? name;
  final CategoryType? type;
  final String? parentCategory;
  final String? icon;
  final String? color;

  UpdateCategoryData({this.name, this.type, this.parentCategory, this.icon, this.color});

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{};
    if (name != null) m['name'] = name;
    if (type != null) m['type'] = type!.value;
    m['parentCategory'] = parentCategory;
    if (icon != null) m['icon'] = icon;
    if (color != null) m['color'] = color;
    return m;
  }
}

/// Nút cây danh mục: danh mục cha và danh mục con.
class CategoryNode {
  final CategoryModel category;
  final List<CategoryNode> children;

  CategoryNode({required this.category, required this.children});

  /// Xây cây từ danh sách phẳng. Gốc là các category có parentCategory null.
  static List<CategoryNode> buildTree(List<CategoryModel> flat) {
    final byParent = <String?, List<CategoryModel>>{};
    for (final c in flat) {
      byParent.putIfAbsent(c.parentCategory, () => []).add(c);
    }
    List<CategoryNode> build(String? parentId) {
      final list = byParent[parentId] ?? [];
      return list.map((c) => CategoryNode(category: c, children: build(c.id))).toList();
    }
    return build(null);
  }
}
