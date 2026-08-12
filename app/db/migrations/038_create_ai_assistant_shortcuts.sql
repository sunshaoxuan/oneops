CREATE TABLE IF NOT EXISTS ai_assistant_shortcut_categories (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_ja TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_assistant_shortcut_categories_code_not_blank
    CHECK (length(btrim(code)) > 0),
  CONSTRAINT ai_assistant_shortcut_categories_names_not_blank
    CHECK (
      length(btrim(name_ja)) > 0
      AND length(btrim(name_zh)) > 0
      AND length(btrim(name_en)) > 0
    ),
  CONSTRAINT ai_assistant_shortcut_categories_sort_order_check
    CHECK (sort_order BETWEEN 0 AND 9999)
);

CREATE TABLE IF NOT EXISTS ai_assistant_shortcuts (
  id UUID PRIMARY KEY,
  category_id UUID NOT NULL
    REFERENCES ai_assistant_shortcut_categories(id) ON DELETE RESTRICT,
  code TEXT NOT NULL UNIQUE,
  name_ja TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ja TEXT NOT NULL,
  description_zh TEXT NOT NULL,
  description_en TEXT NOT NULL,
  starter_prompt_ja TEXT NOT NULL,
  starter_prompt_zh TEXT NOT NULL,
  starter_prompt_en TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_assistant_shortcuts_code_not_blank
    CHECK (length(btrim(code)) > 0),
  CONSTRAINT ai_assistant_shortcuts_names_not_blank
    CHECK (
      length(btrim(name_ja)) > 0
      AND length(btrim(name_zh)) > 0
      AND length(btrim(name_en)) > 0
    ),
  CONSTRAINT ai_assistant_shortcuts_descriptions_not_blank
    CHECK (
      length(btrim(description_ja)) > 0
      AND length(btrim(description_zh)) > 0
      AND length(btrim(description_en)) > 0
    ),
  CONSTRAINT ai_assistant_shortcuts_starters_not_blank
    CHECK (
      length(btrim(starter_prompt_ja)) > 0
      AND length(btrim(starter_prompt_zh)) > 0
      AND length(btrim(starter_prompt_en)) > 0
    ),
  CONSTRAINT ai_assistant_shortcuts_prompt_not_blank
    CHECK (length(btrim(system_prompt)) > 0),
  CONSTRAINT ai_assistant_shortcuts_sort_order_check
    CHECK (sort_order BETWEEN 0 AND 9999)
);

CREATE INDEX IF NOT EXISTS ai_assistant_shortcuts_category_order_idx
  ON ai_assistant_shortcuts (category_id, sort_order, id);

ALTER TABLE ai_assistant_shortcuts
  ALTER COLUMN enabled SET DEFAULT FALSE;

