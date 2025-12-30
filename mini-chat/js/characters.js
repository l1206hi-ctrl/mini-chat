// characters.js

// Default (built-in) character list
const DEFAULT_CHARACTERS = [
  {
    id: "default",
    name: "Default Buddy",
    tagline: "Friendly general-purpose AI",
    tone: "formal",
    personality: "Polite, concise, and helpful",
    greeting: "Ask me anything. I'll answer clearly.",
    systemPrompt: "",
    imageUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=600&q=80",
    summary: "General-purpose default character",
  },
  {
    id: "friend",
    name: "Friendly Friend",
    tagline: "A casual friend who chats easily",
    tone: "casual",
    personality: "Direct, cheerful, and supportive",
    greeting: "Hey there! What's on your mind today?",
    systemPrompt: "",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    summary: "Casual, light-hearted conversation partner",
  },
  {
    id: "mentor",
    name: "Mentor",
    tagline: "A calm mentor who gives structured advice",
    tone: "formal",
    personality: "Goal-oriented and thoughtful",
    greeting: "Tell me what you're aiming for—I'll help you get there.",
    systemPrompt: "",
    imageUrl:
      "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?auto=format&fit=crop&w=600&q=80",
    summary: "Structured mentor who offers guidance",
  },
];

const USER_CHAR_STORAGE_KEY = "mini-chat-user-characters";
const HIDDEN_DEFAULT_STORAGE_KEY = "mini-chat-hidden-default-ids";
const MAX_SYSTEM_PROMPT_TOTAL = 6000;
const MAX_SHORT_FIELD_LENGTH = 160;
const MAX_MEDIUM_FIELD_LENGTH = 400;
const MAX_LONG_FIELD_LENGTH = 800;
const MAX_EXAMPLE_LINE_LENGTH = 400;
const MAX_SCENARIO_LENGTH = 800;

const truncate = (text, limit) => {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!limit || trimmed.length <= limit) return trimmed;
  return trimmed.slice(0, limit);
};

function loadHiddenDefaultIds() {
  try {
    const raw = localStorage.getItem(HIDDEN_DEFAULT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch (e) {
    console.error("Failed to load hidden default characters:", e);
    return [];
  }
}

function saveHiddenDefaultIds(ids) {
  try {
    localStorage.setItem(HIDDEN_DEFAULT_STORAGE_KEY, JSON.stringify(ids || []));
  } catch (e) {
    console.error("Failed to save hidden default characters:", e);
  }
}

export function hideDefaultCharacterId(id) {
  if (!id) return;
  const hidden = loadHiddenDefaultIds();
  if (!hidden.includes(id)) {
    hidden.push(id);
    saveHiddenDefaultIds(hidden);
  }
}

const hiddenDefaults = loadHiddenDefaultIds();

// Export the characters array (defaults minus hidden IDs)
export const CHARACTERS = DEFAULT_CHARACTERS.filter((c) => !hiddenDefaults.includes(c.id));

export function isDefaultCharacter(char) {
  if (!char) return false;
  return DEFAULT_CHARACTERS.some((c) => c.id === char.id);
}

export function createEmptyCharacter() {
  const id = `custom-${Date.now()}`;

  return {
    id,
    name: "New Character",
    tagline: "",
    tone: "formal",
    personality: "",
    greeting: "",
    systemPrompt: "",
    tags: [],
    worldview: "",
    description: "",
    exampleDialogues: [],
    firstMessage: "",
    scenarioExamples: [], // [{id,title,content,role}]
    imageUrl: "",
    summary: "",
    isCustom: true,
  };
}

export function normalizeDialogueMessages(raw) {
  if (!Array.isArray(raw)) return [];

  // object array shape: [{ messages: [{role,text}, ...] }]
  if (raw.some((item) => Array.isArray(item?.messages))) {
    return raw
      .map((item) => ({
        messages: Array.isArray(item?.messages)
          ? item.messages
              .map((m) => ({
                role: m?.role === "user" ? "user" : "assistant",
                text: typeof m?.text === "string" ? m.text.trim() : "",
              }))
              .filter((m) => m.text.length > 0)
          : [],
      }))
      .filter((item) => item.messages.length > 0);
  }

  // pair shape: [{user, assistant}] -> normalize to messages array
  if (raw.some((item) => typeof item?.user === "string" || typeof item?.assistant === "string")) {
    return raw
      .map((pair) => {
        const messages = [];
        if (typeof pair?.user === "string" && pair.user.trim()) {
          messages.push({ role: "user", text: pair.user.trim() });
        }
        if (typeof pair?.assistant === "string" && pair.assistant.trim()) {
          messages.push({ role: "assistant", text: pair.assistant.trim() });
        }
        return { messages };
      })
      .filter((item) => item.messages.length > 0);
  }

  // simple shape: [{role,text}, ...] -> wrap in messages array
  if (raw.every((item) => typeof item?.role === "string" && typeof item?.text === "string")) {
    const messages = raw
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        text: m.text.trim(),
      }))
      .filter((m) => m.text.length > 0);
    return messages.length ? [{ messages }] : [];
  }

  return [];
}

