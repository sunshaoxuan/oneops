UPDATE auth_identities
SET metadata = metadata || jsonb_build_object(
      'upn', lower(substring(subject FROM position(chr(92) IN subject) + 1)) ||
        '@tokyo.scientia.co.jp'
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE provider = 'WINDOWS'
  AND upper(split_part(subject, chr(92), 1)) = 'TOKYO'
  AND substring(subject FROM position(chr(92) IN subject) + 1)
        ~ '^[A-Za-z0-9._-]+$'
  AND right(subject, 1) <> '$'
  AND COALESCE(NULLIF(metadata->>'upn', ''), '') = '';