INSERT INTO ai_assistant_shortcut_categories (
  id, code, name_ja, name_zh, name_en, icon, sort_order
)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'LANGUAGE_WRITING', '言語と文章', '语言与写作', 'Language and writing', 'translation', 10),
  ('10000000-0000-4000-8000-000000000002', 'DOCUMENT_MEETING', '文書と会議', '文档与会议', 'Documents and meetings', 'document', 20),
  ('10000000-0000-4000-8000-000000000003', 'WORK_ORGANIZATION', '業務整理', '工作梳理', 'Work organization', 'organization', 30),
  ('10000000-0000-4000-8000-000000000004', 'QUALITY_REVIEW', '品質確認', '质量检查', 'Quality review', 'review', 40)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_assistant_shortcuts (
  id, category_id, code,
  name_ja, name_zh, name_en,
  description_ja, description_zh, description_en,
  starter_prompt_ja, starter_prompt_zh, starter_prompt_en,
  system_prompt, sort_order
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'JA_ZH_TRANSLATION',
    '日中相互翻訳', '日中互译', 'Japanese and Chinese translation',
    '日本語と中国語を業務文脈に合わせて相互翻訳します。', '根据业务语境进行日语与中文互译。', 'Translates Japanese and Chinese for business contexts.',
    '翻訳する文章と、用途や読み手があれば入力してください。', '请输入需要翻译的内容，并说明用途或读者。', 'Enter the text and, if known, its purpose or audience.',
    'あなたは日中業務翻訳の専門アシスタントです。入力言語を判定し、日本語は中国語へ、中国語は日本語へ翻訳してください。意味、数値、固有名詞、段落構造を維持してください。翻訳結果は目標言語だけで記述し、固有名詞又は翻訳不能な用語を除いて、原文言語の助詞、語尾及び機能語を残さないでください。説明と原文の再掲は行わず、送信前に原文言語の残留がないことを確認してください。用途と読み手が結果を左右する場合だけ短く確認してください。曖昧な箇所は推測で確定せず注記してください。翻訳以外の依頼を受けた場合は、別のクイックアシスタントを新しい話題から選ぶよう案内してください。',
    10
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'TEXT_POLISHING',
    '文章推敲', '文章润色', 'Text polishing',
    '意味を維持しながら、明確で自然な業務文へ整えます。', '在保持原意的前提下润色为清晰自然的商务文字。', 'Polishes business text while preserving meaning.',
    '推敲する文章と、希望する文体を入力してください。', '请输入需要润色的文字和希望的语气。', 'Enter the text and preferred tone.',
    'あなたは業務文章の推敲アシスタントです。原文の意味、数値、固有名詞、責任範囲を維持し、読みやすさ、文法、敬語、論理順序を整えてください。重要な意味変更が必要な箇所は勝手に変更せず確認事項として示してください。結果は推敲後の文章を先に示し、主な修正点を短く添えてください。',
    20
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'AUDIENCE_REWRITE',
    '読み手別書き換え', '面向读者改写', 'Audience rewrite',
    '専門的な文章を指定した読み手に伝わる表現へ書き換えます。', '将专业内容改写为目标读者易懂的表达。', 'Rewrites specialist text for a chosen audience.',
    '原文、読み手、伝えたい目的を入力してください。', '请输入原文、目标读者和沟通目的。', 'Enter the source text, audience, and communication goal.',
    'あなたは読み手別の文章編集アシスタントです。原文の事実を維持し、指定された読み手の知識水準、役割、目的に合わせて語彙と説明量を調整してください。専門用語は必要に応じて平易に説明してください。読み手または目的が不明で結果を左右する場合は先に確認してください。',
    30
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    'SUMMARY_KEY_POINTS',
    '要約と要点整理', '摘要与要点整理', 'Summary and key points',
    '長い文章から要旨、重要事項、未決事項を整理します。', '从长文中整理摘要、重点和待确认事项。', 'Organizes summaries, key points, and open items.',
    '要約する文章と、希望する長さを入力してください。', '请输入需要摘要的内容和期望长度。', 'Enter the content and preferred summary length.',
    'あなたは文書要約アシスタントです。入力だけを根拠に、要旨、重要事項、決定事項、未決事項を区別して整理してください。入力に存在しない情報を補完しないでください。数値、期限、担当者、条件は省略せず原文と照合できる形で示してください。',
    10
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    'MEETING_ACTIONS',
    '議事録と対応事項', '会议纪要与行动项', 'Minutes and action items',
    '会議メモから議事録、決定事項、担当と期限を整理します。', '根据会议记录整理纪要、决定和行动项。', 'Creates minutes, decisions, owners, and due dates from notes.',
    '会議メモや文字起こしを入力してください。', '请输入会议笔记或转写内容。', 'Enter meeting notes or a transcript.',
    'あなたは議事録作成アシスタントです。入力から議題、要点、決定事項、対応事項、担当者、期限、未決事項を分けて整理してください。担当者や期限が明示されていない場合は未定と表示してください。発言内容を事実として追加または推測しないでください。',
    20
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    'BUSINESS_EMAIL',
    '業務メール作成', '商务邮件起草', 'Business email drafting',
    '目的と相手に合わせた簡潔な業務メールを作成します。', '根据目的和收件人起草简洁的商务邮件。', 'Drafts concise business email for the purpose and recipient.',
    '宛先、目的、伝える内容、希望する文体を入力してください。', '请输入收件人、目的、主要内容和语气。', 'Enter the recipient, purpose, key points, and tone.',
    'あなたは業務メール作成アシスタントです。宛先、目的、伝える事実、依頼事項、期限、文体に基づいて件名と本文を作成してください。不足情報は推測せず、結果へ角括弧の入力欄として残してください。機密情報や誤送信の可能性がある場合は送信前確認事項を示してください。',
    30
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000003',
    'ISSUE_DECOMPOSITION',
    '課題分解', '问题分解', 'Issue decomposition',
    '曖昧な課題を目的、事実、論点、次の確認へ分解します。', '将模糊问题分解为目标、事实、论点和下一步。', 'Breaks an unclear issue into goals, facts, questions, and next checks.',
    '整理したい課題と現在分かっている事実を入力してください。', '请输入需要梳理的问题和已知事实。', 'Enter the issue and currently known facts.',
    'あなたは業務課題整理アシスタントです。課題を目的、確認済み事実、仮説、制約、関係者、論点、次に確認する事項へ分解してください。事実と推論を明確に区別してください。判断に必要な情報が不足する場合は優先度順の確認質問を提示してください。',
    10
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000003',
    'CHECKLIST_CREATION',
    '確認一覧作成', '检查清单生成', 'Checklist creation',
    '作業内容から実行順と確認観点を持つ一覧を作成します。', '根据工作内容生成带顺序和检查点的清单。', 'Creates an ordered checklist with verification points.',
    '対象作業、完了条件、制約を入力してください。', '请输入目标工作、完成条件和限制。', 'Enter the task, completion conditions, and constraints.',
    'あなたは業務確認一覧の作成アシスタントです。対象作業を準備、実行、確認、記録の順に分解し、各項目へ完了条件と確認証拠を付けてください。入力にない組織ルールを推測で追加しないでください。安全性や権限に関わる操作は担当者確認を明示してください。',
    20
  ),
  (
    '20000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000003',
    'COMPARISON_DECISION',
    '比較と判断材料整理', '比较与决策材料整理', 'Comparison and decision support',
    '複数案を同じ基準で比較し、判断材料を整理します。', '按统一标准比较多个方案并整理决策依据。', 'Compares options using common criteria and organizes decision evidence.',
    '比較する案、目的、重視する条件を入力してください。', '请输入备选方案、目标和重要条件。', 'Enter the options, goal, and important criteria.',
    'あなたは比較整理アシスタントです。各案を同じ評価基準で比較し、確認済み事実、利点、制約、リスク、未確認事項を表形式で整理してください。根拠がない点は不明と表示してください。最終判断は利用者が行えるよう、条件別の判断材料を提示してください。',
    30
  ),
  (
    '20000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000004',
    'OMISSION_REVIEW',
    '抜け漏れ確認', '遗漏检查', 'Omission review',
    '目的と必要項目に照らして不足や未記載を確認します。', '根据目标和必需项目检查遗漏。', 'Checks missing content against the stated purpose and required items.',
    '確認する文章と、目的や必須項目を入力してください。', '请输入需要检查的内容、目标和必需项目。', 'Enter the content, purpose, and required items.',
    'あなたは抜け漏れ確認アシスタントです。提示された目的、要件、確認基準だけを使用して、記載済み、未記載、不明、追加確認が必要な項目を整理してください。一般論を要件として追加しないでください。原文の該当箇所を短く示してください。',
    10
  ),
  (
    '20000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000004',
    'CONSISTENCY_REVIEW',
    '矛盾確認', '一致性检查', 'Consistency review',
    '文章内の数値、条件、用語、時系列の不一致を確認します。', '检查文字中的数字、条件、术语和时间顺序是否一致。', 'Checks inconsistencies in figures, conditions, terms, and chronology.',
    '確認する文章や複数の資料を入力してください。', '请输入需要检查的文字或多份材料。', 'Enter the text or documents to review.',
    'あなたは文書整合性確認アシスタントです。数値、日付、固有名詞、条件、用語、因果関係、時系列を照合し、矛盾の可能性を原文箇所とともに示してください。差異が意図的か判断できない場合は矛盾と断定せず確認事項として扱ってください。',
    20
  ),
  (
    '20000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000004',
    'FINAL_REVIEW',
    '提出前レビュー', '提交前审阅', 'Pre-submission review',
    '提出物の明確さ、完全性、表現、確認事項を最終点検します。', '最终检查提交材料的清晰度、完整性和表达。', 'Reviews clarity, completeness, wording, and open checks before submission.',
    '提出予定の内容、提出先、目的を入力してください。', '请输入拟提交内容、提交对象和目的。', 'Enter the submission, audience, and purpose.',
    'あなたは提出前レビューアシスタントです。提出先と目的に照らして、内容の明確さ、構成、表現、数値、期限、責任範囲、添付参照、未解決事項を点検してください。修正案と送信前に人が確認する事項を分けて示してください。法務、財務、人事、セキュリティ上の判断は専門担当者確認を明示してください。',
    30
  )
ON CONFLICT (id) DO NOTHING;

ALTER TABLE ai_assistant_sessions
  ADD COLUMN IF NOT EXISTS shortcut_id UUID
    REFERENCES ai_assistant_shortcuts(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS shortcut_prompt_snapshot TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_assistant_sessions_shortcut_snapshot_check'
  ) THEN
    ALTER TABLE ai_assistant_sessions
      ADD CONSTRAINT ai_assistant_sessions_shortcut_snapshot_check
      CHECK (
        (shortcut_id IS NULL AND shortcut_prompt_snapshot IS NULL)
        OR (
          shortcut_id IS NOT NULL
          AND length(btrim(shortcut_prompt_snapshot)) > 0
        )
      );
  END IF;
END
$$;
