import 'package:intl/intl.dart';

final _fmt = NumberFormat.decimalPattern('fr');

/// { amount, currency } -> "5 250 FCFA"
String formatMoney(Map<String, dynamic>? m) {
  if (m == null) return '—';
  return '${_fmt.format(m['amount'])} FCFA';
}

int amountOf(Map<String, dynamic>? m) => (m?['amount'] as num?)?.toInt() ?? 0;