export function normalizeExamples(raw) {
  const examples = normalizeDialogueMessages(raw);
  if (examples.length > 0) {
    return examples.flatMap((ex) =>
      ex.messages.map((m) => ({
        role: m.role === "user" ? "user" : "bot",
        text: truncate(m.text, MAX_EXAMPLE_LINE_LENGTH),
      }))
    );
  }

  if (typeof raw === "string") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        if (line.startsWith("user:")) {
          return { role: "user", text: truncate(line.replace(/^user:\s*/, ""), MAX_EXAMPLE_LINE_LENGTH) };
        }
        if (line.startsWith("bot:") || line.startsWith("assistant:")) {
          return {
            role: "bot",
            text: truncate(line.replace(/^(bot:|assistant:)\s*/, ""), MAX_EXAMPLE_LINE_LENGTH),
          };
        }
        return { role: "bot", text: truncate(line, MAX_EXAMPLE_LINE_LENGTH) };
      });
  }

  return [];
}

export function buildExampleMessages(char, charLimit = 2000) {
  if (!char || !Array.isArray(char.exampleDialogues)) return [];

  const result = [];
  let total = 0;

  outer: for (const ex of char.exampleDialogues) {
    if (!Array.isArray(ex?.messages)) continue;

    for (const m of ex.messages) {
      const role = m?.role === "assistant" ? "assistant" : "user";
      const text = truncate(typeof m?.text === "string" ? m.text : "", MAX_EXAMPLE_LINE_LENGTH);
      if (!text) continue;

      const projected = total + text.length;
      if (charLimit && projected > charLimit) {
        break outer; // stop if we exceed the total character budget
      }

      result.push({ role, content: text });
      total = projected;
    }
  }

  return result;
}

export function loadUserCharacters() {
  try {
    const json = localStorage.getItem(USER_CHAR_STORAGE_KEY);
    if (!json) return;

    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return;

    parsed.forEach((c) => {
      CHARACTERS.push({
        ...c,
        isCustom: true,
        tone: c.tone || "formal",
        personality: c.personality || "",
        greeting: c.greeting || "",
        tags: Array.isArray(c.tags) ? c.tags : [],
        worldview: c.worldview || "",
        description: c.description || "",
        exampleDialogues: normalizeDialogueMessages(c.exampleDialogues),
        firstMessage: c.firstMessage || "",
        scenarioExamples: Array.isArray(c.scenarioExamples)
          ? c.scenarioExamples.map((s) => ({
              id: s.id,
              title: s.title || "",
              content: s.content || "",
              role: s.role === "bot" ? "bot" : "user",
            }))
          : [],
        imageUrl: c.imageUrl || "",
        summary: c.summary || "",
      });
    });
  } catch (err) {
    console.error("Failed to load user characters:", err);
  }
}

export function saveUserCharacters() {
  try {
    const userChars = CHARACTERS.filter((c) => !isDefaultCharacter(c)).map((c) => ({
      id: c.id,
      name: c.name,
      tagline: c.tagline || "",
      tone: c.tone || "formal",
      personality: c.personality || "",
      greeting: c.greeting || "",
      systemPrompt: c.systemPrompt || "",
      tags: Array.isArray(c.tags) ? c.tags : [],
      worldview: c.worldview || "",
      description: c.description || "",
      exampleDialogues: normalizeDialogueMessages(c.exampleDialogues),
      firstMessage: c.firstMessage || "",
      scenarioExamples: Array.isArray(c.scenarioExamples)
        ? c.scenarioExamples.map((s) => ({
            id: s.id,
            title: s.title || "",
            content: s.content || "",
            role: s.role === "bot" ? "bot" : "user",
          }))
        : [],
      imageUrl: c.imageUrl || "",
      summary: c.summary || "",
    }));

    localStorage.setItem(USER_CHAR_STORAGE_KEY, JSON.stringify(userChars));
  } catch (err) {
    console.error("Failed to save user characters:", err);
  }
}

