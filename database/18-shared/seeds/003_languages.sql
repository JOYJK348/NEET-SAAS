-- ============================================================================
-- File       : 003_languages.sql
-- Module     : Shared
-- Purpose    : Seed ISO 639 languages (primary markets + regional languages).
-- Depends On : languages
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO languages (code, iso_639_1, iso_639_2, name, native_name, is_rtl, display_order)
VALUES
    ('en', 'en', 'eng', 'English', 'English', false, 1),
    ('hi', 'hi', 'hin', 'Hindi', 'हिन्दी', false, 2),
    ('ta', 'ta', 'tam', 'Tamil', 'தமிழ்', false, 3),
    ('te', 'te', 'tel', 'Telugu', 'తెలుగు', false, 4),
    ('bn', 'bn', 'ben', 'Bengali', 'বাংলা', false, 5),
    ('mr', 'mr', 'mar', 'Marathi', 'मराठी', false, 6),
    ('gu', 'gu', 'guj', 'Gujarati', 'ગુજરાતી', false, 7),
    ('kn', 'kn', 'kan', 'Kannada', 'ಕನ್ನಡ', false, 8),
    ('ml', 'ml', 'mal', 'Malayalam', 'മലയാളം', false, 9),
    ('pa', 'pa', 'pan', 'Punjabi', 'ਪੰਜਾਬੀ', false, 10),
    ('or', 'or', 'ori', 'Odia', 'ଓଡ଼ିଆ', false, 11),
    ('as', 'as', 'asm', 'Assamese', 'অসমীয়া', false, 12),
    ('ur', 'ur', 'urd', 'Urdu', 'اردو', true, 13),
    ('ar', 'ar', 'ara', 'Arabic', 'العربية', true, 14),
    ('fr', 'fr', 'fra', 'French', 'Français', false, 15),
    ('es', 'es', 'spa', 'Spanish', 'Español', false, 16),
    ('pt', 'pt', 'por', 'Portuguese', 'Português', false, 17),
    ('de', 'de', 'deu', 'German', 'Deutsch', false, 18),
    ('zh', 'zh', 'zho', 'Chinese', '中文', false, 19),
    ('ja', 'ja', 'jpn', 'Japanese', '日本語', false, 20),
    ('ko', 'ko', 'kor', 'Korean', '한국어', false, 21),
    ('ru', 'ru', 'rus', 'Russian', 'Русский', false, 22),
    ('tr', 'tr', 'tur', 'Turkish', 'Türkçe', false, 23),
    ('nl', 'nl', 'nld', 'Dutch', 'Nederlands', false, 24),
    ('it', 'it', 'ita', 'Italian', 'Italiano', false, 25),
    ('th', 'th', 'tha', 'Thai', 'ไทย', false, 26),
    ('vi', 'vi', 'vie', 'Vietnamese', 'Tiếng Việt', false, 27),
    ('ms', 'ms', 'msa', 'Malay', 'Bahasa Melayu', false, 28),
    ('id', 'id', 'ind', 'Indonesian', 'Bahasa Indonesia', false, 29),
    ('sw', 'sw', 'swa', 'Swahili', 'Kiswahili', false, 30),
    ('ha', 'ha', 'hau', 'Hausa', 'Hausa', false, 31),
    ('yo', 'yo', 'yor', 'Yoruba', 'Yorùbá', false, 32),
    ('ig', 'ig', 'ibo', 'Igbo', 'Igbo', false, 33)
ON CONFLICT (code) DO NOTHING;
