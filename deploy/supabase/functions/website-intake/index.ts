const allowedOrigins = new Set([
  "https://hyunan.kr",
  "https://www.hyunan.kr",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
]);

const recipients = ["desk@hyunan.kr", "an@hyunan.kr", "100g1@hyunan.kr"];
const validMatterTypes = new Set(["부동산", "형사", "학교폭력", "민사·집행", "가사", "기타"]);

function cors(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "https://hyunan.kr";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8" } });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

Deno.serve(async request => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "허용되지 않은 요청입니다." }, 403, origin);

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return json({ error: "요청 형식이 올바르지 않습니다." }, 400, origin);
  }

  if (clean(input.company, 100)) return json({ ok: true }, 200, origin);
  const startedAt = Date.parse(clean(input.startedAt, 40));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500 || Date.now() - startedAt > 86_400_000) {
    return json({ error: "페이지를 새로고침한 뒤 다시 접수해 주세요." }, 400, origin);
  }

  const name = clean(input.name, 40);
  const phone = clean(input.phone, 30);
  const email = clean(input.email, 120);
  const matterType = clean(input.matterType, 30);
  const stage = clean(input.stage, 50);
  const opponent = clean(input.opponent, 80);
  const deadline = clean(input.deadline, 80);
  const summary = clean(input.summary, 1000);
  const pageUrl = clean(input.pageUrl, 300);

  if (!name || !phone || !summary || !validMatterTypes.has(matterType) || input.privacy !== true || input.notice !== true) {
    return json({ error: "필수 항목과 동의 여부를 확인해 주세요." }, 400, origin);
  }
  if (!/^[0-9+()\-\s]{8,30}$/.test(phone)) return json({ error: "연락처 형식을 확인해 주세요." }, 400, origin);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "이메일 형식을 확인해 주세요." }, 400, origin);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("INTAKE_EMAIL_FROM");
  if (!apiKey || !from) {
    console.error("Missing RESEND_API_KEY or INTAKE_EMAIL_FROM");
    return json({ error: "현재 온라인 접수 설정 중입니다." }, 503, origin);
  }

  const reference = `HY-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const fields = [
    ["접수번호", reference], ["성함", name], ["연락처", phone], ["이메일", email || "미입력"],
    ["사건 분야", matterType], ["현재 단계", stage || "미입력"], ["상대방", opponent || "미입력"],
    ["중요 일정", deadline || "미입력"], ["접수 페이지", pageUrl || "미확인"],
  ];
  const rows = fields.map(([label, value]) => `<tr><th style="text-align:left;padding:9px;border-bottom:1px solid #ddd;width:110px">${escapeHtml(label)}</th><td style="padding:9px;border-bottom:1px solid #ddd">${escapeHtml(value)}</td></tr>`).join("");
  const html = `<div style="font-family:Arial,'Noto Sans KR',sans-serif;color:#222;max-width:720px"><h2>현안 홈페이지 사건 문의</h2><table style="border-collapse:collapse;width:100%">${rows}</table><h3 style="margin-top:28px">문의 내용</h3><div style="white-space:pre-wrap;background:#f5f6f6;padding:18px">${escapeHtml(summary)}</div><p style="color:#777;font-size:12px;margin-top:24px">이 메일에는 법률상 비밀정보가 포함될 수 있습니다. 사무소 내부 담당자만 열람해 주세요.</p></div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": reference },
    body: JSON.stringify({ from, to: recipients, reply_to: email || "desk@hyunan.kr", subject: `[홈페이지 문의] ${matterType} / ${name} / ${reference}`, html }),
  });

  if (!response.ok) {
    console.error("Resend error", response.status, await response.text());
    return json({ error: "접수 메일 전송 중 오류가 발생했습니다." }, 502, origin);
  }
  return json({ ok: true, reference }, 200, origin);
});
