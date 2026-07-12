-- ============================================================================
-- File       : 999_validation.sql
-- Module     : Shared
-- Purpose    : Integrity checks for all shared reference data catalogues.
-- Depends On : all shared tables
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

DO $$
DECLARE
    v_dup_iso2 INT; v_dup_iso3 INT; v_dup_numeric INT;
    v_dup_locale INT; v_dup_currency INT; v_dup_mime INT;
    v_dup_storage INT; v_dup_channel INT; v_dup_error INT;
    v_dup_date INT; v_dup_phone INT;
    v_invalid_mime INT; v_missing_currency INT;
    v_missing_country INT; v_invalid_error INT; v_invalid_uom INT;
    v_mime_no_file_type INT; v_states_no_country INT;
    v_orphan_phone INT; v_invalid_date_cat INT;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STARTING SHARED CATALOGUE INTEGRITY VALIDATIONS';
    RAISE NOTICE '============================================================';

    -- 1. Duplicate ISO2 codes
    SELECT count(1) INTO v_dup_iso2 FROM (
        SELECT iso2 FROM countries WHERE is_active = true GROUP BY iso2 HAVING count(1) > 1
    ) d;
    IF v_dup_iso2 > 0 THEN RAISE EXCEPTION 'Duplicate ISO2 codes found: %', v_dup_iso2; END IF;

    -- 2. Duplicate ISO3 codes
    SELECT count(1) INTO v_dup_iso3 FROM (
        SELECT iso3 FROM countries WHERE is_active = true GROUP BY iso3 HAVING count(1) > 1
    ) d;
    IF v_dup_iso3 > 0 THEN RAISE EXCEPTION 'Duplicate ISO3 codes found: %', v_dup_iso3; END IF;

    -- 3. Duplicate numeric codes
    SELECT count(1) INTO v_dup_numeric FROM (
        SELECT numeric_code FROM countries WHERE is_active = true GROUP BY numeric_code HAVING count(1) > 1
    ) d;
    IF v_dup_numeric > 0 THEN RAISE EXCEPTION 'Duplicate numeric codes found: %', v_dup_numeric; END IF;

    -- 4. Duplicate locales
    SELECT count(1) INTO v_dup_locale FROM (
        SELECT code FROM locales WHERE is_active = true GROUP BY code HAVING count(1) > 1
    ) d;
    IF v_dup_locale > 0 THEN RAISE EXCEPTION 'Duplicate locale codes found: %', v_dup_locale; END IF;

    -- 5. Duplicate currency codes
    SELECT count(1) INTO v_dup_currency FROM (
        SELECT code FROM currencies WHERE is_active = true GROUP BY code HAVING count(1) > 1
    ) d;
    IF v_dup_currency > 0 THEN RAISE EXCEPTION 'Duplicate currency codes found: %', v_dup_currency; END IF;

    -- 6. Duplicate MIME types
    SELECT count(1) INTO v_dup_mime FROM (
        SELECT mime_type FROM mime_types WHERE is_active = true GROUP BY mime_type HAVING count(1) > 1
    ) d;
    IF v_dup_mime > 0 THEN RAISE EXCEPTION 'Duplicate MIME types found: %', v_dup_mime; END IF;

    -- 7. Duplicate storage provider codes
    SELECT count(1) INTO v_dup_storage FROM (
        SELECT code FROM storage_providers WHERE is_active = true GROUP BY code HAVING count(1) > 1
    ) d;
    IF v_dup_storage > 0 THEN RAISE EXCEPTION 'Duplicate storage provider codes found: %', v_dup_storage; END IF;

    -- 8. Duplicate notification channel codes
    SELECT count(1) INTO v_dup_channel FROM (
        SELECT code FROM notification_channels WHERE is_active = true GROUP BY code HAVING count(1) > 1
    ) d;
    IF v_dup_channel > 0 THEN RAISE EXCEPTION 'Duplicate notification channel codes found: %', v_dup_channel; END IF;

    -- 9. Duplicate error codes
    SELECT count(1) INTO v_dup_error FROM (
        SELECT code FROM error_codes WHERE is_active = true GROUP BY code HAVING count(1) > 1
    ) d;
    IF v_dup_error > 0 THEN RAISE EXCEPTION 'Duplicate error codes found: %', v_dup_error; END IF;

    -- 10. Duplicate date format codes
    SELECT count(1) INTO v_dup_date FROM (
        SELECT code FROM date_formats WHERE is_active = true GROUP BY code HAVING count(1) > 1
    ) d;
    IF v_dup_date > 0 THEN RAISE EXCEPTION 'Duplicate date format codes found: %', v_dup_date; END IF;

    -- 11. Duplicate phone codes per country
    SELECT count(1) INTO v_dup_phone FROM (
        SELECT country_id, phone_code FROM countries_phone_codes WHERE is_active = true GROUP BY country_id, phone_code HAVING count(1) > 1
    ) d;
    IF v_dup_phone > 0 THEN RAISE EXCEPTION 'Duplicate phone codes found for same country: %', v_dup_phone; END IF;

    -- 12. Locales referencing invalid languages
    SELECT count(1) INTO v_invalid_mime FROM locales l
    LEFT JOIN languages lang ON lang.code = l.language_code
    WHERE lang.code IS NULL;
    IF v_invalid_mime > 0 THEN RAISE EXCEPTION 'Locales referencing non-existent languages: %', v_invalid_mime; END IF;

    -- 13. Locales referencing invalid countries
    SELECT count(1) INTO v_missing_country FROM locales l
    LEFT JOIN countries c ON c.iso2 = l.country_iso2
    WHERE c.iso2 IS NULL;
    IF v_missing_country > 0 THEN RAISE EXCEPTION 'Locales referencing non-existent countries: %', v_missing_country; END IF;

    -- 14. MIME types referencing invalid file types
    SELECT count(1) INTO v_mime_no_file_type FROM mime_types mt
    LEFT JOIN file_types ft ON ft.code = mt.file_type_code
    WHERE ft.code IS NULL;
    IF v_mime_no_file_type > 0 THEN RAISE EXCEPTION 'MIME types referencing invalid file types: %', v_mime_no_file_type; END IF;

    -- 15. States referencing invalid countries
    SELECT count(1) INTO v_states_no_country FROM states s
    LEFT JOIN countries c ON c.id = s.country_id
    WHERE c.id IS NULL;
    IF v_states_no_country > 0 THEN RAISE EXCEPTION 'States referencing non-existent countries: %', v_states_no_country; END IF;

    -- 16. Phone codes referencing invalid countries
    SELECT count(1) INTO v_orphan_phone FROM countries_phone_codes pc
    LEFT JOIN countries c ON c.id = pc.country_id
    WHERE c.id IS NULL;
    IF v_orphan_phone > 0 THEN RAISE EXCEPTION 'Phone codes referencing non-existent countries: %', v_orphan_phone; END IF;

    -- 17. Currency codes referenced by countries must exist
    SELECT count(1) INTO v_missing_currency FROM countries c
    LEFT JOIN currencies cur ON cur.code = c.currency_code
    WHERE c.currency_code IS NOT NULL AND cur.code IS NULL;
    IF v_missing_currency > 0 THEN RAISE WARNING 'Countries referencing non-existent currencies: %', v_missing_currency; END IF;

    -- 18. Error codes format validation
    SELECT count(1) INTO v_invalid_error FROM error_codes
    WHERE code !~ '^[A-Z][A-Z_]{2,29}$';
    IF v_invalid_error > 0 THEN RAISE EXCEPTION 'Error codes with invalid format: %', v_invalid_error; END IF;

    -- 19. Date formats category validation
    SELECT count(1) INTO v_invalid_date_cat FROM date_formats
    WHERE category NOT IN ('DATE','TIME','DATETIME','MONTH','YEAR','WEEKDAY','QUARTER');
    IF v_invalid_date_cat > 0 THEN RAISE EXCEPTION 'Date formats with invalid category: %', v_invalid_date_cat; END IF;

    -- 20. Units of measure category validation
    SELECT count(1) INTO v_invalid_uom FROM units_of_measure
    WHERE category NOT IN ('WEIGHT','LENGTH','VOLUME','TIME','TEMPERATURE','AREA','SPEED','PERCENTAGE','COUNT','DATA','ENERGY','PRESSURE','ANGLE');
    IF v_invalid_uom > 0 THEN RAISE EXCEPTION 'Units of measure with invalid category: %', v_invalid_uom; END IF;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ALL SHARED CATALOGUE INTEGRITY TESTS PASSED';
    RAISE NOTICE '============================================================';
END $$;
