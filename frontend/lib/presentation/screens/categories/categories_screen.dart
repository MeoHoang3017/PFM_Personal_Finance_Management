import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
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
        _error = 'Không tải được danh sách danh mục';
      });
    }
  }

  Future<void> _openForm([CategoryModel? category]) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => CategoryFormScreen(category: category),
      ),
    );
    if (result == true) _load();
  }

  Future<void> _confirmDelete(CategoryModel c) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xóa danh mục'),
        content: Text('Bạn có chắc muốn xóa danh mục "${c.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final res = await getIt<CategoryService>().deleteCategory(c.id);
    if (mounted) {
      if (res.isSuccess) {
        _load();
        AppToast.showSuccess(context, 'Đã xóa danh mục');
      } else {
        AppToast.showError(context, res.message);
      }
    }
  }

  String _typeLabel(CategoryType type) {
    return type == CategoryType.income ? 'Thu nhập' : 'Chi tiêu';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản lý danh mục'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loading ? null : _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: _load, child: const Text('Thử lại')),
                    ],
                  ),
                )
              : _categories.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.category_outlined, size: 64, color: Theme.of(context).colorScheme.outline),
                          const SizedBox(height: 16),
                          Text('Chưa có danh mục nào', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 8),
                          FilledButton.icon(
                            onPressed: () => _openForm(),
                            icon: const Icon(Icons.add),
                            label: const Text('Thêm danh mục'),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _categories.length,
                        itemBuilder: (context, index) {
                          final c = _categories[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              title: Text(c.name),
                              subtitle: Text(_typeLabel(c.type)),
                              trailing: PopupMenuButton<String>(
                                onSelected: (v) {
                                  if (v == 'edit') _openForm(c);
                                  if (v == 'delete') _confirmDelete(c);
                                },
                                itemBuilder: (ctx) => [
                                  const PopupMenuItem(value: 'edit', child: Text('Sửa')),
                                  const PopupMenuItem(value: 'delete', child: Text('Xóa')),
                                ],
                              ),
                              onTap: () => _openForm(c),
                            ),
                          );
                        },
                      ),
                    ),
      floatingActionButton: _categories.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => _openForm(),
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}
