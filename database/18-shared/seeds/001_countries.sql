-- ============================================================================
-- File       : 001_countries.sql
-- Module     : Shared
-- Purpose    : Seed ISO-3166 countries (major markets + regional focus).
-- Depends On : countries
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO countries (iso2, iso3, numeric_code, name, native_name, phone_code, currency_code, continent, flag_emoji, display_order)
VALUES
    ('IN', 'IND', 356, 'India', 'भारत', '+91', 'INR', 'Asia', '🇮🇳', 1),
    ('US', 'USA', 840, 'United States', 'United States', '+1', 'USD', 'North America', '🇺🇸', 2),
    ('AE', 'ARE', 784, 'United Arab Emirates', 'الإمارات العربية المتحدة', '+971', 'AED', 'Asia', '🇦🇪', 3),
    ('GB', 'GBR', 826, 'United Kingdom', 'United Kingdom', '+44', 'GBP', 'Europe', '🇬🇧', 4),
    ('AU', 'AUS', 36, 'Australia', 'Australia', '+61', 'AUD', 'Oceania', '🇦🇺', 5),
    ('CA', 'CAN', 124, 'Canada', 'Canada', '+1', 'CAD', 'North America', '🇨🇦', 6),
    ('SG', 'SGP', 702, 'Singapore', 'Singapore', '+65', 'SGD', 'Asia', '🇸🇬', 7),
    ('MY', 'MYS', 458, 'Malaysia', 'Malaysia', '+60', 'MYR', 'Asia', '🇲🇾', 8),
    ('SA', 'SAU', 682, 'Saudi Arabia', 'المملكة العربية السعودية', '+966', 'SAR', 'Asia', '🇸🇦', 9),
    ('QA', 'QAT', 634, 'Qatar', 'قطر', '+974', 'QAR', 'Asia', '🇶🇦', 10),
    ('KW', 'KWT', 414, 'Kuwait', 'الكويت', '+965', 'KWD', 'Asia', '🇰🇼', 11),
    ('OM', 'OMN', 512, 'Oman', 'عُمان', '+968', 'OMR', 'Asia', '🇴🇲', 12),
    ('BH', 'BHR', 48, 'Bahrain', 'البحرين', '+973', 'BHD', 'Asia', '🇧🇭', 13),
    ('EG', 'EGY', 818, 'Egypt', 'مصر', '+20', 'EGP', 'Africa', '🇪🇬', 14),
    ('NG', 'NGA', 566, 'Nigeria', 'Nigeria', '+234', 'NGN', 'Africa', '🇳🇬', 15),
    ('ZA', 'ZAF', 710, 'South Africa', 'South Africa', '+27', 'ZAR', 'Africa', '🇿🇦', 16),
    ('KE', 'KEN', 404, 'Kenya', 'Kenya', '+254', 'KES', 'Africa', '🇰🇪', 17),
    ('DE', 'DEU', 276, 'Germany', 'Deutschland', '+49', 'EUR', 'Europe', '🇩🇪', 18),
    ('FR', 'FRA', 250, 'France', 'France', '+33', 'EUR', 'Europe', '🇫🇷', 19),
    ('IT', 'ITA', 380, 'Italy', 'Italia', '+39', 'EUR', 'Europe', '🇮🇹', 20),
    ('ES', 'ESP', 724, 'Spain', 'España', '+34', 'EUR', 'Europe', '🇪🇸', 21),
    ('NL', 'NLD', 528, 'Netherlands', 'Nederland', '+31', 'EUR', 'Europe', '🇳🇱', 22),
    ('SE', 'SWE', 752, 'Sweden', 'Sverige', '+46', 'SEK', 'Europe', '🇸🇪', 23),
    ('NO', 'NOR', 578, 'Norway', 'Norge', '+47', 'NOK', 'Europe', '🇳🇴', 24),
    ('CH', 'CHE', 756, 'Switzerland', 'Schweiz', '+41', 'CHF', 'Europe', '🇨🇭', 25),
    ('JP', 'JPN', 392, 'Japan', '日本', '+81', 'JPY', 'Asia', '🇯🇵', 26),
    ('CN', 'CHN', 156, 'China', '中国', '+86', 'CNY', 'Asia', '🇨🇳', 27),
    ('KR', 'KOR', 410, 'South Korea', '대한민국', '+82', 'KRW', 'Asia', '🇰🇷', 28),
    ('BR', 'BRA', 76, 'Brazil', 'Brasil', '+55', 'BRL', 'South America', '🇧🇷', 29),
    ('NZ', 'NZL', 554, 'New Zealand', 'New Zealand', '+64', 'NZD', 'Oceania', '🇳🇿', 30),
    ('PK', 'PAK', 586, 'Pakistan', 'پاکستان', '+92', 'PKR', 'Asia', '🇵🇰', 31),
    ('BD', 'BGD', 50, 'Bangladesh', 'বাংলাদেশ', '+880', 'BDT', 'Asia', '🇧🇩', 32),
    ('LK', 'LKA', 144, 'Sri Lanka', 'ශ්‍රී ලංකාව', '+94', 'LKR', 'Asia', '🇱🇰', 33),
    ('NP', 'NPL', 524, 'Nepal', 'नेपाल', '+977', 'NPR', 'Asia', '🇳🇵', 34),
    ('TR', 'TUR', 792, 'Turkey', 'Türkiye', '+90', 'TRY', 'Europe', '🇹🇷', 35),
    ('RU', 'RUS', 643, 'Russia', 'Россия', '+7', 'RUB', 'Europe', '🇷🇺', 36),
    ('HK', 'HKG', 344, 'Hong Kong', '香港', '+852', 'HKD', 'Asia', '🇭🇰', 37),
    ('TH', 'THA', 764, 'Thailand', 'ประเทศไทย', '+66', 'THB', 'Asia', '🇹🇭', 38),
    ('PH', 'PHL', 608, 'Philippines', 'Philippines', '+63', 'PHP', 'Asia', '🇵🇭', 39),
    ('ID', 'IDN', 360, 'Indonesia', 'Indonesia', '+62', 'IDR', 'Asia', '🇮🇩', 40),
    ('VN', 'VNM', 704, 'Vietnam', 'Việt Nam', '+84', 'VND', 'Asia', '🇻🇳', 41)
ON CONFLICT (iso2) DO NOTHING;
