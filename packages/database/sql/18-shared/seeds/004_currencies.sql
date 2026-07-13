-- ============================================================================
-- File       : 004_currencies.sql
-- Module     : Shared
-- Purpose    : Seed ISO 4217 currencies for primary markets.
-- Depends On : currencies
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO currencies (code, numeric_code, name, symbol, symbol_native, decimal_places, is_default, display_order)
VALUES
    ('INR', 356, 'Indian Rupee', '₹', '₹', 2, true, 1),
    ('USD', 840, 'US Dollar', '$', '$', 2, false, 2),
    ('AED', 784, 'UAE Dirham', 'د.إ', 'د.إ', 2, false, 3),
    ('GBP', 826, 'British Pound', '£', '£', 2, false, 4),
    ('EUR', 978, 'Euro', '€', '€', 2, false, 5),
    ('AUD', 36, 'Australian Dollar', 'A$', 'A$', 2, false, 6),
    ('CAD', 124, 'Canadian Dollar', 'C$', 'C$', 2, false, 7),
    ('SGD', 702, 'Singapore Dollar', 'S$', 'S$', 2, false, 8),
    ('MYR', 458, 'Malaysian Ringgit', 'RM', 'RM', 2, false, 9),
    ('SAR', 682, 'Saudi Riyal', '﷼', '﷼', 2, false, 10),
    ('QAR', 634, 'Qatari Riyal', '﷼', '﷼', 2, false, 11),
    ('KWD', 414, 'Kuwaiti Dinar', 'د.ك', 'د.ك', 3, false, 12),
    ('OMR', 512, 'Omani Rial', '﷼', '﷼', 3, false, 13),
    ('BHD', 48, 'Bahraini Dinar', '.د.ب', '.د.ب', 3, false, 14),
    ('EGP', 818, 'Egyptian Pound', '£', 'ج.م', 2, false, 15),
    ('NGN', 566, 'Nigerian Naira', '₦', '₦', 2, false, 16),
    ('ZAR', 710, 'South African Rand', 'R', 'R', 2, false, 17),
    ('KES', 404, 'Kenyan Shilling', 'KSh', 'KSh', 2, false, 18),
    ('JPY', 392, 'Japanese Yen', '¥', '¥', 0, false, 19),
    ('CNY', 156, 'Chinese Yuan', '¥', '¥', 2, false, 20),
    ('KRW', 410, 'South Korean Won', '₩', '₩', 0, false, 21),
    ('BRL', 986, 'Brazilian Real', 'R$', 'R$', 2, false, 22),
    ('CHF', 756, 'Swiss Franc', 'Fr', 'Fr.', 2, false, 23),
    ('SEK', 752, 'Swedish Krona', 'kr', 'kr', 2, false, 24),
    ('NOK', 578, 'Norwegian Krone', 'kr', 'kr', 2, false, 25),
    ('TRY', 949, 'Turkish Lira', '₺', '₺', 2, false, 26),
    ('RUB', 643, 'Russian Ruble', '₽', '₽', 2, false, 27),
    ('HKD', 344, 'Hong Kong Dollar', 'HK$', 'HK$', 2, false, 28),
    ('THB', 764, 'Thai Baht', '฿', '฿', 2, false, 29),
    ('PHP', 608, 'Philippine Peso', '₱', '₱', 2, false, 30),
    ('IDR', 360, 'Indonesian Rupiah', 'Rp', 'Rp', 2, false, 31),
    ('PKR', 586, 'Pakistani Rupee', '₨', '₨', 2, false, 32),
    ('BDT', 50, 'Bangladeshi Taka', '৳', '৳', 2, false, 33),
    ('LKR', 144, 'Sri Lankan Rupee', '₨', 'රු.', 2, false, 34),
    ('NPR', 524, 'Nepalese Rupee', '₨', 'रु.', 2, false, 35),
    ('VND', 704, 'Vietnamese Dong', '₫', '₫', 0, false, 36),
    ('NZD', 554, 'New Zealand Dollar', 'NZ$', 'NZ$', 2, false, 37)
ON CONFLICT (code) DO NOTHING;
