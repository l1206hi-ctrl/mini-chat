// events.js
// 버튼/키보드 이벤트만 담당하는 파일

import { sendChat, loadSamples } from "./chatFlow.js";

const inputEl = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const sampleBtn = document.getElementById("sampleBtn");

if (!inputEl || !sendBtn || !sampleBtn) {
  throw new Error("필수 DOM 요소를 찾을 수 없습니다.");
}

// ----------------------
// 외부에서 한 번만 호출하면 됨
// ----------------------
export function setupEvents() {
  // 전송 버튼
  sendBtn.addEventListener("click", async () => {
    await runSend();
  });

  // 샘플 버튼
  sampleBtn.addEventListener("click", async () => {
    await runSample();
  });

  // 엔터 / Shift+Enter 처리
  inputEl.addEventListener("keydown", async (e) => {
    // 조합 입력(한글 IME) 중이면 무시
    if (e.isComposing) return;
    if (e.key !== "Enter") return;

    // Shift + Enter → 줄바꿈
    if (e.shiftKey) {
      e.preventDefault();

      const { selectionStart, selectionEnd, value } = inputEl;
      const before = value.slice(0, selectionStart);
      const after = value.slice(selectionEnd);

      inputEl.value = before + "\n" + after;
      const pos = selectionStart + 1;
      inputEl.selectionStart = pos;
      inputEl.selectionEnd = pos;
      return;
    }

    // 그냥 Enter → 전송
    e.preventDefault();
    await runSend();
  });
}

// ----------------------
// UI 잠그기 / 풀기 + chatFlow 호출
// ----------------------
async function runSend() {
  const text = inputEl.value;
  if (!text.trim()) return;

  inputEl.value = "";

  lockUI();
  try {
    await sendChat(text);
  } finally {
    unlockUI();
  }
}

async function runSample() {
  lockUI();
  try {
    await loadSamples();
  } finally {
    unlockUI();
  }
}

function lockUI() {
  sendBtn.disabled = true;
  sampleBtn.disabled = true;
}

function unlockUI() {
  sendBtn.disabled = false;
  sampleBtn.disabled = false;
}


