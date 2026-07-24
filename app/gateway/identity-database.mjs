import pg from "pg";
import {
  normalizeEmail,
  normalizeUsername,
  normalizeWindowsSubject,
  sha256,
  windowsAccountName,
} from "./auth.mjs";

const { Pool } = pg;

export function mapExternalIdentity(identity) {
  const provider = String(identity?.provider ?? "");
  const subject = String(identity?.subject ?? "");
  const metadata = identity?.metadata ?? {};
  const separator = subject.indexOf("\\");
  const windowsDomain =
    provider === "WINDOWS" && separator > 0
      ? subject.slice(0, separator)
      : "";
  const domainUsername =
    provider === "WINDOWS"
      ? separator > 0
        ? subject.slice(separator + 1)
        : windowsAccountName(subject)
      : "";
  return {
    provider,
    subject,
    windowsDomain,
    domainUsername,
    upn: provider === "WINDOWS"
      ? normalizeEmail(metadata.upn)
      : "",
  };
}

function businessError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function withTransaction(pool, action) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function mapUser(row) {
  return {
    id: String(row.id),
    username: String(row.username ?? ""),
    email: String(row.email ?? ""),
    displayName: String(row.display_name ?? ""),
    status: String(row.status ?? "PENDING"),
    locale: String(row.locale ?? "ja-JP"),
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    lastLoginAt: row.last_login_at?.toISOString?.() ?? row.last_login_at ?? null,
  };
}

async function assignRole(executor, userId, roleCode, actorUserId = null) {
  const result = await executor.query(
    `INSERT INTO user_role_assignments (
       user_id, role_id, organization_id, created_by_user_id
     )
     SELECT $1, role.id, NULL, $3
     FROM roles AS role
     WHERE role.code = $2
     ON CONFLICT (user_id, role_id, organization_id) DO NOTHING
     RETURNING id`,
    [userId, roleCode, actorUserId],
  );
  if (!result.rowCount) {
    const role = await executor.query("SELECT id FROM roles WHERE code = $1", [
      roleCode,
    ]);
    if (!role.rowCount) throw businessError("ROLE_NOT_FOUND", "Role not found");
  }
}

