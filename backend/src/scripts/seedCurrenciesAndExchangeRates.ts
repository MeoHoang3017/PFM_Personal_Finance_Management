/**
 * Seed currencies (code, name, symbol). Tỷ giá exchange rate sẽ được fetch mỗi ngày qua scheduler/API.
 *
 * Chạy: npx tsx src/scripts/seedCurrenciesAndExchangeRates.ts
 * Hoặc: npm run seed:currencies
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/database";
import Currency from "../models/currency.model";

dotenv.config();

/** Map currency code -> { name, symbol } (ISO 4217 style) */
const CURRENCY_META: Record<string, { name: string; symbol: string }> = {
  USD: { name: "US Dollar", symbol: "$" },
  AED: { name: "UAE Dirham", symbol: "د.إ" },
  AFN: { name: "Afghan Afghani", symbol: "؋" },
  ALL: { name: "Albanian Lek", symbol: "L" },
  AMD: { name: "Armenian Dram", symbol: "֏" },
  ANG: { name: "Netherlands Antillean Guilder", symbol: "ƒ" },
  AOA: { name: "Angolan Kwanza", symbol: "Kz" },
  ARS: { name: "Argentine Peso", symbol: "$" },
  AUD: { name: "Australian Dollar", symbol: "A$" },
  AWG: { name: "Aruban Florin", symbol: "ƒ" },
  AZN: { name: "Azerbaijani Manat", symbol: "₼" },
  BAM: { name: "Bosnia-Herzegovina Convertible Mark", symbol: "KM" },
  BBD: { name: "Barbadian Dollar", symbol: "$" },
  BDT: { name: "Bangladeshi Taka", symbol: "৳" },
  BGN: { name: "Bulgarian Lev", symbol: "лв" },
  BHD: { name: "Bahraini Dinar", symbol: "د.ب" },
  BIF: { name: "Burundian Franc", symbol: "FBu" },
  BMD: { name: "Bermudian Dollar", symbol: "$" },
  BND: { name: "Brunei Dollar", symbol: "$" },
  BOB: { name: "Bolivian Boliviano", symbol: "Bs" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  BSD: { name: "Bahamian Dollar", symbol: "$" },
  BTN: { name: "Bhutanese Ngultrum", symbol: "Nu." },
  BWP: { name: "Botswana Pula", symbol: "P" },
  BYN: { name: "Belarusian Ruble", symbol: "Br" },
  BZD: { name: "Belize Dollar", symbol: "BZ$" },
  CAD: { name: "Canadian Dollar", symbol: "C$" },
  CDF: { name: "Congolese Franc", symbol: "FC" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  CLF: { name: "Chilean Unit of Account", symbol: "CLF" },
  CLP: { name: "Chilean Peso", symbol: "$" },
  CNH: { name: "Chinese Yuan (Offshore)", symbol: "¥" },
  CNY: { name: "Chinese Yuan", symbol: "¥" },
  COP: { name: "Colombian Peso", symbol: "$" },
  CRC: { name: "Costa Rican Colón", symbol: "₡" },
  CUP: { name: "Cuban Peso", symbol: "$" },
  CVE: { name: "Cape Verdean Escudo", symbol: "$" },
  CZK: { name: "Czech Koruna", symbol: "Kč" },
  DJF: { name: "Djiboutian Franc", symbol: "Fdj" },
  DKK: { name: "Danish Krone", symbol: "kr" },
  DOP: { name: "Dominican Peso", symbol: "RD$" },
  DZD: { name: "Algerian Dinar", symbol: "د.ج" },
  EGP: { name: "Egyptian Pound", symbol: "E£" },
  ERN: { name: "Eritrean Nakfa", symbol: "Nfk" },
  ETB: { name: "Ethiopian Birr", symbol: "Br" },
  EUR: { name: "Euro", symbol: "€" },
  FJD: { name: "Fijian Dollar", symbol: "FJ$" },
  FKP: { name: "Falkland Islands Pound", symbol: "£" },
  FOK: { name: "Faroese Króna", symbol: "kr" },
  GBP: { name: "British Pound Sterling", symbol: "£" },
  GEL: { name: "Georgian Lari", symbol: "₾" },
  GGP: { name: "Guernsey Pound", symbol: "£" },
  GHS: { name: "Ghanaian Cedi", symbol: "₵" },
  GIP: { name: "Gibraltar Pound", symbol: "£" },
  GMD: { name: "Gambian Dalasi", symbol: "D" },
  GNF: { name: "Guinean Franc", symbol: "FG" },
  GTQ: { name: "Guatemalan Quetzal", symbol: "Q" },
  GYD: { name: "Guyanese Dollar", symbol: "G$" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$" },
  HNL: { name: "Honduran Lempira", symbol: "L" },
  HRK: { name: "Croatian Kuna", symbol: "kn" },
  HTG: { name: "Haitian Gourde", symbol: "G" },
  HUF: { name: "Hungarian Forint", symbol: "Ft" },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp" },
  ILS: { name: "Israeli New Shekel", symbol: "₪" },
  IMP: { name: "Manx Pound", symbol: "£" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  IQD: { name: "Iraqi Dinar", symbol: "ع.د" },
  IRR: { name: "Iranian Rial", symbol: "﷼" },
  ISK: { name: "Icelandic Króna", symbol: "kr" },
  JEP: { name: "Jersey Pound", symbol: "£" },
  JMD: { name: "Jamaican Dollar", symbol: "J$" },
  JOD: { name: "Jordanian Dinar", symbol: "د.ا" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  KES: { name: "Kenyan Shilling", symbol: "KSh" },
  KGS: { name: "Kyrgyzstani Som", symbol: "с" },
  KHR: { name: "Cambodian Riel", symbol: "៛" },
  KID: { name: "Kiribati Dollar", symbol: "$" },
  KMF: { name: "Comorian Franc", symbol: "CF" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  KWD: { name: "Kuwaiti Dinar", symbol: "د.ك" },
  KYD: { name: "Cayman Islands Dollar", symbol: "CI$" },
  KZT: { name: "Kazakhstani Tenge", symbol: "₸" },
  LAK: { name: "Laotian Kip", symbol: "₭" },
  LBP: { name: "Lebanese Pound", symbol: "ل.ل" },
  LKR: { name: "Sri Lankan Rupee", symbol: "Rs" },
  LRD: { name: "Liberian Dollar", symbol: "L$" },
  LSL: { name: "Lesotho Loti", symbol: "L" },
  LYD: { name: "Libyan Dinar", symbol: "ل.د" },
  MAD: { name: "Moroccan Dirham", symbol: "د.م." },
  MDL: { name: "Moldovan Leu", symbol: "L" },
  MGA: { name: "Malagasy Ariary", symbol: "Ar" },
  MKD: { name: "Macedonian Denar", symbol: "ден" },
  MMK: { name: "Myanmar Kyat", symbol: "K" },
  MNT: { name: "Mongolian Tugrik", symbol: "₮" },
  MOP: { name: "Macanese Pataca", symbol: "MOP$" },
  MRU: { name: "Mauritanian Ouguiya", symbol: "UM" },
  MUR: { name: "Mauritian Rupee", symbol: "₨" },
  MVR: { name: "Maldivian Rufiyaa", symbol: "Rf" },
  MWK: { name: "Malawian Kwacha", symbol: "MK" },
  MXN: { name: "Mexican Peso", symbol: "MX$" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM" },
  MZN: { name: "Mozambican Metical", symbol: "MT" },
  NAD: { name: "Namibian Dollar", symbol: "N$" },
  NGN: { name: "Nigerian Naira", symbol: "₦" },
  NIO: { name: "Nicaraguan Córdoba", symbol: "C$" },
  NOK: { name: "Norwegian Krone", symbol: "kr" },
  NPR: { name: "Nepalese Rupee", symbol: "₨" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$" },
  OMR: { name: "Omani Rial", symbol: "ر.ع." },
  PAB: { name: "Panamanian Balboa", symbol: "B/." },
  PEN: { name: "Peruvian Sol", symbol: "S/." },
  PGK: { name: "Papua New Guinean Kina", symbol: "K" },
  PHP: { name: "Philippine Peso", symbol: "₱" },
  PKR: { name: "Pakistani Rupee", symbol: "₨" },
  PLN: { name: "Polish Złoty", symbol: "zł" },
  PYG: { name: "Paraguayan Guaraní", symbol: "₲" },
  QAR: { name: "Qatari Riyal", symbol: "ر.ق" },
  RON: { name: "Romanian Leu", symbol: "lei" },
  RSD: { name: "Serbian Dinar", symbol: "дин." },
  RUB: { name: "Russian Ruble", symbol: "₽" },
  RWF: { name: "Rwandan Franc", symbol: "FRw" },
  SAR: { name: "Saudi Riyal", symbol: "ر.س" },
  SBD: { name: "Solomon Islands Dollar", symbol: "SI$" },
  SCR: { name: "Seychellois Rupee", symbol: "₨" },
  SDG: { name: "Sudanese Pound", symbol: "ج.س." },
  SEK: { name: "Swedish Krona", symbol: "kr" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  SHP: { name: "Saint Helena Pound", symbol: "£" },
  SLE: { name: "Sierra Leonean Leone", symbol: "Le" },
  SLL: { name: "Sierra Leonean Leone (old)", symbol: "Le" },
  SOS: { name: "Somali Shilling", symbol: "Sh" },
  SRD: { name: "Surinamese Dollar", symbol: "$" },
  SSP: { name: "South Sudanese Pound", symbol: "£" },
  STN: { name: "São Tomé and Príncipe Dobra", symbol: "Db" },
  SYP: { name: "Syrian Pound", symbol: "£S" },
  SZL: { name: "Swazi Lilangeni", symbol: "L" },
  THB: { name: "Thai Baht", symbol: "฿" },
  TJS: { name: "Tajikistani Somoni", symbol: "SM" },
  TMT: { name: "Turkmenistani Manat", symbol: "m" },
  TND: { name: "Tunisian Dinar", symbol: "د.ت" },
  TOP: { name: "Tongan Paʻanga", symbol: "T$" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  TTD: { name: "Trinidad and Tobago Dollar", symbol: "TT$" },
  TVD: { name: "Tuvaluan Dollar", symbol: "$" },
  TWD: { name: "New Taiwan Dollar", symbol: "NT$" },
  TZS: { name: "Tanzanian Shilling", symbol: "TSh" },
  UAH: { name: "Ukrainian Hryvnia", symbol: "₴" },
  UGX: { name: "Ugandan Shilling", symbol: "USh" },
  UYU: { name: "Uruguayan Peso", symbol: "$U" },
  UZS: { name: "Uzbekistani Som", symbol: "so'm" },
  VES: { name: "Venezuelan Bolívar Soberano", symbol: "Bs.S" },
  VND: { name: "Vietnamese Dong", symbol: "₫" },
  VUV: { name: "Vanuatu Vatu", symbol: "VT" },
  WST: { name: "Samoan Tala", symbol: "WS$" },
  XAF: { name: "Central African CFA Franc", symbol: "FCFA" },
  XCD: { name: "East Caribbean Dollar", symbol: "EC$" },
  XCG: { name: "Caribbean Guilder", symbol: "ƒ" },
  XDR: { name: "Special Drawing Rights", symbol: "XDR" },
  XOF: { name: "West African CFA Franc", symbol: "CFA" },
  XPF: { name: "CFP Franc", symbol: "₣" },
  YER: { name: "Yemeni Rial", symbol: "﷼" },
  ZAR: { name: "South African Rand", symbol: "R" },
  ZMW: { name: "Zambian Kwacha", symbol: "ZK" },
  ZWG: { name: "Zimbabwean Dollar", symbol: "Z$" },
  ZWL: { name: "Zimbabwean Dollar (2009)", symbol: "Z$" },
};

/** Currency codes that use 0 decimal places (no minor unit) */
const ZERO_DECIMAL_CODES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

export async function runSeedCurrenciesAndExchangeRates(): Promise<void> {
  const codes = Object.keys(CURRENCY_META);
  let created = 0;
  let updated = 0;

  for (const code of codes) {
    const meta = CURRENCY_META[code]!;
    const name = meta.name;
    const symbol = meta.symbol;
    const decimalPlaces = ZERO_DECIMAL_CODES.has(code) ? 0 : 2;

    const existing = await Currency.findOne({ code });
    if (existing) {
      await Currency.updateOne(
        { code },
        { $set: { name, symbol, decimalPlaces } }
      );
      updated++;
    } else {
      await Currency.create({ code, name, symbol, decimalPlaces });
      created++;
    }
  }

  console.log(`[Seed Currencies] Created: ${created}, Updated: ${updated}, Total codes: ${codes.length}. Exchange rates will be fetched daily by scheduler.`);
}

async function main() {
  await connectDB();
  await runSeedCurrenciesAndExchangeRates();
  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
