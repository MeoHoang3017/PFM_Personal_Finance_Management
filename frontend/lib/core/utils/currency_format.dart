/// Định dạng số tiền: dấu phẩy nghìn (1,000,000) và tùy chọn thu gọn (1.2M).
/// Ví dụ: 1000000 → "1,000,000 ₫"; thu gọn: 12345678 → "12.3M ₫".

/// Ngưỡng số chữ số: từ ngưỡng này trở lên sẽ dùng dạng thu gọn (K/M)
const int kDefaultCompactThreshold = 7;

/// Thu gọn số: >= 1e6 → "1.2M", >= 1e3 → "1.5K", còn lại giữ nguyên.
String _compactValue(num value) {
  final abs = value.abs();
  if (abs >= 1000000) return '${(value / 1000000).toStringAsFixed(1)}M';
  if (abs >= 1000) return '${(value / 1000).toStringAsFixed(1)}K';
  return value.toInt().toString();
}

/// Định dạng số với dấu phẩy nghìn (ví dụ: 1234567.89 → "1,234,567").
String formatNumberWithCommas(num value, {int decimalDigits = 0}) {
  final parts = value.toStringAsFixed(decimalDigits).split('.');
  final intPart = parts[0];
  final decPart = decimalDigits > 0 && parts.length > 1 ? parts[1] : null;
  final neg = intPart.startsWith('-');
  final digits = neg ? intPart.substring(1) : intPart;
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write(',');
    buffer.write(digits[i]);
  }
  final formatted = (neg ? '-' : '') + buffer.toString();
  if (decPart != null && decPart.isNotEmpty) return '$formatted.$decPart';
  return formatted;
}

/// Định dạng tiền.
///
/// [amount]: số tiền (có thể âm).
/// [suffix]: chuỗi đơn vị (ví dụ: " ₫", " $"). Nếu không truyền, sẽ suy ra từ [currencyCode] (nếu có).
/// [compact]: nếu true thì ưu tiên dạng thu gọn (1.2M, 1.5K) khi số dài.
/// [compactThreshold]: số chữ số từ ngưỡng này trở lên sẽ thu gọn (mặc định 7).
///   Ví dụ: 1,000,000 có 7 chữ số → thu gọn thành "1.0M" nếu dùng ngưỡng 7.
String currencySymbolFromCode(String? code) {
  switch ((code ?? '').toUpperCase()) {
    case 'VND':
      return '₫';
    case 'USD':
      return r'$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
      return '¥';
    case 'CNY':
      return '¥';
    case 'KRW':
      return '₩';
    case 'INR':
      return '₹';
    case 'THB':
      return '฿';
    default:
      return (code != null && code.trim().isNotEmpty) ? code.toUpperCase() : '₫';
  }
}

String formatCurrency(
  num amount, {
  String? suffix,
  String? currencyCode,
  bool compact = false,
  int? compactThreshold,
}) {
  final threshold = compactThreshold ?? kDefaultCompactThreshold;
  final digitCount = amount.abs().toInt().toString().length;
  final useCompact = compact || digitCount >= threshold;
  final resolvedSuffix = suffix ?? ' ${currencySymbolFromCode(currencyCode)}';

  if (useCompact) {
    return _compactValue(amount) + resolvedSuffix;
  }
  return formatNumberWithCommas(amount) + resolvedSuffix;
}
