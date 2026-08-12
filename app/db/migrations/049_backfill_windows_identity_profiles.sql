UPDATE auth_identities AS identity
SET metadata = identity.metadata || jsonb_strip_nulls(
      jsonb_build_object(
        'windowsDomain', COALESCE(
          NULLIF(btrim(identity.metadata->>'windowsDomain'), ''),
          upper(split_part(identity.subject, chr(92), 1))
        ),
        'domainUsername', COALESCE(
          NULLIF(btrim(identity.metadata->>'domainUsername'), ''),
          lower(
            substring(identity.subject FROM position(chr(92) IN identity.subject) + 1)
          )
        ),
        'upn', CASE
          WHEN COALESCE(NULLIF(btrim(identity.metadata->>'upn'), ''), '') <> ''
            THEN lower(identity.metadata->>'upn')
          WHEN upper(split_part(identity.subject, chr(92), 1)) = 'TOKYO'
            THEN lower(
              substring(identity.subject FROM position(chr(92) IN identity.subject) + 1)
            ) || '@tokyo.scientia.co.jp'
          ELSE NULL
        END,
        'displayName', COALESCE(
          NULLIF(btrim(identity.metadata->>'displayName'), ''),
          NULLIF(btrim(user_record.display_name), '')
        ),
        'email', COALESCE(
          NULLIF(lower(btrim(identity.metadata->>'email')), ''),
          NULLIF(lower(btrim(user_record.email)), '')
        )
      )
    ),
    updated_at = CURRENT_TIMESTAMP
FROM users AS user_record
WHERE identity.user_id = user_record.id
  AND identity.provider = 'WINDOWS'
  AND position(chr(92) IN identity.subject) > 1
  AND substring(identity.subject FROM position(chr(92) IN identity.subject) + 1)
        ~ '^[A-Za-z0-9._-]+$'
  AND right(identity.subject, 1) <> '$'
  AND (
    COALESCE(NULLIF(btrim(identity.metadata->>'windowsDomain'), ''), '') = ''
    OR COALESCE(NULLIF(btrim(identity.metadata->>'domainUsername'), ''), '') = ''
    OR COALESCE(NULLIF(btrim(identity.metadata->>'upn'), ''), '') = ''
    OR COALESCE(NULLIF(btrim(identity.metadata->>'displayName'), ''), '') = ''
    OR (
      COALESCE(NULLIF(btrim(identity.metadata->>'email'), ''), '') = ''
      AND COALESCE(NULLIF(btrim(user_record.email), ''), '') <> ''
    )
  );
