INSERT INTO permissions (code, resource, action, name, description)
VALUES
  (
    'builder.use',
    'builder',
    'use',
    '製品構築利用',
    '製品構築、構築履歴、構築端末及び成果物を利用する'
  ),
  (
    'knowledge.use',
    'knowledge',
    'use',
    'ナレッジ利用',
    '製品文書、Help及び過去相談を横断検索する'
  ),
  (
    'code.insight.use',
    'code.insight',
    'use',
    'コードインサイト利用',
    '標準版と組織別版の差分を調査する'
  ),
  (
    'reports.read',
    'reports',
    'read',
    'レポート参照',
    '運用状況、構築実績及びリスク傾向を参照する'
  )
ON CONFLICT (code) DO UPDATE
SET resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
FROM roles AS role_record
JOIN permissions AS permission_record
  ON permission_record.code IN (
    'builder.use',
    'knowledge.use',
    'code.insight.use',
    'reports.read'
  )
WHERE role_record.code IN ('SYSTEM_ADMIN', 'OPERATOR', 'VIEWER')
  AND role_record.permission_seed_enabled
ON CONFLICT (role_id, permission_id) DO NOTHING;
