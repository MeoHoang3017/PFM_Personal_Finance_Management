import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/category_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/category_service.dart';

class CategoryFormScreen extends StatefulWidget {
  final CategoryModel? category;
  /// Khi thêm danh mục con: danh mục cha (type và parentId sẽ được set theo).
  final CategoryModel? parentCategory;
  /// Danh sách toàn bộ danh mục (để chọn cha). Nếu null/rỗng sẽ tự gọi API.
  final List<CategoryModel>? allCategories;

  const CategoryFormScreen({
    super.key,
    this.category,
    this.parentCategory,
    this.allCategories,
  });

  @override
  State<CategoryFormScreen> createState() => _CategoryFormScreenState();
}

class _CategoryFormScreenState extends State<CategoryFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  CategoryType _type = CategoryType.expense;
  CategoryModel? _selectedParent;
  List<CategoryModel> _allCategories = [];
  bool _loadingData = true;
  bool _loading = false;
  String? _errorMessage;
  UserInfo? _user;

  @override
  void initState() {
    super.initState();
    if (widget.category != null) {
      _nameController.text = widget.category!.name;
      _type = widget.category!.type;
      _selectedParent = _findParent(widget.category!.parentCategory);
    } else if (widget.parentCategory != null) {
      _type = widget.parentCategory!.type;
      _selectedParent = widget.parentCategory;
    }
    _loadData();
  }

  CategoryModel? _findParent(String? parentId) {
    if (parentId == null) return null;
    for (final c in _allCategories) {
      if (c.id == parentId) return c;
    }
    return null;
  }

  Future<void> _loadData() async {
    List<CategoryModel> list = widget.allCategories ?? [];
    if (list.isEmpty) {
      var res = await getIt<CategoryService>().getUserCategories();
      if (res.result != null) list = res.result!;
      if (list.isEmpty) {
        res = await getIt<CategoryService>().getCategories();
        if (res.result != null) list = res.result!;
      }
    }
    final user = await getIt<AuthService>().getStoredUser();
    if (!mounted) return;
    setState(() {
      _allCategories = list;
      _user = user;
      _loadingData = false;
      if (widget.category != null && _selectedParent == null && widget.category!.parentCategory != null) {
        _selectedParent = _findParent(widget.category!.parentCategory);
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  /// Danh sách danh mục có thể chọn làm cha: cùng type, không phải bản thân và không phải con cháu (khi edit).
  List<CategoryModel> get _parentOptions {
    final sameType = _allCategories.where((c) => c.type == _type).toList();
    if (widget.category == null) return sameType;
    final excludeIds = _collectSelfAndDescendantIds(CategoryNode.buildTree(sameType), widget.category!.id);
    return sameType.where((c) => !excludeIds.contains(c.id)).toList();
  }

  /// Thu thập id bản thân + tất cả con cháu (để không chọn làm cha → tránh vòng lặp).
  Set<String> _collectSelfAndDescendantIds(List<CategoryNode> nodes, String targetId) {
    for (final node in nodes) {
      if (node.category.id == targetId) {
        final out = <String>{targetId};
        _addDescendantIds(node.children, out);
        return out;
      }
      final fromChild = _collectSelfAndDescendantIds(node.children, targetId);
      if (fromChild.isNotEmpty) return fromChild;
    }
    return {};
  }

  void _addDescendantIds(List<CategoryNode> nodes, Set<String> out) {
    for (final node in nodes) {
      out.add(node.category.id);
      _addDescendantIds(node.children, out);
    }
  }

  Future<void> _save() async {
    if (_user == null) {
      setState(() => _errorMessage = 'not_logged_in'.tr());
      return;
    }
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final svc = getIt<CategoryService>();
      final name = _nameController.text.trim();
      final parentId = _selectedParent?.id;

      if (widget.category != null) {
        final res = await svc.updateCategory(
          widget.category!.id,
          UpdateCategoryData(name: name, type: _type, parentCategory: parentId),
        );
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'category_updated'.tr());
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await svc.createCategory(CreateCategoryData(
          name: name,
          type: _type,
          user: _user!.id,
          parentCategory: parentId,
        ));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'category_added'.tr());
        } else {
          setState(() => _errorMessage = res.message);
        }
      }
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _errorMessage = 'error_connection'.tr();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);
    final isEdit = widget.category != null;

    if (_loadingData) {
      return Scaffold(
        backgroundColor: p.backgroundColor,
        appBar: AppBar(title: Text(isEdit ? 'edit_category'.tr() : 'add_category'.tr())),
        body: Center(child: CircularProgressIndicator(color: p.primaryAction)),
      );
    }

    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text(isEdit ? 'edit_category'.tr() : 'add_category'.tr()),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: p.errorColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: p.errorColor.withValues(alpha: 0.4)),
                    ),
                    child: Text(_errorMessage!, style: TextStyle(color: p.errorColor)),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: 'category_name'.tr(),
                    hintText: 'category_name_hint'.tr(),
                    filled: true,
                    fillColor: p.cardSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'hint_category_name'.tr() : null,
                ),
                const SizedBox(height: 16),
                Text(
                  'category_type'.tr(),
                  style: TextStyle(color: p.subtitleText, fontSize: 12),
                ),
                const SizedBox(height: 6),
                SegmentedButton<CategoryType>(
                  segments: [
                    ButtonSegment(value: CategoryType.income, icon: const Icon(Icons.arrow_downward), label: Text('type_income_label'.tr())),
                    ButtonSegment(value: CategoryType.expense, icon: const Icon(Icons.arrow_upward), label: Text('type_expense_label'.tr())),
                  ],
                  selected: {_type},
                  onSelectionChanged: (s) {
                    setState(() {
                      _type = s.first;
                      if (_selectedParent != null && _selectedParent!.type != _type) _selectedParent = null;
                    });
                  },
                ),
                const SizedBox(height: 20),
                Text(
                  'parent_category'.tr(),
                  style: TextStyle(color: p.subtitleText, fontSize: 12),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<CategoryModel?>(
                  value: _selectedParent,
                  decoration: InputDecoration(
                    hintText: 'parent_category_none'.tr(),
                    filled: true,
                    fillColor: p.cardSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: [
                    DropdownMenuItem<CategoryModel?>(value: null, child: Text('parent_category_none'.tr())),
                    ..._parentOptions.map((c) => DropdownMenuItem<CategoryModel?>(value: c, child: Text(c.name))),
                  ],
                  onChanged: (c) => setState(() => _selectedParent = c),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading ? null : () { if (_formKey.currentState?.validate() ?? false) _save(); },
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: p.primaryAction))
                      : Text(isEdit ? 'update'.tr() : 'add_category'.tr()),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
