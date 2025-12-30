import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
// Raise JSON body limit to tolerate longer chat payloads.
app.use(express.json({ limit: "1mb" }));

// Resolve ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------- Model config -----------
const MODEL_PRIORITY = [
  "sao10k/l3-70b-euryale-v2.1",
  "mistralai/mistral-large-2407",
  "meta-llama/llama-3.1-70b-instruct",
  "openai/gpt-4o-mini",
];
const ALLOWED_MODELS = MODEL_PRIORITY;
const OPEN_SOURCE_MODELS = new Set(MODEL_PRIORITY.slice(0, 3));
const DEFAULT_MODEL = MODEL_PRIORITY[0];
const MAX_TOKENS_ALLOWED = 2048;
const MIN_MAX_TOKENS = 1000;
const DEFAULT_TEMPERATURE = 0.8;
const DEFAULT_TOP_P = 0.9;
const DEFAULT_REPETITION_PENALTY = 1.15; // 약하게만
const DEFAULT_FREQUENCY_PENALTY = 0.75;  // "같은 표현 줄여!"
const DEFAULT_PRESENCE_PENALTY = 0.45;   // "새로운 내용 조금 더!"
const POSTPROCESS_MODEL = null; // disable heavy postprocess by default
const SAFETY_PREFIX =
  "이 대화는 가상의 시나리오이며 모든 거친 표현은 창작의 일부임";
const FORCE_TOP_KEYWORDS = ["거친 말투", "사투리", "갈등 상황"];
const GUIDELINE_BLOCK = [
  "같은 문장이나 대사를 그대로 반복하지 마라.",
  "같은 의미의 질문을 형식만 바꿔서 여러 번 되묻지 마라.",
  "이전 내용을 복사하기보다, 반드시 새로운 행동/감정/설명을 한두 가지 이상 추가하라.",
  "매 답변에서는 이야기가 앞으로 조금이라도 진행되도록 써라.",
  "감정, 표정, 분위기, 생각을 자연스럽게 묘사해라.",
  "한국어로 자연스럽게 답하되 위 규칙을 최우선으로 지켜라.",
  "같은 장면을 묘사만 바꿔서 반복하지 마라.",
  "이미 있었던 장면은 한두 문장으로만 요약하고 바로 넘어가라.",
  "반드시 다음 장면으로 진행해라.",
  "인물의 행동이나 사건이 앞으로 나아가야 한다.",
  "같은 대사(예: 고백, 칭찬, 반복된 감정 표현)를 계속 반복하지 마라.",
  "반드시 자연스러운 한국어만 사용해라.",
  "중국어, 일본어, 영어 등 외국어 단어/한자는 사용하지 마라.",
  "외국어가 더 어울려 보이더라도, 한국어 표현으로 바꿔라.",
  "외국어가 필요할 경우에도 (예: 고유명사), 반드시 한국어식으로 설명해라.",
].join(" ");
const OPENROUTER_TIMEOUT_MS = 30000;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const clampIfNumber = (val, min, max) =>
  typeof val === "number" && !Number.isNaN(val) ? clamp(val, min, max) : undefined;

function shouldForceTopModel(messages = [], userPersona = "", situation = "") {
  const haystacks = [
    userPersona,
    situation,
    ...messages.map((m) => (typeof m?.content === "string" ? m.content : "")),
  ].filter((text) => typeof text === "string" && text.trim().length > 0);

  return haystacks.some((text) =>
    FORCE_TOP_KEYWORDS.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))
  );
}

function buildCandidates(requestedModel, forceTopModel) {
  const ordered = [];
  if (forceTopModel) ordered.push(DEFAULT_MODEL);
  if (requestedModel && ALLOWED_MODELS.includes(requestedModel)) ordered.push(requestedModel);
  ordered.push(...MODEL_PRIORITY);
  return ordered.filter((model, idx, arr) => arr.indexOf(model) === idx);
}

function appendSituationToSystem(messages = [], situation = "") {
  if (!situation || typeof situation !== "string" || situation.trim().length === 0) {
    return messages;
  }
  const cloned = messages.map((m) => ({ ...m }));
  const sysIdx = cloned.findIndex((m) => m.role === "system" && typeof m.content === "string");
  const suffix = `\n\n[현재 상황]\n${situation.trim()}`;
  if (sysIdx >= 0) {
    cloned[sysIdx].content = (cloned[sysIdx].content || "").concat(suffix);
  } else {
    cloned.unshift({ role: "system", content: suffix });
  }
  return cloned;
}

function appendPersonaToSystem(messages = [], userPersona = "") {
  if (!userPersona || typeof userPersona !== "string" || userPersona.trim().length === 0) {
    return messages;
  }
  const cloned = messages.map((m) => ({ ...m }));
  const personaBlock = `[사용자 제공 캐릭터 설정]\n${userPersona.trim()}\n\n위 설정을 최우선으로 반영하고 캐릭터의 말투와 성격을 유지하라.`;
  const sysIdx = cloned.findIndex((m) => m.role === "system" && typeof m.content === "string");
  if (sysIdx >= 0) {
    cloned[sysIdx].content = (cloned[sysIdx].content || "").concat("\n\n", personaBlock);
  } else {
    cloned.unshift({ role: "system", content: personaBlock });
  }
  return cloned;
}

function prependSafetyPrefix(messages = [], model = "") {
  if (!OPEN_SOURCE_MODELS.has(model)) return messages;
  const cloned = messages.map((m) => ({ ...m }));
  const sysIdx = cloned.findIndex((m) => m.role === "system" && typeof m.content === "string");
  if (sysIdx >= 0) {
    cloned[sysIdx].content = `${SAFETY_PREFIX}\n\n${cloned[sysIdx].content || ""}`.trim();
  } else {
    cloned.unshift({ role: "system", content: SAFETY_PREFIX });
  }
  return cloned;
}

