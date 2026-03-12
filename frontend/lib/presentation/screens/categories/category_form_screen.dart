import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/category_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/category_service.dart';

class CategoryFormScreen extends StatefulWidget {
  final CategoryModel? category;

  const CategoryFormScreen({super.key, this.category});

  @override
  State<CategoryFormScreen> createState() => _CategoryFormScreenState();
}

class _CategoryFormScreenState extends State<CategoryFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  CategoryType _type = CategoryType.expense;
  bool _loading = false;
  String? _errorMessage;
  UserInfo? _user;

  @override
  void initState() {
    super.initState();
    if (widget.category != null) {
      _nameController.text = widget.category!.name;
      _type = widget.category!.type;
    }
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await getIt<AuthService>().getStoredUser();
    if (mounted) setState(() => _user = user);
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_user == null) {
      setState(() => _errorMessage = 'Chưa đăng nhập');
      return;
    }
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final svc = getIt<CategoryService>();
      if (widget.category != null) {
        final res = await svc.updateCategory(
          widget.category!.id,
          UpdateCategoryData(name: _nameController.text.trim(), type: _type),
        );
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'Đã cập nhật danh mục');
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await svc.createCategory(CreateCategoryData(
          name: _nameController.text.trim(),
          type: _type,
          user: _user!.id,
        ));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'Đã thêm danh mục');
        } else {
          setState(() => _errorMessage = res.message);
        }
      }
    } catch (_) {
      if (mounted) setState(() {
        _loading = false;
        _errorMessage = 'Lỗi kết nối';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.category != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Sửa danh mục' : 'Thêm danh mục'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_errorMessage!, style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer)),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Tên danh mục',
                    hintText: 'Ăn uống, Lương...',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Nhập tên danh mục' : null,
                ),
                const SizedBox(height: 16),
                SegmentedButton<CategoryType>(
                  segments: const [
                    ButtonSegment(value: CategoryType.income, icon: Icon(Icons.arrow_downward), label: Text('Thu nhập')),
                    ButtonSegment(value: CategoryType.expense, icon: Icon(Icons.arrow_upward), label: Text('Chi tiêu')),
                  ],
                  selected: {_type},
                  onSelectionChanged: (s) => setState(() => _type = s.first),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _loading
                      ? null
                      : () {
                          if (_formKey.currentState?.validate() ?? false) _save();
                        },
                  child: _loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(isEdit ? 'Cập nhật' : 'Thêm danh mục'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
