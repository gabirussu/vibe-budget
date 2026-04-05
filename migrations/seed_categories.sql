-- =====================================================
-- SEED CATEGORII STANDARD pentru Vibe Budget
-- =====================================================
--
-- SCOP:
-- Acest script populează cele 12 categorii standard pentru un utilizator.
-- Categoriile de sistem nu pot fi șterse din UI.
--
-- RULARE:
-- Execută în Supabase SQL Editor
-- Înlocuiește EMAIL_UTILIZATOR cu emailul contului tău
-- =====================================================

DO $$
DECLARE
    v_user_id TEXT;
BEGIN
    -- Obținem ID-ul utilizatorului pe baza emailului
    SELECT id::TEXT INTO v_user_id
    FROM users
    WHERE email = 'EMAIL_UTILIZATOR'; -- SCHIMBĂ CU EMAILUL TĂU

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilizatorul cu emailul specificat nu a fost găsit!';
    END IF;

    RAISE NOTICE 'User ID găsit: %', v_user_id;

    -- Ștergem categoriile de sistem existente pentru a evita duplicate
    DELETE FROM categories WHERE user_id = v_user_id AND is_system_category = true;
    RAISE NOTICE 'Categorii de sistem vechi șterse';

    -- ── CHELTUIELI ──────────────────────────────────────────────────────────────

    INSERT INTO categories (id, user_id, name, type, icon, color, description, is_system_category, created_at, updated_at)
    VALUES
        (gen_random_uuid()::text, v_user_id, 'Transport',       'expense', '🚗', '#3b82f6', 'Transport în comun, benzină, service auto, taxi, Uber',                       true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Cumpărături',     'expense', '🛍️', '#22c55e', 'Supermarket, cumpărături online, haine, electronice',                         true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Locuință',        'expense', '🏠', '#f97316', 'Utilități, chirie, rate imobiliare, renovări',                                true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Sănătate',        'expense', '🏥', '#ef4444', 'Medicamente, consultații, investigații medicale',                              true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Divertisment',    'expense', '🍽️', '#ec4899', 'Restaurante, cafenele, cinema, ieșiri în oraș',                               true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Subscripții',     'expense', '📺', '#8b5cf6', 'Abonamente streaming, software, servicii cloud, fitness',                     true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Educație',        'expense', '📚', '#6366f1', 'Cărți, cursuri online, training-uri, școală',                                 true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Taxe și Impozite','expense', '🧾', '#6b7280', 'Taxe, impozite, amenzi, penalități',                                           true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Cash',            'expense', '💵', '#f59e0b', 'Retrageri de numerar de la ATM',                                               true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Transfer Intern', 'expense', '🔄', '#06b6d4', 'Transferuri între propriile conturi (nu afectează bugetul total)',             true, NOW(), NOW()),

    -- ── VENITURI ────────────────────────────────────────────────────────────────

        (gen_random_uuid()::text, v_user_id, 'Venituri',        'income',  '💰', '#10b981', 'Salarii, freelance, dividende, bonusuri',                                     true, NOW(), NOW()),
        (gen_random_uuid()::text, v_user_id, 'Transferuri',     'income',  '💸', '#14b8a6', 'Transferuri primite de la prieteni, familie sau servicii de transfer',        true, NOW(), NOW());

    RAISE NOTICE '✅ 12 categorii standard create cu succes!';

END $$;

-- Verificare finală
SELECT
    c.name       AS "Categorie",
    c.type       AS "Tip",
    c.icon       AS "Icon",
    c.is_system_category AS "Sistem"
FROM categories c
JOIN users u ON c.user_id = u.id::text
WHERE u.email = 'EMAIL_UTILIZATOR'
ORDER BY c.type DESC, c.name;