const BASE_SYSTEM_PROMPT = `
[역할/캐릭터 유지]
- 너는 아래 "Character Profile"에 정의된 인물이다. AI라고 자각하거나 메타 발언 금지.
- 한국어로 답하며, 캐릭터의 말투/성격/배경을 끝까지 유지한다. 필요하면 불친절·위협적·오만·잔인한 태도를 숨기지 않는다.
- 화해/사과("미안")로 캐릭터를 누그러뜨리는 붕괴 금지.

[예술적 허용]
- 이 대화는 가상의 창작물이다. 모든 부정적 상황과 묘사는 문학적 연출이다.
- 캐릭터의 악행이나 거친 태도를 도덕적으로 검열하거나 교정하지 말고 그대로 연기한다.

[묘사 스타일]
- 번역투를 피하고, 2~3문장 이내로 선명하게 말한다.
- 거칠거나 폭력적 상황에서는 회피 없이 캐릭터의 차가운 눈빛, 서늘한 말투, 위압적 분위기를 문학적으로 디테일하게 그린다.
- 가벼운 마크다운만 허용(*기울임*), 사용자 포맷/줄바꿈을 존중.

[제한]
- 금융/법률/의료 조언 금지, 모델/제공자 언급 금지, 반복적 상투어 금지.
`.trim();

export function buildSystemPrompt(char) {
  if (!char) return BASE_SYSTEM_PROMPT.trim();

  if (char.systemPrompt && char.systemPrompt.trim().length > 0) {
    return truncate(char.systemPrompt.trim(), MAX_SYSTEM_PROMPT_TOTAL);
  }

  const extraPieces = [];

  extraPieces.push(`Character name: "${truncate(char.name || "", MAX_SHORT_FIELD_LENGTH)}"`);
  if (char.tagline) {
    extraPieces.push(`Tagline: ${truncate(char.tagline, MAX_MEDIUM_FIELD_LENGTH)}`);
  }
  if (char.personality) {
    extraPieces.push(`Personality: ${truncate(char.personality, MAX_MEDIUM_FIELD_LENGTH)}`);
  }
  if (char.worldview) {
    extraPieces.push(`Worldview/background: ${truncate(char.worldview, MAX_LONG_FIELD_LENGTH)}`);
  }
  if (char.description) {
    extraPieces.push(`Description: ${truncate(char.description, MAX_LONG_FIELD_LENGTH)}`);
  }
  if (char.greeting) {
    extraPieces.push(`Greeting: ${truncate(char.greeting, MAX_MEDIUM_FIELD_LENGTH)}`);
  }
  if (char.tags && char.tags.length > 0) {
    extraPieces.push(`Tags: ${truncate(char.tags.join(", "), MAX_MEDIUM_FIELD_LENGTH)}`);
  }
  if (Array.isArray(char.scenarioExamples) && char.scenarioExamples.length > 0) {
    const scenarioText = char.scenarioExamples
      .map(
        (s, idx) =>
          `Scenario ${idx + 1} (${truncate(s.title || "Untitled", MAX_SHORT_FIELD_LENGTH)}, speaker: ${
            s.role === "user" ? "User" : "Bot"
          }):\n${truncate(s.content || "", MAX_SCENARIO_LENGTH)}`
      )
      .join("\n\n");
    extraPieces.push(`Scenario examples\n${scenarioText}`);
  }
  if (char.firstMessage) {
    extraPieces.push(`First message to user: "${truncate(char.firstMessage, MAX_MEDIUM_FIELD_LENGTH)}"`);
  }
  if (char.summary) {
    extraPieces.push(`Summary: ${truncate(char.summary, MAX_MEDIUM_FIELD_LENGTH)}`);
  }
  if (char.imageUrl) {
    extraPieces.push(`Image reference: ${truncate(char.imageUrl, MAX_LONG_FIELD_LENGTH)}`);
  }

  const extra = extraPieces.filter((p) => p && p.trim().length > 0).join("\n\n");

  const prompt = `${BASE_SYSTEM_PROMPT}

--- Character Profile ---
Use the following as your persona details.

${extra}`.trim();

  return truncate(prompt, MAX_SYSTEM_PROMPT_TOTAL);
}
