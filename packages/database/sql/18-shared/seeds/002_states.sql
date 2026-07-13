-- ============================================================================
-- File       : 002_states.sql
-- Module     : Shared
-- Purpose    : Seed states for primary markets (India, US, UAE, UK, Canada).
-- Depends On : states, countries
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- India States
WITH c AS (SELECT id FROM countries WHERE iso2 = 'IN')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, type, display_order
FROM c, (VALUES
    ('AP', 'Andhra Pradesh', 1, 'STATE'), ('AR', 'Arunachal Pradesh', 2, 'STATE'), ('AS', 'Assam', 3, 'STATE'),
    ('BR', 'Bihar', 4, 'STATE'), ('CG', 'Chhattisgarh', 5, 'STATE'), ('GA', 'Goa', 6, 'STATE'),
    ('GJ', 'Gujarat', 7, 'STATE'), ('HR', 'Haryana', 8, 'STATE'), ('HP', 'Himachal Pradesh', 9, 'STATE'),
    ('JH', 'Jharkhand', 10, 'STATE'), ('KA', 'Karnataka', 11, 'STATE'), ('KL', 'Kerala', 12, 'STATE'),
    ('MP', 'Madhya Pradesh', 13, 'STATE'), ('MH', 'Maharashtra', 14, 'STATE'), ('MN', 'Manipur', 15, 'STATE'),
    ('ML', 'Meghalaya', 16, 'STATE'), ('MZ', 'Mizoram', 17, 'STATE'), ('NL', 'Nagaland', 18, 'STATE'),
    ('OD', 'Odisha', 19, 'STATE'), ('PB', 'Punjab', 20, 'STATE'), ('RJ', 'Rajasthan', 21, 'STATE'),
    ('SK', 'Sikkim', 22, 'STATE'), ('TN', 'Tamil Nadu', 23, 'STATE'), ('TS', 'Telangana', 24, 'STATE'),
    ('TR', 'Tripura', 25, 'STATE'), ('UP', 'Uttar Pradesh', 26, 'STATE'), ('UK', 'Uttarakhand', 27, 'STATE'),
    ('WB', 'West Bengal', 28, 'STATE'),
    ('DL', 'Delhi', 29, 'TERRITORY'),
    ('CH', 'Chandigarh', 30, 'TERRITORY'), ('PY', 'Puducherry', 31, 'TERRITORY'),
    ('JK', 'Jammu & Kashmir', 32, 'STATE'), ('LD', 'Ladakh', 33, 'STATE'),
    ('AN', 'Andaman & Nicobar', 34, 'TERRITORY'), ('DN', 'Dadra & Nagar Haveli and Daman & Diu', 35, 'TERRITORY'),
    ('LA', 'Lakshadweep', 36, 'TERRITORY')
) AS t(code, name, display_order, type)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);

