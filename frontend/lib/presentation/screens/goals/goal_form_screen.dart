import 'package:flutter/material.dart';

import '../../../core/di/injection.dart';
import '../../../core/utils/app_toast.dart';
import '../../../data/models/auth_models.dart';
import '../../../data/models/goal_models.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/goal_service.dart';

class GoalFormScreen extends StatefulWidget {
  final GoalModel? goal;

  const GoalFormScreen({super.key, this.goal});

  @override
  State<GoalFormScreen> createState() => _GoalFormScreenState();
}

class _GoalFormScreenState extends State<GoalFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _targetController = TextEditingController();
  final _currentController = TextEditingController(text: '0');
  DateTime _dueDate = DateTime.now().add(const Duration(days: 365));
  bool _loading = false;
  String? _errorMessage;
  UserInfo? _user;

  @override
  void initState() {
    super.initState();
    if (widget.goal != null) {
      _titleController.text = widget.goal!.title;
      _targetController.text = widget.goal!.targetAmount.toStringAsFixed(0);
      _currentController.text = widget.goal!.currentAmount.toStringAsFixed(0);
      _dueDate = widget.goal!.dueDate;
    }
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await getIt<AuthService>().getStoredUser();
    if (mounted) setState(() => _user = user);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _targetController.dispose();
    _currentController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_user == null) {
      setState(() => _errorMessage = 'Chưa đăng nhập');
      return;
    }
    final target = double.tryParse(_targetController.text.replaceAll(',', '')) ?? 0;
    final current = double.tryParse(_currentController.text.replaceAll(',', '')) ?? 0;
    setState(() {
      _errorMessage = null;
      _loading = true;
    });
    try {
      final svc = getIt<GoalService>();
      if (widget.goal != null) {
        final res = await svc.updateGoal(
          widget.goal!.id,
          UpdateGoalData(
            title: _titleController.text.trim(),
            targetAmount: target,
            currentAmount: current,
            dueDate: _dueDate,
          ),
        );
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'Đã cập nhật mục tiêu');
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await svc.createGoal(CreateGoalData(
          title: _titleController.text.trim(),
          targetAmount: target,
          currentAmount: current,
          dueDate: _dueDate,
          user: _user!.id,
        ));
        if (!mounted) return;
        setState(() => _loading = false);
        if (res.isSuccess) {
          Navigator.pop(context, true);
          AppToast.showSuccess(context, 'Đã thêm mục tiêu');
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
    final isEdit = widget.goal != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Sửa mục tiêu' : 'Thêm mục tiêu'),
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
                  controller: _titleController,
                  decoration: const InputDecoration(
                    labelText: 'Tên mục tiêu',
                    hintText: 'Mua xe, Du lịch...',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Nhập tên mục tiêu' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _targetController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Số tiền mục tiêu',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Nhập số tiền';
                    if (double.tryParse(v.replaceAll(',', '')) == null) return 'Số không hợp lệ';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _currentController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Đã tiết kiệm',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  title: const Text('Hạn đến'),
                  subtitle: Text('${_dueDate.day}/${_dueDate.month}/${_dueDate.year}'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final d = await showDatePicker(
                      context: context,
                      initialDate: _dueDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime(2100),
                    );
                    if (d != null) setState(() => _dueDate = d);
                  },
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
                      : Text(isEdit ? 'Cập nhật' : 'Thêm mục tiêu'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
