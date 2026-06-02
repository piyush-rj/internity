export type Currency = {
    code: string;
    symbol: string;
    name: string;
};

export const CURRENCIES: readonly Currency[] = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
    { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
    { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
    { code: "SEK", symbol: "kr", name: "Swedish Krona" },
    { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
    { code: "DKK", symbol: "kr", name: "Danish Krone" },
    { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
    { code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "PHP", symbol: "₱", name: "Philippine Peso" },
    { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
    { code: "KRW", symbol: "₩", name: "South Korean Won" },
    { code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
    { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
    { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
    { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
    { code: "NPR", symbol: "Rs", name: "Nepalese Rupee" },
    { code: "SAR", symbol: "ر.س", name: "Saudi Riyal" },
    { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal" },
    { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
    { code: "BHD", symbol: "ب.د", name: "Bahraini Dinar" },
    { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
    { code: "EGP", symbol: "£", name: "Egyptian Pound" },
    { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
    { code: "ARS", symbol: "$", name: "Argentine Peso" },
    { code: "CLP", symbol: "$", name: "Chilean Peso" },
    { code: "COP", symbol: "$", name: "Colombian Peso" },
    { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
    { code: "RUB", symbol: "₽", name: "Russian Ruble" },
    { code: "TRY", symbol: "₺", name: "Turkish Lira" },
    { code: "PLN", symbol: "zł", name: "Polish Złoty" },
    { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
    { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
    { code: "RON", symbol: "lei", name: "Romanian Leu" },
    { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
    { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
    { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
];

const SYMBOL_MAP = new Map(CURRENCIES.map((c) => [c.code, c.symbol]));

export function getCurrencySymbol(code: string): string {
    return SYMBOL_MAP.get(code) ?? code;
}

export function formatStipend(
    min: number | null,
    max: number | null,
    currencyCode?: string | null,
): string {
    const sym = getCurrencySymbol(currencyCode ?? "INR");
    const fmt = (n: number) => {
        if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
        return String(n);
    };
    if (min && max && min !== max) return `${sym}${fmt(min)}–${fmt(max)}`;
    const v = max ?? min;
    return v ? `${sym}${fmt(v)}` : "—";
}
