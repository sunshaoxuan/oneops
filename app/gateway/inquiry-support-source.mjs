import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import { CookieJar } from "tough-cookie";

const htmlLimitBytes = 2 * 1024 * 1024;
const timeoutMs = 15_000;
const detailPathPattern = /^\/sssite\/upds\/helpdesk\/(\d+)\/$/;
const attachmentPathPattern =
  /^\/sssite\/upds\/helpdesk\/\d+\/attachment\/([^/]+)\/?$/;
const attachmentStorageOrigin =
  "https://scientiass.s3.amazonaws.com";

function normalizedText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function text(node) {
  return normalizedText(node?.textContent);
}

const formattedBlockTags = new Set([
  "ADDRESS",
  "ARTICLE",
  "BLOCKQUOTE",
  "DIV",
  "DL",
  "DT",
  "DD",
  "FIGCAPTION",
  "FIGURE",
  "LI",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TBODY",
  "TD",
  "TFOOT",
  "TH",
  "THEAD",
  "TR",
  "UL",
]);

function normalizeFormattedText(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formattedText(node) {
  function visit(current) {
    if (!current) return "";
    if (current.nodeType === 3) return current.nodeValue ?? "";
    if (current.nodeType !== 1) return "";
    if (["SCRIPT", "STYLE", "BUTTON"].includes(current.tagName)) return "";
    if (current.tagName === "BR") return "\n";
    const content = Array.from(current.childNodes).map(visit).join("");
    return formattedBlockTags.has(current.tagName)
      ? `\n${content}\n`
      : content;
  }
  return normalizeFormattedText(visit(node));
}

function textBeforeFirstBreak(node) {
  let value = "";
  for (const child of node?.childNodes ?? []) {
    if (child.nodeType === 1 && child.tagName === "BR") break;
    value += child.textContent ?? "";
  }
  return normalizedText(value) || text(node);
}

function stableKey(...parts) {
  return createHash("sha256")
    .update(parts.map(normalizedText).join("\u001f"), "utf8")
    .digest("hex")
    .slice(0, 32);
}

function parseDateFromText(value) {
  const raw = normalizedText(value);
  const match = raw.match(
    /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (!match) return null;
  const [, year, month, day, hour = "00", minute = "00", second = "00"] =
    match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:${second}+09:00`;
}

function fileType(name) {
  const extension = String(name).split(".").pop()?.toLowerCase();
  return extension && extension !== name.toLowerCase()
    ? extension.toUpperCase()
    : "FILE";
}

function parseAttachments(root, baseUrl) {
  return Array.from(root?.querySelectorAll?.("a[href]") ?? [])
    .map((anchor) => {
      const url = new URL(anchor.getAttribute("href"), baseUrl);
      const match = url.pathname.match(attachmentPathPattern);
      if (!match) return null;
      const name = text(anchor) || `attachment-${match[1]}`;
      return {
        id: match[1],
        name,
        type: fileType(name),
        size: null,
        contentType: null,
        parsingStatus: "PENDING",
        parsedText: "",
        parsingError: null,
        parser: "",
        parsedAt: null,
        truncated: false,
      };
    })
    .filter(Boolean);
}

function closestSectionText(heading) {
  if (!heading) return "";
  const container =
    heading.closest(".panel, .card, article, section, .well") ??
    heading.parentElement;
  if (!container) return "";
  const clone = container.cloneNode(true);
  for (const node of clone.querySelectorAll(
    "h1,h2,h3,h4,h5,h6,script,style,button,input,select,textarea",
  )) {
    node.remove();
  }
  return formattedText(clone);
}

function isCustomerFollowUpHeading(value) {
  const heading = normalizedText(value)
    .replace(/^[▼▽▶>]\s*/, "")
    .trim();
  if (/へのコメント\s*$/.test(heading)) return false;
  const unwrapped = heading.replace(/^\[\s*(.*?)\s*\]$/, "$1");
  return /^サポートセンターへの追加質問(?:\s*\(\d+\))?$/.test(
    unwrapped,
  );
}

function metadataValue(document, labels) {
  for (const row of document.querySelectorAll("tr, .form-group, dl")) {
    const rowText = text(row);
    const label = labels.find((item) => rowText.startsWith(item));
    if (!label) continue;
    const cells = Array.from(row.querySelectorAll("th,td,dt,dd"))
      .map(text)
      .filter(Boolean);
    const exactIndex = cells.findIndex((item) => item === label);
    if (exactIndex >= 0 && cells[exactIndex + 1]) {
      return cells[exactIndex + 1];
    }
    return rowText.slice(label.length).replace(/^[:：\s]+/, "").trim();
  }
  return "";
}

function metadataValueNode(root, labels) {
  for (const row of root?.querySelectorAll?.("tr, .form-group, dl") ?? []) {
    const cells = Array.from(row.querySelectorAll("th,td,dt,dd"));
    const exactIndex = cells.findIndex((item) =>
      labels.includes(text(item).replace(/[:：]$/, ""))
    );
    if (exactIndex >= 0 && cells[exactIndex + 1]) {
      return cells[exactIndex + 1];
    }
  }
  return null;
}

function participant(displayName) {
  const name = normalizedText(displayName);
  return name ? { id: null, displayName: name, role: "SUPPORT" } : null;
}

function supportRecordFromHeading({
  heading,
  ticketNo,
  currentUserName,
  baseUrl,
}) {
  const headingText = text(heading);
  const container =
    heading.closest(".panel, .card, article, section, .well") ??
    heading.parentElement;
  const containerText = text(container);
  const dateInfoLines = String(
    container?.querySelector?.(".mod_date_info")?.textContent ?? "",
  )
    .split(/\r?\n/)
    .map(normalizedText)
    .filter(Boolean);
  const createdAt =
    dateInfoLines.map(parseDateFromText).find(Boolean) ??
    parseDateFromText(containerText) ??
    parseDateFromText(text(heading.previousElementSibling)) ??
    "";
  const authorFromDateInfo =
    dateInfoLines.find((line) => !parseDateFromText(line)) ?? "";
  const authorNode = Array.from(
    container?.querySelectorAll?.("p,span,div,th,td,dt,dd") ?? [],
  ).find((node) => /^(?:回答者|担当者|投稿者|作成者)[:：]/.test(text(node)));
  const authorMatch =
    text(authorNode).match(
      /^(?:回答者|担当者|投稿者|作成者)[:：]\s*(.+)$/,
    ) ?? containerText.match(/([^\n]+?)\s+さん/);
  const authorName = normalizedText(
    authorFromDateInfo || authorMatch?.[1] || "",
  );
  const body =
    formattedText(container?.querySelector?.("td.message_body")) ||
    closestSectionText(heading);
  const publicReply = headingText.includes("サポートセンターからの回答");
  const internal = headingText.includes("ヘルプデスクコメント");
  const system = /変更履歴|ステータス変更|担当者変更/.test(headingText);
  const attachmentEvent = /添付ファイル/.test(headingText);
  if (!publicReply && !internal && !system && !attachmentEvent) return null;
  const kind = publicReply
    ? "CUSTOMER_VISIBLE_REPLY"
    : internal
      ? "INTERNAL_DISCUSSION"
      : attachmentEvent
        ? "ATTACHMENT_EVENT"
        : "SYSTEM_EVENT";
  const messageKey = stableKey(
    ticketNo,
    kind,
    createdAt,
    body,
  );
  return {
    messageKey,
    kind,
    author: system || attachmentEvent ? null : participant(authorName),
    relation: system || attachmentEvent
      ? "SYSTEM"
      : authorName &&
          normalizedText(authorName) === normalizedText(currentUserName)
        ? "CURRENT_USER"
        : "OTHER_SUPPORT",
    visibility: system || attachmentEvent
      ? "SYSTEM"
      : publicReply
        ? "CUSTOMER_VISIBLE"
        : "INTERNAL",
    createdAt,
    body,
    attachments: parseAttachments(container, baseUrl),
  };
}

export function parseInquirySearchHtml(html, baseUrl) {
  const document = new JSDOM(html, { url: baseUrl }).window.document;
  const table = document.querySelector("#id_table_incident_list");
  const resultText = text(table?.parentElement ?? document.body);
  const countMatch =
    resultText.match(/実際[^\d]{0,12}(\d+)\s*件/) ??
    resultText.match(/(?:全|該当)[^\d]{0,12}(\d+)\s*件/);
  const rows = Array.from(table?.querySelectorAll("tbody tr") ?? []);
  const tickets = rows
    .map((row) => {
      const cellNodes = Array.from(row.querySelectorAll("td"));
      const cells = cellNodes.map(text);
      const target =
        row.getAttribute("onclick") ??
        row.querySelector("[onclick]")?.getAttribute("onclick") ??
        "";
      const match = target.match(/['"]([^'"]*\/helpdesk\/\d+\/)['"]/);
      const href =
        row.querySelector('a[href*="/helpdesk/"]')?.getAttribute("href") ??
        match?.[1];
      if (!href) return null;
      const url = new URL(href, baseUrl);
      const ticketNo = url.pathname.match(detailPathPattern)?.[1];
      if (!ticketNo) return null;
      const dateLines = cells[4]?.split("\n") ?? [];
      return {
        ticketNo,
        title: cells[1] ?? "",
        assignee: cells[2] || null,
        status: cells[3] ?? "",
        updatedAt: parseDateFromText(dateLines[0]) ?? "",
        createdAt: parseDateFromText(dateLines[1]) ?? "",
        requestedReplyAt: parseDateFromText(cells[5]) ?? null,
        customer: textBeforeFirstBreak(cellNodes[6]),
      };
    })
    .filter(Boolean);
  const actualCount = countMatch ? Number(countMatch[1]) : tickets.length;
  return {
    actualCount,
    displayedCount: tickets.length,
    sourceTruncated: actualCount > tickets.length,
    tickets,
  };
}

export function parseInquiryOptionsHtml(html) {
  const document = new JSDOM(html).window.document;
  return {
    assignees: Array.from(document.querySelectorAll("#id_oc option"))
      .map((option) => ({
        value: String(option.value ?? "").trim(),
        label: text(option),
      }))
      .filter((option) => option.value && option.label),
  };
}

export function applyInquirySearchFilters(query, filters) {
  query.set("s", filters.status);
  query.set("oc", filters.assignee ?? "");
  if (filters.createdFrom || filters.createdTo) {
    query.set("cdc", "0");
    if (filters.createdFrom) query.set("cdb", filters.createdFrom);
    else query.delete("cdb");
    if (filters.createdTo) query.set("cde", filters.createdTo);
    else query.delete("cde");
  } else {
    query.delete("cdb");
    query.delete("cde");
  }

  query.set("k", filters.ticketNo || filters.content || "");
  if (filters.ticketNo) {
    query.set("sbi", "on");
    query.delete("cr");
  } else {
    query.delete("sbi");
    if (filters.content) query.set("cr", "on");
    else query.delete("cr");
  }
  return query;
}

export function inquiryDetailContains(detail, searchText) {
  const needle = normalizedText(searchText).toLocaleLowerCase();
  if (!needle) return true;
  const values = [
    detail.title,
    detail.customer?.name,
    detail.customer?.contactName,
    ...(detail.category ?? []),
    ...(detail.questionThreads ?? []).flatMap((thread) => [
      thread.customerQuestion?.body,
      ...(thread.messages ?? []).map((message) => message.body),
    ]),
  ];
  return values.some((value) =>
    normalizedText(value).toLocaleLowerCase().includes(needle)
  );
}

export function parseInquiryDetailHtml(html, sourceUrl) {
  const document = new JSDOM(html, { url: sourceUrl }).window.document;
  const source = new URL(sourceUrl);
  const ticketNo =
    source.pathname.match(detailPathPattern)?.[1] ??
    text(document.querySelector("h3")).match(/No\.\s*(\d+)/i)?.[1] ??
    "";
  const titleHeading = Array.from(document.querySelectorAll("h1,h2,h3"))
    .map(text)
    .find((value) => value.match(/No\.\s*\d+/i)) ?? "";
  const title = titleHeading.replace(/^.*?No\.\s*\d+\s*/i, "").trim();
  const pageText = text(document.body);
  const currentUserName =
    Array.from(document.querySelectorAll("a"))
      .map(text)
      .find((value) => value.endsWith("さん"))
      ?.replace(/さん$/, "")
      .trim() ?? "";
  const initialQuestionHeading = Array.from(
    document.querySelectorAll("h3,h4,h5"),
  ).find((node) =>
    /お問い合わせ内容|ご質問内容|質問内容/.test(text(node)),
  );
  const firstTable = document.querySelector("main table, #content table, table");
  const initialRoot =
    document.querySelector(".well_main_content") ??
    initialQuestionHeading?.parentElement ??
    firstTable;
  const initialBody =
    formattedText(initialRoot?.querySelector?.("td.message_body")) ||
    closestSectionText(initialQuestionHeading) ||
    formattedText(metadataValueNode(document, [
      "お問い合わせ内容",
      "ご質問内容",
      "質問内容",
    ])) ||
    metadataValue(document, ["お問い合わせ内容", "ご質問内容", "質問内容"]);
  const initialDateInfo = String(
    initialRoot?.querySelector?.(".mod_date_info")?.textContent ?? "",
  )
    .split(/\r?\n/)
    .map(normalizedText)
    .filter(Boolean)
    .map(parseDateFromText)
    .filter(Boolean);
  const initialCreatedAt =
    initialDateInfo[0] ??
    parseDateFromText(text(initialRoot)) ??
    parseDateFromText(metadataValue(document, ["登録日時", "作成日時"])) ??
    "";
  const questions = [
    {
      sequence: 1,
      createdAt: initialCreatedAt,
      requestedReplyAt:
        parseDateFromText(metadataValue(document, ["回答希望日", "希望回答日"])) ??
        null,
      body: initialBody,
      attachments: parseAttachments(initialRoot, sourceUrl),
      messages: [],
    },
  ];
  const recordHeadings = Array.from(document.querySelectorAll("h3,h4,h5")).filter(
    (node) => {
      const headingText = text(node);
      return (
        isCustomerFollowUpHeading(headingText) ||
        /サポートセンターからの回答|ヘルプデスクコメント|変更履歴|ステータス変更|担当者変更|添付ファイル/.test(
          headingText,
        )
      );
    },
  );
  for (const heading of recordHeadings) {
    const headingText = text(heading);
    if (isCustomerFollowUpHeading(headingText)) {
      const container =
        heading.closest(".panel, .card, article, section, .well") ??
        heading.parentElement;
      questions.push({
        sequence: questions.length + 1,
        createdAt: parseDateFromText(text(container)) ?? "",
        requestedReplyAt: null,
        body:
          formattedText(container?.querySelector?.("td.message_body")) ||
          closestSectionText(heading),
        attachments: parseAttachments(container, sourceUrl),
        messages: [],
      });
      continue;
    }
    const message = supportRecordFromHeading({
      heading,
      ticketNo,
      currentUserName,
      baseUrl: sourceUrl,
    });
    if (message) questions.at(-1).messages.push(message);
  }
  const attachments = parseAttachments(document, sourceUrl);
  const evaluationHeading = Array.from(
    document.querySelectorAll("h1,h2,h3,h4,h5,h6,strong"),
  ).find((node) => text(node) === "サポートサイトへの評価");
  const evaluationRoot =
    evaluationHeading?.closest(".well,section,article,.panel") ??
    evaluationHeading?.parentElement ??
    null;
  const evaluation = evaluationRoot
    ? {
        satisfaction: metadataValue(evaluationRoot, ["満足度"]),
        comment: formattedText(
          metadataValueNode(evaluationRoot, ["コメント"]),
        ),
        submittedAt:
          parseDateFromText(
            text(evaluationRoot.querySelector(".mod_date_info")),
          ) ?? null,
      }
    : null;
  const customerName = metadataValue(document, [
    "顧客",
    "お客様名",
    "顧客名",
    "会社名",
  ]);
  return {
    ticketNo,
    title,
    status:
      metadataValue(document, ["ステータス", "状態"]) ||
      pageText.match(/ステータス[:：]\s*([^\n]+)/)?.[1] ||
      "",
    subStatus: metadataValue(document, ["サブステータス", "子ステータス"]),
    assignee: participant(metadataValue(document, ["担当者", "対応者"])),
    customer: {
      id: null,
      name: customerName,
      contactName: metadataValue(document, [
        "質問者名",
        "ご担当者",
        "質問者",
      ]),
      email: metadataValue(document, [
        "返信用アドレス",
        "メール",
        "Email",
      ]),
      phone: metadataValue(document, ["電話番号", "電話", "TEL"]),
    },
    category: metadataValue(document, [
      "カテゴリー",
      "問合せ分類",
      "質問分類",
      "カテゴリ",
    ])
      .split(/[>／/]/)
      .map((item) => item.trim())
      .filter(Boolean),
    urgency: metadataValue(document, ["緊急度", "重要度"]) || null,
    inquiryLevel:
      metadataValue(document, [
        "問合せレベル",
        "問い合わせレベル",
        "問合レベル",
      ]) || null,
    createdAt:
      parseDateFromText(metadataValue(document, ["登録日時", "作成日時"])) ??
      initialCreatedAt,
    updatedAt:
      parseDateFromText(metadataValue(document, ["最終更新日時", "更新日時"])) ??
      initialDateInfo[1] ??
      "",
    requestedReplyAt:
      parseDateFromText(metadataValue(document, ["回答希望日", "希望回答日"])) ??
      null,
    attachments,
    evaluation,
    questionThreads: questions.map((question) => ({
      questionKey: stableKey(
        ticketNo,
        "CUSTOMER_QUESTION",
        question.createdAt,
        question.body,
      ),
      sequence: question.sequence,
      customerQuestion: {
        createdAt: question.createdAt,
        requestedReplyAt: question.requestedReplyAt,
        body: question.body,
        attachments: question.attachments,
      },
      messages: question.messages,
    })),
    sourceUrl,
  };
}

export function validateInquirySourceSettings(input) {
  const errors = {};
  let url;
  try {
    url = new URL(String(input?.baseUrl ?? ""));
    if (
      url.protocol !== "https:" ||
      url.hostname !== "ss.onehr.jp" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error("invalid source URL");
    }
  } catch {
    errors.baseUrl = "Source URL must be https://ss.onehr.jp/.";
  }
  const provider = String(input?.analysisProvider ?? "");
  if (!["MODEL", "AGENT_GATEWAY"].includes(provider)) {
    errors.analysisProvider = "Analysis provider is invalid.";
  }
  if (provider === "MODEL" && !input?.modelSettingId) {
    errors.modelSettingId = "Model is required.";
  }
  if (
    provider === "AGENT_GATEWAY" &&
    (!input?.agentGatewaySettingId || !input?.agentGatewayProjectRef)
  ) {
    errors.agentGateway = "Agent Gateway and project are required.";
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      baseUrl: url ? `${url.origin}/` : "",
      username: normalizedText(input?.username),
      password: String(input?.password ?? ""),
      enabled: input?.enabled !== false,
      analysisProvider: provider,
      modelSettingId: input?.modelSettingId || null,
      agentGatewaySettingId: input?.agentGatewaySettingId || null,
      agentGatewayProjectRef: normalizedText(input?.agentGatewayProjectRef),
    },
  };
}

export class InquirySourceClient {
  constructor({ fetchImpl = fetch } = {}) {
    this.fetchImpl = fetchImpl;
    this.sessions = new Map();
  }

  clearSession(settingId) {
    this.sessions.delete(String(settingId));
  }

  async request(settings, pathname, options = {}) {
    const base = new URL(settings.baseUrl);
    const url = new URL(pathname, base);
    const allowedRedirectOrigins = new Set(
      options.allowedRedirectOrigins ?? [],
    );
    if (
      (url.origin !== base.origin &&
        !allowedRedirectOrigins.has(url.origin)) ||
      url.protocol !== "https:"
    ) {
      const error = new Error("Inquiry source target is not allowed.");
      error.code = "INQUIRY_SOURCE_TARGET_NOT_ALLOWED";
      throw error;
    }
    const sessionKey = `${settings.id}:${settings.revision}`;
    let jar = this.sessions.get(sessionKey);
    if (!jar) {
      jar = new CookieJar();
      this.sessions.set(sessionKey, jar);
    }
    const {
      allowedRedirectOrigins: _allowedRedirectOrigins,
      ...fetchOptions
    } = options;
    const headers = new Headers(fetchOptions.headers);
    const cookie = await jar.getCookieString(url.href);
    if (cookie) headers.set("cookie", cookie);
    const response = await this.fetchImpl(url, {
      ...fetchOptions,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    for (const value of response.headers.getSetCookie?.() ?? []) {
      await jar.setCookie(value, url.href);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return response;
      return this.request(settings, new URL(location, url).href, {
        method: "GET",
        allowedRedirectOrigins: Array.from(allowedRedirectOrigins),
      });
    }
    return response;
  }

  async html(settings, pathname, options) {
    const response = await this.request(settings, pathname, options);
    if (!response.ok) {
      const error = new Error(`Inquiry source returned ${response.status}.`);
      error.code = "INQUIRY_SOURCE_REQUEST_FAILED";
      throw error;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > htmlLimitBytes) {
      const error = new Error("Inquiry source response is too large.");
      error.code = "INQUIRY_SOURCE_RESPONSE_TOO_LARGE";
      throw error;
    }
    return buffer.toString("utf8");
  }

  async ensureLogin(settings) {
    const landing = await this.html(settings, "/");
    const document = new JSDOM(landing, {
      url: settings.baseUrl,
    }).window.document;
    if (!document.querySelector('input[name="password"]')) return;
    const csrf =
      document.querySelector('input[name="csrfmiddlewaretoken"]')?.value ?? "";
    const body = new URLSearchParams({
      username: settings.username,
      password: settings.password,
      csrfmiddlewaretoken: csrf,
      next: "/sssite/upds/",
    });
    const result = await this.html(settings, "/sssite/auth/login/", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        referer: settings.baseUrl,
      },
      body,
    });
    if (new JSDOM(result).window.document.querySelector(
      'input[name="password"]',
    )) {
      this.clearSession(settings.id);
      const error = new Error("Inquiry source authentication failed.");
      error.code = "INQUIRY_SOURCE_AUTHENTICATION_FAILED";
      throw error;
    }
  }

  async search(settings, filters) {
    await this.ensureLogin(settings);
    const searchFormHtml = await this.html(
      settings,
      "/sssite/upds/helpdesk/",
    );
    const searchDocument = new JSDOM(searchFormHtml, {
      url: settings.baseUrl,
    }).window.document;
    const searchForm = searchDocument.querySelector("#id_search_form");
    const query = new URLSearchParams();
    for (const field of searchForm?.elements ?? []) {
      if (
        !field.name ||
        field.disabled ||
        ["button", "submit", "reset", "file"].includes(field.type) ||
        (["checkbox", "radio"].includes(field.type) && !field.checked)
      ) {
        continue;
      }
      query.append(field.name, field.value);
    }
    applyInquirySearchFilters(query, filters);
    const path = `/sssite/upds/helpdesk/?${query.toString()}`;
    const html = await this.html(settings, path);
    return parseInquirySearchHtml(html, new URL(path, settings.baseUrl).href);
  }

  async options(settings) {
    await this.ensureLogin(settings);
    return parseInquiryOptionsHtml(
      await this.html(settings, "/sssite/upds/helpdesk/"),
    );
  }

  async detail(settings, ticketNo) {
    await this.ensureLogin(settings);
    const path = `/sssite/upds/helpdesk/${encodeURIComponent(ticketNo)}/`;
    const url = new URL(path, settings.baseUrl).href;
    return parseInquiryDetailHtml(await this.html(settings, path), url);
  }

  async attachment(settings, ticketNo, attachmentId) {
    await this.ensureLogin(settings);
    return this.request(
      settings,
      `/sssite/upds/helpdesk/${encodeURIComponent(ticketNo)}/attachment/${encodeURIComponent(attachmentId)}/`,
      {
        allowedRedirectOrigins: [attachmentStorageOrigin],
      },
    );
  }
}
