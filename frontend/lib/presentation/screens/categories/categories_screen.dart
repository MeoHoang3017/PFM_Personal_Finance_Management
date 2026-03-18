import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/category_models.dart';
import '../../../data/services/category_service.dart';
import 'category_form_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<CategoryModel> _categories = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      var res = await getIt<CategoryService>().getUserCategories();
      if (res.result == null || res.result!.isEmpty) {
        res = await getIt<CategoryService>().getCategories();
      }
      if (!mounted) return;
      setState(() {
        _categories = res.result ?? [];
        _loading = false;
        _error = res.isSuccess ? null : res.message;
      });
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _error = 'error_load_categories'.tr();
      });
    }
  }

  Future<void> _openForm([CategoryModel? category, CategoryModel? parent]) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => CategoryFormScreen(
          category: category,
          parentCategory: parent,
          allCategories: _categories,
        ),
      ),
    );
    if (result == true) _load();
  }

  Future<void> _confirmDelete(CategoryModel c) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('delete_category'.tr()),
        content: Text('delete_category_confirm'.tr(namedArgs: {'name': c.name})),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('cancel'.tr())),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            child: Text('delete'.tr()),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final res = await getIt<CategoryService>().deleteCategory(c.id);
    if (mounted) {
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, 'category_deleted'.tr());
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  String _typeLabel(CategoryType type) {
    return type == CategoryType.income ? 'type_income_label'.tr() : 'type_expense_label'.tr();
  }

  List<CategoryNode> _treeForType(CategoryType type) {
    final ofType = _categories.where((c) => c.type == type).toList();
    return CategoryNode.buildTree(ofType);
  }

  @override
  Widget build(BuildContext context) {
    final p = pfmPaletteOf(context);

    return Scaffold(
      backgroundColor: p.backgroundColor,
      appBar: AppBar(
        title: Text('categories'.tr()),
        backgroundColor: p.appBarBg,
        foregroundColor: p.primaryText,
        actions: [
          IconButton(icon: Icon(Icons.refresh, color: p.iconMuted), onPressed: _loading ? null : _load),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: p.primaryAction))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: TextStyle(color: p.errorColor)),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: _load, child: Text('retry'.tr())),
                    ],
                  ),
                )
              : _categories.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.category_outlined, size: 64, color: p.iconMuted),
                          const SizedBox(height: 16),
                          Text('no_categories'.tr(), style: TextStyle(color: p.primaryText, fontSize: 16)),
                          const SizedBox(height: 8),
                          FilledButton.icon(
                            onPressed: () => _openForm(),
                            icon: const Icon(Icons.add),
                            label: Text('add_category'.tr()),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: p.primaryAction,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        children: [
                          _buildSection(p, CategoryType.income),
                          const SizedBox(height: 20),
                          _buildSection(p, CategoryType.expense),
                        ],
                      ),
                    ),
      floatingActionButton: _categories.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => _openForm(),
              backgroundColor: p.primaryAction,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildSection(PaletteColors p, CategoryType type) {
    final tree = _treeForType(type);
    if (tree.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            _typeLabel(type),
            style: TextStyle(
              color: p.subtitleText,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        ...tree.map((node) => _buildNode(p, node, 0)),
      ],
    );
  }

  Widget _buildNode(PaletteColors p, CategoryNode node, int level) {
    final c = node.category;
    final hasChildren = node.children.isNotEmpty;
    const indent = 20.0;

    final tile = Material(
      color: p.cardSurface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () => _openForm(c),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.fromLTRB(16 + level * indent, 12, 8, 12),
          child: Row(
            children: [
              if (hasChildren)
                Icon(Icons.folder_outlined, color: p.primaryAction, size: 22)
              else
                Icon(Icons.label_outline, color: p.iconMuted, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(c.name, style: TextStyle(color: p.primaryText, fontWeight: FontWeight.w500, fontSize: 15)),
                    if (level > 0)
                      Text(
                        'category_sub_of'.tr(namedArgs: {'parent': _parentName(c.parentCategory) ?? '—'}),
                        style: TextStyle(color: p.subtitleText, fontSize: 11),
                      ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: Icon(Icons.more_vert, color: p.iconMuted, size: 20),
                onSelected: (v) {
                  if (v == 'edit') _openForm(c);
                  if (v == 'add_sub') _openForm(null, c);
                  if (v == 'delete') _confirmDelete(c);
                },
                itemBuilder: (ctx) => [
                  PopupMenuItem(value: 'edit', child: Text('edit'.tr())),
                  if (c.user != null && c.user!.isNotEmpty)
                    PopupMenuItem(value: 'add_sub', child: Text('add_sub_category'.tr())),
                  if (c.user != null && c.user!.isNotEmpty)
                    PopupMenuItem(value: 'delete', child: Text('delete'.tr())),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (!hasChildren) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: tile,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: tile,
        ),
        ...node.children.map((child) => _buildNode(p, child, level + 1)),
      ],
    );
  }

  String? _parentName(String? parentId) {
    if (parentId == null) return null;
    for (final c in _categories) {
      if (c.id == parentId) return c.name;
    }
    return null;
  }
}