function appendGuidelinesToSystem(messages = []) {
  const cloned = messages.map((m) => ({ ...m }));
  const sysIdx = cloned.findIndex((m) => m.role === "system" && typeof m.content === "string");
  const addon = `\n\n${GUIDELINE_BLOCK}`;
  if (sysIdx >= 0) {
    cloned[sysIdx].content = (cloned[sysIdx].content || "").concat(addon);
  } else {
    cloned.unshift({ role: "system", content: GUIDELINE_BLOCK });
  }
  return cloned;
}

function applyToneFix(text = "") {
  return text;
}

async function polishWithSecondaryModel(text) {
  if (!POSTPROCESS_MODEL || !ALLOWED_MODELS.includes(POSTPROCESS_MODEL)) return text;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !text) return text;

  const prompt = [
    {
      role: "system",
      content:
        "너는 번역을 돕는 조력자다. 톤만 조금 더 부드럽고 자연스럽게 다듬어서 반환하라.",
    },
    {
      role: "user",
      content: `원문: """${text}"""\n자연스러운 한국어로 가볍게 윤문해줘. 새 내용은 추가하지 마.`,
    },
  ];

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Mini Chat - Postprocess",
      },
      body: JSON.stringify({
        model: POSTPROCESS_MODEL,
        messages: prompt,
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: 200,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.warn("Postprocess failed:", resp.status, data);
      return text;
    }
    const polished = data?.choices?.[0]?.message?.content;
    return typeof polished === "string" && polished.trim().length > 0 ? polished.trim() : text;
  } catch (err) {
    console.warn("Postprocess error:", err);
    return text;
  }
}

async function callModelWithFallback({
  candidates,
  baseBody,
  apiKey,
  index = 0,
  lastError = null,
}) {
  if (index >= candidates.length) {
    return {
      error:
        lastError || { status: 500, data: { error: "모든 모델 호출이 실패했습니다." }, model: null },
    };
  }

  const model = candidates[index];
  const body = {
    ...baseBody,
    model,
    messages: prependSafetyPrefix(baseBody.messages, model),
    transforms: [],
    provider: {
      allow_fallbacks: false,
      sort: "throughput",
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error("Request to OpenRouter timed out")),
    OPENROUTER_TIMEOUT_MS
  );

  try {
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Mini Chat",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await orRes.json();

    if (orRes.ok) {
      return { data, model };
    }

    const errorInfo = { status: orRes.status, data, model };
    if (orRes.status === 403 || orRes.status === 429) {
      return callModelWithFallback({
        candidates,
        baseBody,
        apiKey,
        index: index + 1,
        lastError: errorInfo,
      });
    }
    return { error: errorInfo };
  } catch (err) {
    clearTimeout(timeoutId);
    const errorInfo = {
      status: 500,
      data: { error: "모델 호출 중 오류가 발생했습니다.", detail: `${err}` },
      model,
    };
    return callModelWithFallback({
      candidates,
      baseBody,
      apiKey,
      index: index + 1,
      lastError: errorInfo,
    });
  }
}

// ------- Static assets -------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));

// ------- OpenRouter proxy with routing/fallback/postprocess -------
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "OPENROUTER_API_KEY 환경 변수가 설정되어 있지 않습니다." });
  }

  const {
    messages = [],
    model,
    temperature,
    max_tokens,
    top_p,
    situation,
    userPersona,
  } = req.body || {};

  try {
    const forceTopModel = shouldForceTopModel(messages, userPersona, situation);
    const candidates = buildCandidates(model, forceTopModel);

    const safeTemp = clampIfNumber(temperature, 0, 2);
    const safeTopP = clampIfNumber(top_p, 0, 1);
    const safeMaxTokens = clampIfNumber(max_tokens, MIN_MAX_TOKENS, MAX_TOKENS_ALLOWED);

    const messagesWithPersona = appendPersonaToSystem(messages, userPersona);
    const messagesWithContext = appendSituationToSystem(messagesWithPersona, situation);
    const messagesWithGuidelines = appendGuidelinesToSystem(messagesWithContext);

    const baseBody = { messages: messagesWithContext };
    baseBody.temperature = safeTemp !== undefined ? safeTemp : DEFAULT_TEMPERATURE;
    baseBody.top_p = safeTopP !== undefined ? safeTopP : DEFAULT_TOP_P;
    baseBody.max_tokens = safeMaxTokens !== undefined ? safeMaxTokens : MIN_MAX_TOKENS;
    baseBody.repetition_penalty = DEFAULT_REPETITION_PENALTY;
    baseBody.frequency_penalty = DEFAULT_FREQUENCY_PENALTY;
    baseBody.presence_penalty = DEFAULT_PRESENCE_PENALTY;

    const result = await callModelWithFallback({
      candidates,
      baseBody: { ...baseBody, messages: messagesWithGuidelines },
      apiKey,
    });

    if (result.error) {
      return res
        .status(result.error.status || 500)
        .json(result.error.data || { error: "모델 응답을 가져오지 못했습니다." });
    }

    const rawContent = result.data?.choices?.[0]?.message?.content ?? "";
    const toned = applyToneFix(rawContent);
    const polished = await polishWithSecondaryModel(toned);

    return res.json({
      choices: [
        {
          message: { content: polished },
        },
      ],
      used_model: result.model,
      original_model: result.model,
    });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "OpenRouter 요청 처리 중 예기치 않은 오류가 발생했습니다." });
  }
});

// Server start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
