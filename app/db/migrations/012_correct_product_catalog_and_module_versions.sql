CREATE TABLE IF NOT EXISTS product_aliases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL
    REFERENCES products(id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  alias_kind VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_aliases_alias_not_blank
    CHECK (length(btrim(alias)) > 0),
  CONSTRAINT product_aliases_kind_valid
    CHECK (
      alias_kind IN ('GENERAL', 'ENVIRONMENT', 'SOURCE_COLUMN')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS product_aliases_kind_alias_key
  ON product_aliases (alias_kind, lower(btrim(alias)));

CREATE INDEX IF NOT EXISTS product_aliases_product_idx
  ON product_aliases (product_id, alias_kind, id);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS version_selection_mode VARCHAR(30)
    NOT NULL DEFAULT 'SINGLE';

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_version_selection_mode_valid;

ALTER TABLE products
  ADD CONSTRAINT products_version_selection_mode_valid
  CHECK (
    version_selection_mode IN ('SINGLE', 'MODULE_SCOPED')
  );

CREATE TABLE IF NOT EXISTS product_modules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL
    REFERENCES products(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(120),
  lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_modules_code_not_blank
    CHECK (length(btrim(code)) > 0),
  CONSTRAINT product_modules_name_not_blank
    CHECK (length(btrim(name)) > 0),
  CONSTRAINT product_modules_lifecycle_status_valid
    CHECK (lifecycle_status IN ('ACTIVE', 'RETIRED')),
  CONSTRAINT product_modules_sort_order_non_negative
    CHECK (sort_order >= 0),
  CONSTRAINT product_modules_product_code_key
    UNIQUE (product_id, code),
  CONSTRAINT product_modules_id_product_unique
    UNIQUE (id, product_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_modules_product_name_key
  ON product_modules (product_id, lower(btrim(name)));

CREATE INDEX IF NOT EXISTS product_modules_product_idx
  ON product_modules (
    product_id,
    lifecycle_status,
    sort_order,
    id
  );

INSERT INTO product_modules (
  product_id,
  code,
  name,
  short_name,
  lifecycle_status,
  sort_order
)
SELECT DISTINCT ON (version.product_id, module.code)
  version.product_id,
  module.code,
  module.name,
  module.short_name,
  module.lifecycle_status,
  module.sort_order
FROM product_version_modules AS module
JOIN product_versions AS version
  ON version.id = module.product_version_id
ORDER BY version.product_id, module.code, module.id
ON CONFLICT (product_id, code)
DO NOTHING;

ALTER TABLE product_version_modules
  ADD COLUMN IF NOT EXISTS product_module_id BIGINT;

UPDATE product_version_modules AS version_module
SET product_module_id = product_module.id
FROM product_versions AS version,
     product_modules AS product_module
WHERE version.id = version_module.product_version_id
  AND product_module.product_id = version.product_id
  AND product_module.code = version_module.code
  AND version_module.product_module_id IS NULL;

ALTER TABLE product_version_modules
  ALTER COLUMN product_module_id SET NOT NULL;

ALTER TABLE product_version_modules
  DROP CONSTRAINT IF EXISTS
    product_version_modules_product_module_fk;

ALTER TABLE product_version_modules
  ADD CONSTRAINT product_version_modules_product_module_fk
  FOREIGN KEY (product_module_id)
  REFERENCES product_modules(id)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS
  product_version_modules_version_module_key
  ON product_version_modules (
    product_version_id,
    product_module_id
  );

ALTER TABLE environment_product_version_modules
  ADD COLUMN IF NOT EXISTS product_module_id BIGINT;

UPDATE environment_product_version_modules AS environment_module
SET product_module_id = version_module.product_module_id
FROM product_version_modules AS version_module
WHERE version_module.id =
    environment_module.product_version_module_id
  AND environment_module.product_module_id IS NULL;

ALTER TABLE environment_product_version_modules
  ALTER COLUMN product_module_id SET NOT NULL;

ALTER TABLE environment_product_version_modules
  DROP CONSTRAINT IF EXISTS
    environment_product_version_modules_product_module_fk;

ALTER TABLE environment_product_version_modules
  ADD CONSTRAINT
    environment_product_version_modules_product_module_fk
  FOREIGN KEY (product_module_id)
  REFERENCES product_modules(id)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS
  environment_product_version_modules_environment_module_key
  ON environment_product_version_modules (
    environment_id,
    product_module_id
  );

CREATE TABLE IF NOT EXISTS environment_product_candidates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  environment_id BIGINT NOT NULL
    REFERENCES environments(id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  product_id BIGINT NOT NULL
    REFERENCES products(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  source_system VARCHAR(64) NOT NULL,
  confirmation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  notes VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT environment_product_candidates_source_not_blank
    CHECK (length(btrim(source_system)) > 0),
  CONSTRAINT environment_product_candidates_status_valid
    CHECK (
      confirmation_status IN ('PENDING', 'CONFIRMED', 'REJECTED')
    ),
  CONSTRAINT environment_product_candidates_environment_product_source_key
    UNIQUE (environment_id, product_id, source_system)
);

CREATE INDEX IF NOT EXISTS environment_product_candidates_product_idx
  ON environment_product_candidates (
    product_id,
    confirmation_status,
    environment_id
  );

INSERT INTO products (
  code,
  name,
  short_name,
  lifecycle_status,
  sort_order,
  version_selection_mode
)
VALUES
  (
    'SHOTEATE-NINTEI',
    '諸手当認定サブシステム',
    '諸手当認定',
    'ACTIVE',
    20,
    'SINGLE'
  ),
  (
    'JINKENHI-SHISAN',
    '人件費試算サブシステム',
    '人件費試算',
    'ACTIVE',
    30,
    'SINGLE'
  ),
  (
    'UHR',
    'U-PDS給与明細',
    'U-HR',
    'ACTIVE',
    40,
    'MODULE_SCOPED'
  ),
  (
    'PHR',
    '庶務事務システム',
    'PHR',
    'ACTIVE',
    50,
    'SINGLE'
  ),
  (
    'UPDS-MYNUMBER',
    'U-PDSマイナンバーシステム',
    'マイナンバー',
    'ACTIVE',
    60,
    'SINGLE'
  ),
  (
    'WEB-SHUGYO',
    'Web就業管理システム',
    'Web就業',
    'ACTIVE',
    70,
    'SINGLE'
  ),
  (
    'KOSEI-KANRI',
    '構成管理システム',
    '構成管理',
    'ACTIVE',
    80,
    'SINGLE'
  ),
  (
    'WEB-KOYO',
    'Web雇用システム',
    'Web雇用',
    'ACTIVE',
    90,
    'SINGLE'
  ),
  (
    'SMARTGOV',
    'SmartGov',
    'SmartGov',
    'ACTIVE',
    100,
    'SINGLE'
  )
ON CONFLICT (code)
DO NOTHING;

UPDATE product_version_modules AS module
SET lifecycle_status = 'RETIRED',
    updated_at = CURRENT_TIMESTAMP
FROM product_versions AS version,
     products AS product
WHERE version.id = module.product_version_id
  AND product.id = version.product_id
  AND product.code IN ('UPDS-JINJI', 'UPDS-KYUYO');

UPDATE product_versions AS version
SET lifecycle_status = 'RETIRED',
    updated_at = CURRENT_TIMESTAMP
FROM products AS product
WHERE product.id = version.product_id
  AND product.code IN ('UPDS-JINJI', 'UPDS-KYUYO');

UPDATE products
SET lifecycle_status = 'RETIRED',
    updated_at = CURRENT_TIMESTAMP
WHERE code IN ('UPDS-JINJI', 'UPDS-KYUYO');

WITH versioned_product(code) AS (
  VALUES
    ('01'),
    ('SHOTEATE-NINTEI'),
    ('JINKENHI-SHISAN'),
    ('UPDS-MYNUMBER')
),
catalog_version(version, display_version) AS (
  VALUES ('6.0', 'V6'), ('7.0', 'V7')
)
INSERT INTO product_versions (
  product_id,
  version,
  display_version,
  lifecycle_status
)
SELECT
  product.id,
  catalog_version.version,
  catalog_version.display_version,
  'ACTIVE'
FROM versioned_product
JOIN products AS product
  ON product.code = versioned_product.code
CROSS JOIN catalog_version
ON CONFLICT (product_id, lower(btrim(version)))
DO NOTHING;

WITH catalog_version(version) AS (
  VALUES ('1.0'), ('1.1'), ('1.5')
)
INSERT INTO product_versions (
  product_id,
  version,
  display_version,
  lifecycle_status
)
SELECT
  product.id,
  catalog_version.version,
  'V' || catalog_version.version,
  'ACTIVE'
FROM products AS product
CROSS JOIN catalog_version
WHERE product.code = 'PHR'
ON CONFLICT (product_id, lower(btrim(version)))
DO NOTHING;

WITH catalog_version(version) AS (
  VALUES
    ('2.9'),
    ('2.9.1'),
    ('2.9.2'),
    ('2.10'),
    ('2.10.1'),
    ('2.10.2'),
    ('2.10.3'),
    ('2.10.4'),
    ('2.10.5'),
    ('2.10.6'),
    ('2.11'),
    ('2.11.1'),
    ('2.11.2'),
    ('2.11.3'),
    ('2.11.4'),
    ('2.11.5'),
    ('2.11.6'),
    ('2.11.7')
)
INSERT INTO product_versions (
  product_id,
  version,
  display_version,
  lifecycle_status
)
SELECT
  product.id,
  catalog_version.version,
  'V' || catalog_version.version,
  'ACTIVE'
FROM products AS product
CROSS JOIN catalog_version
WHERE product.code = 'UHR'
ON CONFLICT (product_id, lower(btrim(version)))
DO NOTHING;

INSERT INTO product_modules (
  product_id,
  code,
  name,
  short_name,
  lifecycle_status,
  sort_order
)
SELECT
  product.id,
  module.code,
  module.name,
  module.short_name,
  'ACTIVE',
  module.sort_order
FROM products AS product
CROSS JOIN (
  VALUES
    (
      'ANNUAL_SALARY',
      '年俸制対応オプション',
      '年俸制対応',
      10
    ),
    (
      'ANNUAL_SALARY_EXTENSION',
      '年俸制拡張対応拡張機能',
      '年俸制拡張',
      20
    ),
    (
      'PAYSLIP_EXTENSION',
      '給与明細拡張オプション',
      '給与明細拡張',
      30
    ),
    (
      'LASER_FORM',
      'レーザープリンター対応版扶養控除・保険料控除申告書オプション',
      'レーザー申告書',
      40
    ),
    (
      'PAYMENT_REPORT',
      '支払調書オプション',
      '支払調書',
      50
    ),
    (
      'RETIREMENT_ALLOWANCE',
      '退職手当支給オプション',
      '退職手当',
      60
    ),
    (
      'YEAR_END_DIGITAL',
      'U-PDS年末調整電子化対応オプション',
      '年末調整電子化',
      70
    )
) AS module(code, name, short_name, sort_order)
WHERE product.code = '01'
ON CONFLICT (product_id, code)
DO NOTHING;

INSERT INTO product_modules (
  product_id,
  code,
  name,
  short_name,
  lifecycle_status,
  sort_order
)
SELECT
  product.id,
  module.code,
  module.name,
  module.short_name,
  'ACTIVE',
  module.sort_order
FROM products AS product
CROSS JOIN (
  VALUES
    ('WEB_SALARY', 'Web給与明細', '給与明細', 10),
    ('COMMON', '共通機能', '共通', 20),
    (
      'ALLOWANCE_INTERFACE',
      '諸手当申請インタフェース',
      '諸手当IF',
      30
    ),
    ('ALLOWANCE_APPLY', '諸手当申請', '諸手当', 40),
    ('PERSONAL_RECORD', '身上調書', '身上調書', 50),
    ('YEAR_END', '年末調整', '年末調整', 60),
    (
      'YEAR_END_FAMILY_CHANGE',
      '年末調整 例月家族異動申請オプション',
      '例月家族異動',
      70
    ),
    (
      'YEAR_END_DIGITAL',
      '年末調整 年末調整電子化対応オプション',
      '年末調整電子化',
      80
    ),
    ('EVALUATION', '評価系', '評価', 90)
) AS module(code, name, short_name, sort_order)
WHERE product.code = 'UHR'
ON CONFLICT (product_id, code)
DO NOTHING;

INSERT INTO product_version_modules (
  product_version_id,
  product_module_id,
  code,
  name,
  short_name,
  lifecycle_status,
  sort_order
)
SELECT
  version.id,
  module.id,
  module.code,
  module.name,
  module.short_name,
  'ACTIVE',
  module.sort_order
FROM product_versions AS version
JOIN products AS product
  ON product.id = version.product_id
JOIN product_modules AS module
  ON module.product_id = product.id
WHERE product.code = '01'
  AND version.version IN ('6.0', '7.0')
ON CONFLICT (
  product_version_id,
  lower(btrim(code))
)
DO NOTHING;

WITH offering(version, module_code) AS (
  VALUES
    ('2.9', 'WEB_SALARY'),
    ('2.9', 'COMMON'),
    ('2.9', 'ALLOWANCE_INTERFACE'),
    ('2.9', 'ALLOWANCE_APPLY'),
    ('2.9', 'PERSONAL_RECORD'),
    ('2.9.1', 'WEB_SALARY'),
    ('2.9.2', 'YEAR_END'),
    ('2.9.2', 'YEAR_END_FAMILY_CHANGE'),
    ('2.10', 'WEB_SALARY'),
    ('2.10', 'COMMON'),
    ('2.10', 'ALLOWANCE_APPLY'),
    ('2.10', 'YEAR_END'),
    ('2.10', 'YEAR_END_FAMILY_CHANGE'),
    ('2.10.1', 'ALLOWANCE_INTERFACE'),
    ('2.10.1', 'ALLOWANCE_APPLY'),
    ('2.10.2', 'COMMON'),
    ('2.10.2', 'YEAR_END'),
    ('2.10.2', 'YEAR_END_DIGITAL'),
    ('2.10.3', 'YEAR_END'),
    ('2.10.4', 'WEB_SALARY'),
    ('2.10.4', 'COMMON'),
    ('2.10.4', 'YEAR_END'),
    ('2.10.5', 'YEAR_END'),
    ('2.10.6', 'WEB_SALARY'),
    ('2.10.6', 'COMMON'),
    ('2.11', 'WEB_SALARY'),
    ('2.11', 'COMMON'),
    ('2.11', 'ALLOWANCE_APPLY'),
    ('2.11', 'YEAR_END'),
    ('2.11', 'YEAR_END_FAMILY_CHANGE'),
    ('2.11.1', 'COMMON'),
    ('2.11.1', 'YEAR_END'),
    ('2.11.2', 'WEB_SALARY'),
    ('2.11.2', 'COMMON'),
    ('2.11.2', 'YEAR_END'),
    ('2.11.2', 'YEAR_END_FAMILY_CHANGE'),
    ('2.11.3', 'WEB_SALARY'),
    ('2.11.3', 'COMMON'),
    ('2.11.4', 'COMMON'),
    ('2.11.4', 'YEAR_END'),
    ('2.11.4', 'YEAR_END_FAMILY_CHANGE'),
    ('2.11.5', 'WEB_SALARY'),
    ('2.11.5', 'COMMON'),
    ('2.11.5', 'YEAR_END'),
    ('2.11.6', 'COMMON'),
    ('2.11.6', 'ALLOWANCE_INTERFACE'),
    ('2.11.6', 'ALLOWANCE_APPLY'),
    ('2.11.7', 'WEB_SALARY'),
    ('2.11.7', 'COMMON')
)
INSERT INTO product_version_modules (
  product_version_id,
  product_module_id,
  code,
  name,
  short_name,
  lifecycle_status,
  sort_order
)
SELECT
  version.id,
  module.id,
  module.code,
  module.name,
  module.short_name,
  'ACTIVE',
  module.sort_order
FROM offering
JOIN products AS product
  ON product.code = 'UHR'
JOIN product_versions AS version
  ON version.product_id = product.id
 AND version.version = offering.version
JOIN product_modules AS module
  ON module.product_id = product.id
 AND module.code = offering.module_code
ON CONFLICT (
  product_version_id,
  lower(btrim(code))
)
DO NOTHING;

INSERT INTO product_aliases (product_id, alias, alias_kind)
SELECT product.id, alias.alias, alias.alias_kind
FROM products AS product
JOIN (
  VALUES
    ('01', 'U-PDS 人事', 'SOURCE_COLUMN'),
    ('01', 'U-PDS 給与', 'SOURCE_COLUMN'),
    ('01', 'UPDS', 'ENVIRONMENT'),
    ('01', 'UPDS-V6', 'ENVIRONMENT'),
    ('01', 'UPDS-V7', 'ENVIRONMENT'),
    (
      'SHOTEATE-NINTEI',
      '諸手当認定サブシステム',
      'SOURCE_COLUMN'
    ),
    (
      'JINKENHI-SHISAN',
      '人件費試算サブシステム',
      'SOURCE_COLUMN'
    ),
    (
      'UPDS-MYNUMBER',
      'U-PDS マイナンバーシステム',
      'SOURCE_COLUMN'
    ),
    ('WEB-SHUGYO', 'Web就業管理システム', 'SOURCE_COLUMN'),
    ('KOSEI-KANRI', '構成管理システム', 'SOURCE_COLUMN'),
    ('WEB-KOYO', 'Web雇用システム', 'SOURCE_COLUMN'),
    ('SMARTGOV', 'SmartGov', 'SOURCE_COLUMN'),
    ('PHR', 'PHR', 'ENVIRONMENT'),
    ('PHR', '庶務事務システム', 'GENERAL'),
    ('UHR', 'UHR', 'ENVIRONMENT'),
    ('UHR', 'U-HR', 'ENVIRONMENT'),
    ('UHR', 'UPDSHR', 'ENVIRONMENT'),
    ('UHR', 'U-PDSHR', 'ENVIRONMENT'),
    ('UHR', 'U-PDS HR', 'GENERAL'),
    ('UHR', 'U-PDS HR＜給与系＞', 'SOURCE_COLUMN'),
    (
      'UHR',
      'U-PDS HR＜諸手当申請＞',
      'SOURCE_COLUMN'
    ),
    (
      'UHR',
      'U-PDS HR＜年末調整申請＞',
      'SOURCE_COLUMN'
    ),
    ('UHR', 'U-PDS HR＜評価系＞', 'SOURCE_COLUMN')
) AS alias(product_code, alias, alias_kind)
  ON alias.product_code = product.code
ON CONFLICT (alias_kind, lower(btrim(alias)))
DO UPDATE SET product_id = EXCLUDED.product_id;

DELETE FROM environment_product_versions AS link
USING product_versions AS version,
      products AS product
WHERE version.id = link.product_version_id
  AND product.id = version.product_id
  AND product.code = '01'
  AND product.name = 'U-PDS人事給与'
  AND link.confirmation_status = 'PENDING'
  AND COALESCE(link.notes, '') LIKE
    '%EnvPortal 環境名 UHR%';

INSERT INTO environment_product_candidates (
  environment_id,
  product_id,
  source_system,
  confirmation_status,
  notes
)
SELECT DISTINCT
  import_row.environment_id,
  product.id,
  'ENVPORTAL',
  'PENDING',
  'EnvPortal環境名UHRからU-HRを識別しました。'
    || 'U-HRはモジュールごとに版数が異なるため、'
    || '導入モジュールと各版数の確認が必要です。'
FROM environment_import_rows AS import_row
JOIN environments AS environment
  ON environment.id = import_row.environment_id
JOIN products AS product
  ON product.code = 'UHR'
WHERE import_row.source_system = 'ENVPORTAL'
  AND import_row.source_file_name = 'data.csv'
  AND import_row.row_kind = 'ENVIRONMENT'
  AND import_row.environment_id IS NOT NULL
  AND lower(btrim(environment.name)) = 'uhr'
ON CONFLICT (environment_id, product_id, source_system)
DO NOTHING;

UPDATE environments AS environment
SET notes = replace(
      environment.notes,
      '機関別製品資料の版数候補を確認待ちの製品版数として関連付けました。',
      'EnvPortal環境名からU-HRの製品候補を識別しました。'
        || 'モジュールごとの版数は確認待ちです。'
    ),
    revision = environment.revision + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM environment_product_candidates AS candidate
  JOIN products AS product
    ON product.id = candidate.product_id
  WHERE candidate.environment_id = environment.id
    AND candidate.source_system = 'ENVPORTAL'
    AND product.code = 'UHR'
)
  AND environment.notes LIKE
    '%機関別製品資料の版数候補を確認待ちの製品版数として関連付けました。%';