export function createIdentityRepository(connectionString, onPoolError) {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => onPoolError?.(error));

  return {
    async bootstrapState() {
      const result = await pool.query(
        "SELECT NOT EXISTS (SELECT 1 FROM users) AS required",
      );
      return { required: Boolean(result.rows[0]?.required) };
    },

    async registerLocal({ username, email, displayName, passwordHash }) {
      return withTransaction(pool, async (client) => {
        await client.query("LOCK TABLE users IN EXCLUSIVE MODE");
        const count = await client.query("SELECT COUNT(*)::integer AS count FROM users");
        const bootstrap = Number(count.rows[0]?.count ?? 0) === 0;
        try {
          const saved = await client.query(
            `INSERT INTO users (username, email, display_name, status)
             VALUES ($1, NULLIF($2, ''), $3, $4)
             RETURNING *`,
            [
              normalizeUsername(username),
              normalizeEmail(email),
              displayName,
              bootstrap ? "ACTIVE" : "PENDING",
            ],
          );
          const user = saved.rows[0];
          await client.query(
            `INSERT INTO auth_identities (
               user_id, provider, subject, subject_normalized, password_hash
             )
             VALUES ($1, 'LOCAL', $2, $2, $3)`,
            [user.id, normalizeUsername(username), passwordHash],
          );
          await assignRole(client, user.id, bootstrap ? "SYSTEM_ADMIN" : "VIEWER");
          return { user: mapUser(user), bootstrap };
        } catch (error) {
          if (error?.code === "23505") {
            throw businessError(
              "REGISTRATION_CONFLICT",
              "Username or email already exists",
            );
          }
          throw error;
        }
      });
    },

    async localCredential(login) {
      const normalized = normalizeUsername(login);
      const email = normalizeEmail(login);
      const result = await pool.query(
        `SELECT user_record.*, identity.password_hash, identity.id AS identity_id
         FROM users AS user_record
         JOIN auth_identities AS identity
           ON identity.user_id = user_record.id
          AND identity.provider = 'LOCAL'
         WHERE lower(user_record.username) = $1
            OR lower(COALESCE(user_record.email, '')) = $2
         LIMIT 1`,
        [normalized, email],
      );
      if (!result.rows[0]) return null;
      return {
        user: mapUser(result.rows[0]),
        passwordHash: result.rows[0].password_hash,
        identityId: String(result.rows[0].identity_id),
      };
    },

    async markLogin(userId, identityId) {
      await pool.query(
        `UPDATE users SET last_login_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [userId],
      );
      await pool.query(
        `UPDATE auth_identities SET last_login_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [identityId],
      );
    },

    async updateProfile(userId, { displayName }) {
      const result = await pool.query(
        `UPDATE users
            SET display_name = $2,
                display_name_overridden = true,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *`,
        [userId, String(displayName ?? "").trim()],
      );
      if (!result.rows[0]) {
        throw businessError("USER_NOT_FOUND", "User not found");
      }
      return mapUser(result.rows[0]);
    },

    async provisionWindows({
      subject,
      upn,
      displayName,
      email,
      department,
      title,
    }) {
      return withTransaction(pool, async (client) => {
        const normalized = normalizeWindowsSubject(subject);
        const existing = await client.query(
          `SELECT user_record.*, identity.id AS identity_id
           FROM auth_identities AS identity
           JOIN users AS user_record ON user_record.id = identity.user_id
           WHERE identity.provider = 'WINDOWS'
             AND identity.subject_normalized = $1
           FOR UPDATE`,
          [normalized],
        );
        if (existing.rows[0]) {
          await client.query(
            `UPDATE users SET
               display_name = CASE
                 WHEN display_name_overridden THEN display_name
                 ELSE COALESCE(NULLIF($2, ''), display_name)
               END,
               email = COALESCE(NULLIF($3, ''), email),
               last_login_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [
              existing.rows[0].id,
              String(displayName ?? "").trim(),
              normalizeEmail(email),
            ],
          );
          await client.query(
            `UPDATE auth_identities SET
               subject = $2,
               metadata = $3::jsonb,
               last_login_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [
              existing.rows[0].identity_id,
              subject,
              JSON.stringify({ upn, displayName, email, department, title }),
            ],
          );
          return {
            user: {
              ...mapUser(existing.rows[0]),
              displayName: displayName || existing.rows[0].display_name,
              email: normalizeEmail(email) || existing.rows[0].email || "",
            },
            created: false,
            bootstrap: false,
          };
        }

        await client.query("LOCK TABLE users IN EXCLUSIVE MODE");
        const normalizedLinkEmail = normalizeEmail(email);
        const linkedUser = normalizedLinkEmail
          ? await client.query(
              `SELECT *
                 FROM users
                WHERE lower(email) = $1
                FOR UPDATE`,
              [normalizedLinkEmail],
            )
          : { rows: [] };
        if (linkedUser.rows[0]) {
          const saved = await client.query(
            `UPDATE users SET
               display_name = CASE
                 WHEN display_name_overridden THEN display_name
                 ELSE COALESCE(NULLIF($2, ''), display_name)
               END,
               status = CASE
                 WHEN status = 'PENDING' THEN 'ACTIVE'
                 ELSE status
               END,
               last_login_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [
              linkedUser.rows[0].id,
              String(displayName ?? "").trim(),
            ],
          );
          const identity = await client.query(
            `INSERT INTO auth_identities (
               user_id, provider, subject, subject_normalized, metadata,
               last_login_at
             )
             VALUES ($1, 'WINDOWS', $2, $3, $4::jsonb, CURRENT_TIMESTAMP)
             RETURNING id`,
            [
              saved.rows[0].id,
              subject,
              normalized,
              JSON.stringify({ upn, displayName, email, department, title }),
            ],
          );
          return {
            user: mapUser(saved.rows[0]),
            identityId: String(identity.rows[0].id),
            created: false,
            identityLinked: true,
            bootstrap: false,
          };
        }
        const baseUsername = normalizeUsername(windowsAccountName(subject))
          .replace(/[^a-z0-9._:@-]/g, "")
          .padEnd(3, "0");
        let username = baseUsername;
        let suffix = 1;
        while (
          (
            await client.query(
              "SELECT 1 FROM users WHERE lower(username) = $1",
              [username],
            )
          ).rowCount
        ) {
          suffix += 1;
          username = `${baseUsername}.${suffix}`;
        }
        const saved = await client.query(
          `INSERT INTO users (
             username, email, display_name, status, last_login_at
           )
           VALUES ($1, NULLIF($2, ''), $3, 'ACTIVE', CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            username,
            normalizeEmail(email),
            String(displayName ?? "").trim() || windowsAccountName(subject),
          ],
        );
        const identity = await client.query(
          `INSERT INTO auth_identities (
             user_id, provider, subject, subject_normalized, metadata,
             last_login_at
           )
           VALUES ($1, 'WINDOWS', $2, $3, $4::jsonb, CURRENT_TIMESTAMP)
           RETURNING id`,
          [
            saved.rows[0].id,
            subject,
            normalized,
            JSON.stringify({ upn, displayName, email, department, title }),
          ],
        );
        await assignRole(client, saved.rows[0].id, "VIEWER");
        return {
          user: mapUser(saved.rows[0]),
          identityId: String(identity.rows[0].id),
          created: true,
          bootstrap: false,
        };
      });
    },

    async createSession({ userId, token, csrfToken, expiresAt, clientIp, userAgent }) {
      const result = await pool.query(
        `INSERT INTO auth_sessions (
           user_id, token_hash, csrf_hash, expires_at, client_ip, user_agent
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          userId,
          sha256(token),
          sha256(csrfToken),
          expiresAt,
          String(clientIp ?? "").slice(0, 100),
          String(userAgent ?? "").slice(0, 500),
        ],
      );
      return String(result.rows[0].id);
    },

    async resolveSession(token) {
      const result = await pool.query(
        `SELECT session.id AS session_id, session.csrf_hash, user_record.*
         FROM auth_sessions AS session
         JOIN users AS user_record ON user_record.id = session.user_id
         WHERE session.token_hash = $1
           AND session.revoked_at IS NULL
           AND session.expires_at > CURRENT_TIMESTAMP
         LIMIT 1`,
        [sha256(token)],
      );
      if (!result.rows[0]) return null;
      const row = result.rows[0];
      const permissions = await pool.query(
        `SELECT assignment.organization_id, permission.code
         FROM user_role_assignments AS assignment
         JOIN roles AS role_record ON role_record.id = assignment.role_id
         JOIN role_permissions AS role_permission
           ON role_permission.role_id = role_record.id
         JOIN permissions AS permission
           ON permission.id = role_permission.permission_id
         WHERE assignment.user_id = $1`,
        [row.id],
      );
      const identities = await pool.query(
        `SELECT provider, subject, metadata
           FROM auth_identities
          WHERE user_id = $1
          ORDER BY provider, subject_normalized`,
        [row.id],
      );
      const systemPermissions = new Set();
      const organizationPermissions = {};
      for (const permission of permissions.rows) {
        if (permission.organization_id === null) {
          systemPermissions.add(permission.code);
          continue;
        }
        const organizationId = String(permission.organization_id);
        organizationPermissions[organizationId] ??= new Set();
        organizationPermissions[organizationId].add(permission.code);
      }
      await pool.query(
        `UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND last_seen_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes'`,
        [row.session_id],
      );
      return {
        ...mapUser(row),
        sessionId: String(row.session_id),
        csrfHash: row.csrf_hash,
        identities: identities.rows.map(mapExternalIdentity),
        systemPermissions: [...systemPermissions],
        organizationPermissions: Object.fromEntries(
          Object.entries(organizationPermissions).map(([key, value]) => [
            key,
            [...value],
          ]),
        ),
      };
    },

    async revokeSession(sessionId) {
      await pool.query(
        `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND revoked_at IS NULL`,
        [sessionId],
      );
    },

    async createLoginTicket({ userId, token, returnPath, expiresAt }) {
      await pool.query(
        `INSERT INTO sso_login_tickets (
           user_id, token_hash, return_path, expires_at
         )
         VALUES ($1, $2, $3, $4)`,
        [userId, sha256(token), returnPath, expiresAt],
      );
    },

    async consumeLoginTicket(token) {
      return withTransaction(pool, async (client) => {
        const result = await client.query(
          `UPDATE sso_login_tickets
           SET consumed_at = CURRENT_TIMESTAMP
           WHERE token_hash = $1
             AND consumed_at IS NULL
             AND expires_at > CURRENT_TIMESTAMP
           RETURNING user_id, return_path`,
          [sha256(token)],
        );
        return result.rows[0]
          ? {
              userId: String(result.rows[0].user_id),
              returnPath: result.rows[0].return_path,
            }
          : null;
      });
    },

    async listUsers() {
      const users = await pool.query(
        `SELECT user_record.*,
           COALESCE(
             jsonb_agg(DISTINCT jsonb_build_object(
               'provider', identity.provider,
               'subject', identity.subject,
               'metadata', identity.metadata
             )) FILTER (WHERE identity.id IS NOT NULL),
             '[]'::jsonb
           ) AS identities
         FROM users AS user_record
         LEFT JOIN auth_identities AS identity
           ON identity.user_id = user_record.id
         GROUP BY user_record.id
         ORDER BY user_record.created_at, user_record.username`,
      );
      const assignments = await pool.query(
        `SELECT assignment.id, assignment.user_id, assignment.organization_id,
           role_record.id AS role_id, role_record.code AS role_code,
           role_record.name AS role_name,
           organization.code AS organization_code,
           organization.name AS organization_name
         FROM user_role_assignments AS assignment
         JOIN roles AS role_record ON role_record.id = assignment.role_id
         LEFT JOIN organizations AS organization
           ON organization.id = assignment.organization_id
         ORDER BY role_record.code, organization.code`,
      );
      return users.rows.map((row) => ({
        ...mapUser(row),
        identities: row.identities.map(mapExternalIdentity),
        roleAssignments: assignments.rows
          .filter((item) => String(item.user_id) === String(row.id))
          .map((item) => ({
            id: String(item.id),
            roleId: String(item.role_id),
            roleCode: item.role_code,
            roleName: item.role_name,
            organizationId:
              item.organization_id === null
                ? null
                : String(item.organization_id),
            organizationCode: item.organization_code ?? "",
            organizationName: item.organization_name ?? "",
          })),
      }));
    },

    async updateUser(userId, { status, roleAssignments }, actorUserId) {
      return withTransaction(pool, async (client) => {
        const current = await client.query(
          "SELECT * FROM users WHERE id = $1 FOR UPDATE",
          [userId],
        );
        if (!current.rows[0]) throw businessError("USER_NOT_FOUND", "User not found");
        if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) {
          throw businessError("USER_STATUS_INVALID", "Invalid user status");
        }
        await client.query(
          `UPDATE users SET status = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [userId, status],
        );
        await client.query(
          "DELETE FROM user_role_assignments WHERE user_id = $1",
          [userId],
        );
        for (const assignment of roleAssignments) {
          const roleId = String(assignment?.roleId ?? "");
          const organizationId = assignment?.organizationId || null;
          const inserted = await client.query(
            `INSERT INTO user_role_assignments (
               user_id, role_id, organization_id, created_by_user_id
             )
             SELECT $1, role.id, $3, $4
             FROM roles AS role
             WHERE role.id = $2 AND role.assignable = true
             RETURNING id`,
            [userId, roleId, organizationId, actorUserId],
          );
          if (!inserted.rowCount) {
            throw businessError("ROLE_NOT_FOUND", "Role not found");
          }
        }
        await client.query(
          `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND revoked_at IS NULL`,
          [userId],
        );
        return mapUser({ ...current.rows[0], status });
      });
    },

    async listRoles() {
      const result = await pool.query(
        `SELECT role_record.*,
           COALESCE(
             array_agg(permission.code ORDER BY permission.code)
               FILTER (WHERE permission.code IS NOT NULL),
             ARRAY[]::text[]
           ) AS permission_codes
         FROM roles AS role_record
         LEFT JOIN role_permissions AS role_permission
           ON role_permission.role_id = role_record.id
         LEFT JOIN permissions AS permission
           ON permission.id = role_permission.permission_id
         GROUP BY role_record.id
         ORDER BY role_record.system_role DESC, role_record.code`,
      );
      return result.rows.map((row) => ({
        id: String(row.id),
        code: row.code,
        name: row.name,
        description: row.description,
        systemRole: row.system_role,
        assignable: row.assignable,
        permissionCodes: row.permission_codes,
      }));
    },

    async listPermissions() {
      const result = await pool.query(
        `SELECT id, code, resource, action, name, description
         FROM permissions ORDER BY code`,
      );
      return result.rows.map((row) => ({ ...row, id: String(row.id) }));
    },

    async saveRole(roleId, role) {
      return withTransaction(pool, async (client) => {
        let saved;
        if (roleId) {
          const current = await client.query(
            "SELECT * FROM roles WHERE id = $1 FOR UPDATE",
            [roleId],
          );
          if (!current.rows[0]) throw businessError("ROLE_NOT_FOUND", "Role not found");
          if (current.rows[0].code === "SYSTEM_ADMIN") {
            throw businessError(
              "SYSTEM_ADMIN_IMMUTABLE",
              "System administrator role cannot be modified",
            );
          }
          saved = await client.query(
            `UPDATE roles SET name = $2, description = $3,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 RETURNING *`,
            [roleId, role.name, role.description],
          );
        } else {
          try {
            saved = await client.query(
              `INSERT INTO roles (code, name, description)
               VALUES ($1, $2, $3) RETURNING *`,
              [role.code, role.name, role.description],
            );
          } catch (error) {
            if (error?.code === "23505") {
              throw businessError("ROLE_CONFLICT", "Role Code already exists");
            }
            throw error;
          }
          roleId = saved.rows[0].id;
        }
        const permissions = await client.query(
          "SELECT id, code FROM permissions WHERE code = ANY($1::text[])",
          [role.permissionCodes],
        );
        if (permissions.rowCount !== role.permissionCodes.length) {
          throw businessError("PERMISSION_NOT_FOUND", "Permission not found");
        }
        await client.query("DELETE FROM role_permissions WHERE role_id = $1", [
          roleId,
        ]);
        for (const permission of permissions.rows) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2)`,
            [roleId, permission.id],
          );
        }
        return {
          id: String(roleId),
          code: saved.rows[0].code,
          name: saved.rows[0].name,
          description: saved.rows[0].description,
          systemRole: saved.rows[0].system_role,
          assignable: saved.rows[0].assignable,
          permissionCodes: role.permissionCodes,
        };
      });
    },

    async audit({
      actorUserId = null,
      eventType,
      targetType = "",
      targetId = null,
      requestIp = "",
      userAgent = "",
      details = {},
    }) {
      await pool.query(
        `INSERT INTO auth_audit_events (
           actor_user_id, event_type, target_type, target_id,
           request_ip, user_agent, details
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [
          actorUserId,
          eventType,
          targetType,
          targetId,
          String(requestIp).slice(0, 100),
          String(userAgent).slice(0, 500),
          JSON.stringify(details),
        ],
      );
    },

    async listAudit(limit = 200) {
      const result = await pool.query(
        `SELECT event.id, event.event_type, event.target_type, event.target_id,
           event.request_ip, event.details, event.created_at,
           actor.username AS actor_username,
           actor.display_name AS actor_display_name
         FROM auth_audit_events AS event
         LEFT JOIN users AS actor ON actor.id = event.actor_user_id
         ORDER BY event.created_at DESC
         LIMIT $1`,
        [Math.min(500, Math.max(1, Number(limit) || 200))],
      );
      return result.rows.map((row) => ({
        id: String(row.id),
        eventType: row.event_type,
        targetType: row.target_type,
        targetId: row.target_id ? String(row.target_id) : null,
        requestIp: row.request_ip,
        details: row.details,
        createdAt: row.created_at?.toISOString?.() ?? row.created_at,
        actorUsername: row.actor_username ?? "",
        actorDisplayName: row.actor_display_name ?? "",
      }));
    },

    async close() {
      await pool.end();
    },
  };
}