-- US States
WITH c AS (SELECT id FROM countries WHERE iso2 = 'US')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, type, display_order
FROM c, (VALUES
    ('AL', 'Alabama', 1, 'STATE'), ('AK', 'Alaska', 2, 'STATE'), ('AZ', 'Arizona', 3, 'STATE'),
    ('AR', 'Arkansas', 4, 'STATE'), ('CA', 'California', 5, 'STATE'), ('CO', 'Colorado', 6, 'STATE'),
    ('CT', 'Connecticut', 7, 'STATE'), ('DE', 'Delaware', 8, 'STATE'), ('FL', 'Florida', 9, 'STATE'),
    ('GA', 'Georgia', 10, 'STATE'), ('HI', 'Hawaii', 11, 'STATE'), ('ID', 'Idaho', 12, 'STATE'),
    ('IL', 'Illinois', 13, 'STATE'), ('IN', 'Indiana', 14, 'STATE'), ('IA', 'Iowa', 15, 'STATE'),
    ('KS', 'Kansas', 16, 'STATE'), ('KY', 'Kentucky', 17, 'STATE'), ('LA', 'Louisiana', 18, 'STATE'),
    ('ME', 'Maine', 19, 'STATE'), ('MD', 'Maryland', 20, 'STATE'), ('MA', 'Massachusetts', 21, 'STATE'),
    ('MI', 'Michigan', 22, 'STATE'), ('MN', 'Minnesota', 23, 'STATE'), ('MS', 'Mississippi', 24, 'STATE'),
    ('MO', 'Missouri', 25, 'STATE'), ('MT', 'Montana', 26, 'STATE'), ('NE', 'Nebraska', 27, 'STATE'),
    ('NV', 'Nevada', 28, 'STATE'), ('NH', 'New Hampshire', 29, 'STATE'), ('NJ', 'New Jersey', 30, 'STATE'),
    ('NM', 'New Mexico', 31, 'STATE'), ('NY', 'New York', 32, 'STATE'), ('NC', 'North Carolina', 33, 'STATE'),
    ('ND', 'North Dakota', 34, 'STATE'), ('OH', 'Ohio', 35, 'STATE'), ('OK', 'Oklahoma', 36, 'STATE'),
    ('OR', 'Oregon', 37, 'STATE'), ('PA', 'Pennsylvania', 38, 'STATE'), ('RI', 'Rhode Island', 39, 'STATE'),
    ('SC', 'South Carolina', 40, 'STATE'), ('SD', 'South Dakota', 41, 'STATE'), ('TN', 'Tennessee', 42, 'STATE'),
    ('TX', 'Texas', 43, 'STATE'), ('UT', 'Utah', 44, 'STATE'), ('VT', 'Vermont', 45, 'STATE'),
    ('VA', 'Virginia', 46, 'STATE'), ('WA', 'Washington', 47, 'STATE'), ('WV', 'West Virginia', 48, 'STATE'),
    ('WI', 'Wisconsin', 49, 'STATE'), ('WY', 'Wyoming', 50, 'STATE'),
    ('DC', 'District of Columbia', 51, 'TERRITORY')
) AS t(code, name, display_order, type)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);

-- UAE Emirates
WITH c AS (SELECT id FROM countries WHERE iso2 = 'AE')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, 'EMIRATE', display_order
FROM c, (VALUES
    ('AZ', 'Abu Dhabi', 1), ('DU', 'Dubai', 2), ('SH', 'Sharjah', 3),
    ('AJ', 'Ajman', 4), ('UQ', 'Umm Al Quwain', 5), ('RK', 'Ras Al Khaimah', 6),
    ('FU', 'Fujairah', 7)
) AS t(code, name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);

-- UK Countries
WITH c AS (SELECT id FROM countries WHERE iso2 = 'GB')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, 'REGION', display_order
FROM c, (VALUES
    ('ENG', 'England', 1), ('SCT', 'Scotland', 2), ('WLS', 'Wales', 3),
    ('NIR', 'Northern Ireland', 4)
) AS t(code, name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);

-- Canada Provinces
WITH c AS (SELECT id FROM countries WHERE iso2 = 'CA')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, type, display_order
FROM c, (VALUES
    ('AB', 'Alberta', 'PROVINCE', 1), ('BC', 'British Columbia', 'PROVINCE', 2),
    ('MB', 'Manitoba', 'PROVINCE', 3), ('NB', 'New Brunswick', 'PROVINCE', 4),
    ('NL', 'Newfoundland and Labrador', 'PROVINCE', 5),
    ('NS', 'Nova Scotia', 'PROVINCE', 6), ('ON', 'Ontario', 'PROVINCE', 7),
    ('PE', 'Prince Edward Island', 'PROVINCE', 8), ('QC', 'Quebec', 'PROVINCE', 9),
    ('SK', 'Saskatchewan', 'PROVINCE', 10),
    ('NT', 'Northwest Territories', 'TERRITORY', 11),
    ('NU', 'Nunavut', 'TERRITORY', 12), ('YT', 'Yukon', 'TERRITORY', 13)
) AS t(code, name, type, display_order)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);
