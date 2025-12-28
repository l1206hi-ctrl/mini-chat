// state.js

// 하나의 메시지 예시:
// { id: number, role: "user" | "bot", text: string, createdAt: Date }

export const messages = [];

// 예전 단일 키 (기존 데이터 마이그레이션용)
const LEGACY_STORAGE_KEY = "mini-chat-messages";

// 현재 캐릭터 기준으로 storage key 만들기
function getStorageKey() {
  // currentCharacter가 아직 없으면 일단 "default"로
  const char = window.currentCharacter;
  const id = char && char.id ? char.id : "default";
  return `mini-chat-messages-${id}`;
}

export function saveMessages() {
  try {
    const json = JSON.stringify(messages);
    const key = getStorageKey();
    localStorage.setItem(key, json);
  } catch (err) {
    console.error("메시지 저장 실패:", err);
  }
}

export function loadMessages() {
  try {
    const key = getStorageKey();
    let json = localStorage.getItem(key);

     if (!json) {
      messages.length = 0;
      return;
    }

    const parsed = JSON.parse(json);
    
    messages.length = 0; // 기존 배열 비우고
    parsed.forEach((m) => {
      messages.push({
        ...m,
        createdAt: new Date(m.createdAt), // 날짜 복원
      });
    });
  } catch (err) {
    console.error("메시지 불러오기 실패:", err);
  }
}

let msgIdSeq = 1;

export function addMessage(role, text) {
  const newMessage = {
    id: `${Date.now()}-${msgIdSeq++}`,
    role,
    text,
    createdAt: new Date(),
  };

  messages.push(newMessage);
  saveMessages();
  return newMessage;
}

export function updateMessageText(id, newText) {
  const msg = messages.find((m) => m.id === id);
  if (!msg) return;

  msg.text = newText;
  saveMessages();
}

export function clearMessages() {
  messages.length = 0; // 배열 비우기

  try {
    const key = getStorageKey();
    localStorage.removeItem(key);
  } catch (err) {
    console.error("메시지 삭제 실패:", err);
  }
}
