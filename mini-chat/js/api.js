// api.js
import { messages } from "./state.js";
import { CHARACTERS, buildExampleMessages, buildSystemPrompt } from "./characters.js";
import { getCurrentCharacter, getCurrentSituation, getUserPersona } from "./store.js";

// Let the server choose priority unless user explicitly sets; default to top-priority server logic.
const OPENROUTER_MODEL = null;
const DEFAULT_TEMPERATURE = 0.8;
const DEFAULT_TOP_P = 0.9;
const DEFAULT_REPETITION_PENALTY = 1.15; // 약하게만
const DEFAULT_FREQUENCY_PENALTY = 0.75;  // "같은 표현 줄여!"
const DEFAULT_PRESENCE_PENALTY = 0.45;   // "새로운 내용 조금 더!"
const MAX_TOKENS = 1200;
const EXAMPLE_DIALOGUE_CHAR_LIMIT = 1500;
const DEFAULT_SITUATION = "";
const HISTORY_CHAR_LIMIT = 6000;

function buildChatHistory(messageList = messages, maxCount = 30) {
  const history = [];

  const char =
    getCurrentCharacter() ||
    (CHARACTERS && CHARACTERS[0]) ||
    null;

  if (char) {
    const sys = buildSystemPrompt(char);
    if (sys) {
      history.push({
        role: "system",
        content: sys,
      });
    }

    const examples = buildExampleMessages(char, EXAMPLE_DIALOGUE_CHAR_LIMIT);
    if (examples.length > 0) {
      history.push(
        ...examples.map((ex) => ({
          ...ex,
          _isExample: true,
        }))
      );
    }
  }

  const source = Array.isArray(messageList) ? messageList : [];
  const sliced = source.slice(-Math.max(10, Math.min(20, maxCount)));

  sliced.forEach((m) => {
    history.push({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    });
  });

  return trimHistoryByChars(history, HISTORY_CHAR_LIMIT);
}

function trimHistoryByChars(history = [], limit = 6000) {
  if (!Array.isArray(history) || history.length === 0) return [];

  const sysIdx = history.findIndex((h) => h.role === "system");
  const systemMsg = sysIdx >= 0 ? history[sysIdx] : null;

  const examples = history.filter((h, idx) => idx !== sysIdx && h._isExample);
  const convo = history.filter((h, idx) => idx !== sysIdx && !h._isExample);

  let total = 0;
  const kept = [];

  const addIfFits = (msg) => {
    const text = typeof msg?.content === "string" ? msg.content : "";
    const len = text.length + (msg?.role?.length || 0);
    if (total + len > limit) return false;
    kept.push(msg);
    total += len;
    return true;
  };

  if (systemMsg) {
    addIfFits(systemMsg);
  }

  for (const ex of examples) {
    if (!addIfFits(ex)) break;
  }

  const convoReversed = [...convo].reverse();
  const convoKept = [];
  for (const m of convoReversed) {
    if (!addIfFits(m)) break;
    convoKept.push(m);
  }

  const convoFinal = convoKept.reverse();
  const result = [];
  kept.forEach((m) => {
    if (!m._isExample && m.role !== "system") {
      // skip; we'll append convoFinal below
    } else {
      result.push({ role: m.role, content: m.content });
    }
  });
  convoFinal.forEach((m) => {
    result.push({ role: m.role, content: m.content });
  });

  return result;
}

export async function requestAiReply(overrideMessages) {
  const history = buildChatHistory(overrideMessages || messages);
  const situation = (getCurrentSituation() || DEFAULT_SITUATION).slice(0, 1000);
  const userPersona = (getUserPersona() || "").slice(0, 1000);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: history,
      temperature: DEFAULT_TEMPERATURE,
      top_p: DEFAULT_TOP_P,
      max_tokens: MAX_TOKENS,
      repetition_penalty: DEFAULT_REPETITION_PENALTY,
      frequency_penalty: DEFAULT_FREQUENCY_PENALTY,
      presence_penalty: DEFAULT_PRESENCE_PENALTY,
      situation,
      userPersona,
    }),
  });

  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (e) {
    // Non-JSON payload (e.g., HTML error page)
  }

  if (!res.ok) {
    console.error("LLM request failed:", res.status, data || raw);
    const rawError =
      data?.error?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      data?.message ||
      null;
    let errMsg = rawError || `LLM request failed (${res.status})`;
    if (res.status === 403) {
      errMsg += " (check API key, model access, or quota)";
    } else if (res.status === 413) {
      errMsg = "입력이 너무 큽니다. 대화 길이를 줄이거나 메시지 수를 줄여주세요.";
    } else if (rawError && rawError.toLowerCase().includes("no endpoints found")) {
      errMsg += " (selected model is not available; try a different one)";
    }
    const err = new Error(errMsg);
    err.status = res.status;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content ?? "(No response from model)";
  const usedModel = data?.used_model || OPENROUTER_MODEL;
  if (usedModel) {
    console.info("Using model:", usedModel);
  }
  return content;
}
export async function fakeAiReply(msgs) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const lastUser = [...msgs].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content || "";

  const sys = msgs.find((m) => m.role === "system");
  const sysSummary = sys ? " (system prompt supplied)" : "";

  return `Pretend reply${sysSummary}: "${userText}" (mock mode).`;
}
