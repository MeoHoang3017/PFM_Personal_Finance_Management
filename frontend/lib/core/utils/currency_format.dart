/// Định dạng số tiền: dấu phẩy nghìn (1,000,000) và tùy chọn thu gọn (1.2M).
/// Ví dụ: 1000000 → "1,000,000 ₫"; thu gọn: 12345678 → "12.3M ₫".

/// Ngưỡng số chữ số: từ ngưỡng này trở lên sẽ dùng dạng thu gọn (K/M)
const int kDefaultCompactThreshold = 7;

/// Khi [formatCurrency] được gọi với `compact: false`, vẫn có thể thu gọn nếu đủ dài
/// trừ khi đặt ngưỡng rất lớn — dùng cho màn chi tiết cần đủ chữ số.
const int kNoAutoCompactByLengthThreshold = 4096;

String _trimTrailingFractionZeros(String coreWithPossibleDot) {
  final dot = coreWithPossibleDot.lastIndexOf('.');
  if (dot == -1) return coreWithPossibleDot;
  final intPart = coreWithPossibleDot.substring(0, dot);
  var frac = coreWithPossibleDot.substring(dot + 1).replaceFirst(RegExp(r'0+$'), '');
  return frac.isEmpty ? intPart : '$intPart.$frac';
}

/// Thu gọn số: >= 1e6 → "1.2M", >= 1e3 → "1.5K"; phần hệ số tối đa [maxFractionDigits] chữ số thập phân.
String _compactValue(num value, {int maxFractionDigits = 2}) {
  final abs = value.abs();
  final fd = maxFractionDigits.clamp(0, 2);
  if (fd == 0) {
    if (abs >= 1000000) return '${(value / 1000000).round()}M';
    if (abs >= 1000) return '${(value / 1000).round()}K';
    return formatNumberWithCommas(value, decimalDigits: 0);
  }
  if (abs >= 1000000) {
    return '${_trimTrailingFractionZeros((value / 1000000).toStringAsFixed(fd))}M';
  }
  if (abs >= 1000) {
    return '${_trimTrailingFractionZeros((value / 1000).toStringAsFixed(fd))}K';
  }
  return formatAmountForDisplay(value, maxFractionDigits: fd);
}

/// Số tiền đầy đủ: dấu phẩy nghìn, tối đa [maxFractionDigits] phần thập phân (bỏ số 0 thừa).
String formatAmountForDisplay(num amount, {int maxFractionDigits = 2}) {
  if (maxFractionDigits <= 0) {
    return formatNumberWithCommas(amount, decimalDigits: 0);
  }
  var core = formatNumberWithCommas(amount, decimalDigits: maxFractionDigits);
  final dot = core.lastIndexOf('.');
  if (dot == -1) return core;
  final intS = core.substring(0, dot);
  var frac = core.substring(dot + 1).replaceFirst(RegExp(r'0+$'), '');
  return frac.isEmpty ? intS : '$intS.$frac';
}

/// Hiển thị phần trăm (giá trị đã là 0–100), tối đa [maxFractionDigits] chữ sau dấu phẩy.
String formatPercentageDisplay(
  num percent, {
  int maxFractionDigits = 2,
  double maxClamp = 999,
}) {
  final v = percent.toDouble().clamp(0.0, maxClamp);
  if (maxFractionDigits <= 0) {
    return '${v.round()}%';
  }
  return '${_trimTrailingFractionZeros(v.toStringAsFixed(maxFractionDigits))}%';
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
  int maxFractionDigits = 2,
}) {
  final threshold = compactThreshold ?? kDefaultCompactThreshold;
  final digitCount = amount.abs().toInt().toString().length;
  final useCompact = compact || digitCount >= threshold;
  final resolvedSuffix = suffix ?? ' ${currencySymbolFromCode(currencyCode)}';

  if (useCompact) {
    return _compactValue(amount, maxFractionDigits: maxFractionDigits) + resolvedSuffix;
  }
  return formatAmountForDisplay(amount, maxFractionDigits: maxFractionDigits) + resolvedSuffix;
}

/// Tiền dạng **tóm tắt** (header tổng quan, tổng thu/chi tháng, ví trong danh sách ngắn, biểu đồ):
/// cho phép thu gọn K/M khi số dài — thống nhất trên Home và tab Giao dịch.
String formatCurrencyAggregates(
  num amount, {
  String? suffix,
  String? currencyCode,
  int maxFractionDigits = 2,
}) {
  return formatCurrency(
    amount,
    suffix: suffix,
    currencyCode: currencyCode,
    compact: true,
    maxFractionDigits: maxFractionDigits,
  );
}

/// Tiền dạng **dòng chi tiết** (từng giao dịch, ngân sách đã chi / hạn mức, số dư ví ở màn danh sách đầy đủ):
/// luôn đủ chữ số + dấu phẩy nghìn, không thu gọn (kể cả số rất lớn).
String formatCurrencyRows(
  num amount, {
  String? suffix,
  String? currencyCode,
  int maxFractionDigits = 2,
}) {
  return formatCurrency(
    amount,
    suffix: suffix,
    currencyCode: currencyCode,
    compact: false,
    compactThreshold: kNoAutoCompactByLengthThreshold,
    maxFractionDigits: maxFractionDigits,
  );
}
