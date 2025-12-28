// api.js
import { messages } from "./state.js";
import { CHARACTERS, buildSystemPrompt } from "./characters.js";

// 프론트에서는 더 이상 API 키 필요 없음
const OPENROUTER_MODEL =
  "meta-llama/llama-3.1-70b-instruct";
const DEFAULT_TEMPERATURE = 0.7;   // ← 여기!!
const DEFAULT_TOP_P = 0.9;
const MAX_TOKENS = 512;

// --------------------------------------
// 대화 내역 → LLM용 히스토리로 변환
// --------------------------------------
function buildChatHistory(maxCount = 30) {
  const history = [];

  const char =
    window.currentCharacter ||
    (CHARACTERS && CHARACTERS[0]) ||
    null;

  // 캐릭터 설정을 system 프롬프트로 생성
  if (char) {
    const sys = buildSystemPrompt(char);
    if (sys) {
      history.push({
        role: "system",
        content: sys,
      });
    }
  }

  // 최근 maxCount개 메시지만 사용 (너무 길어지는 것 방지)
  const sliced = messages.slice(-maxCount);

  sliced.forEach((m) => {
    history.push({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    });
  });

  return history;
}

// --------------------------------------
// 실제 OpenRouter 호출 (진짜 AI)
// --------------------------------------
export async function requestAiReply() {
  const history = buildChatHistory();

  const res = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: history,
    temperature: DEFAULT_TEMPERATURE, // 예: 0.9
    top_p: DEFAULT_TOP_P,             // 예: 0.9
    max_tokens: MAX_TOKENS,           // 예: 512
  }),
});


  const data = await res.json();

  if (!res.ok) {
    console.error("LLM 호출 실패:", res.status, data);
    throw new Error(data?.error || "LLM 요청 실패");
  }

  // OpenRouter 형식: data.choices[0].message.content
  const content =
    data?.choices?.[0]?.message?.content ?? "(응답이 비었어 ㅠㅠ)";

  return content;
}

// --------------------------------------
// 샘플 로딩 (그대로 사용)
// --------------------------------------
export async function loadSampleMessages() {
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/comments?_limit=2"
  );
  if (!res.ok) throw new Error("샘플 데이터를 불러오지 못했어.");
  return res.json();
}

// --------------------------------------
// 임시 AI 응답 (테스트용 - 원하면 남겨두기)
// --------------------------------------
export async function fakeAiReply(messages) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content || "";

  const sys = messages.find((m) => m.role === "system");
  const sysSummary = sys ? " (캐릭터 설정 적용 예정)" : "";

  return `임시 응답${sysSummary}: "${userText}" 라고 했지? 나중엔 진짜 AI가 여기서 대답할 거야.`;
}
