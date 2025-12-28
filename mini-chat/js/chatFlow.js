// chatFlow.js
// "채팅 한 번 보내기"와 "샘플 불러오기"만 담당하는 파일입니다.

import {
  addMessage,
  clearMessages,
  updateMessageText,
} from "./state.js";

import {
  showThinking,
  hideThinking,
  renderMessages,
} from "./ui.js";

import {
  requestAiReply,
  loadSampleMessages,
} from "./api.js";

let isWaiting = false; // 한 번에 하나만 보내도록 막는 플래그

// 작은 유틸: 잠깐 쉬기
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 텍스트를 한 글자씩 찍는 효과 (귀찮으면 안 써도 됨)
async function typeText(messageId, fullText) {
  let current = "";

  for (const ch of fullText) {
    current += ch;
    updateMessageText(messageId, current);
    renderMessages();
    await sleep(25); // 속도 조절
  }
}

// ==============================
// 1) 채팅 전송
// ==============================
export async function sendChat(rawText) {
  // 이미 보내는 중이면 무시
  if (isWaiting) return;

  const text = (rawText || "").trim();
  if (!text) return;

  // 특수 명령: clear
  if (text === "clear" || text === "/clear") {
    clearMessages();
    renderMessages();
    addMessage("bot", "채팅을 싹 비웠어! 🧹");
    renderMessages();
    return;
  }

  isWaiting = true;
  showThinking();

  try {
    // 1) 유저 메시지 추가
    addMessage("user", text);
    renderMessages();

    // 2) 서버에 AI 응답 요청
    const replyText = await requestAiReply();

    // 3) 봇 메시지 추가 (타이핑 효과 버전)
    const botMsg = addMessage("bot", "");
    await typeText(botMsg.id, replyText);

    // 만약 한 번에 나오게 하고 싶으면 위 두 줄 대신:
    // addMessage("bot", replyText);
    // renderMessages();
  } catch (err) {
    console.error(err);
    addMessage("bot", "앗, 무언가 잘못됐어 😥\n잠시 후 다시 시도해줘!");
    renderMessages();
  } finally {
    hideThinking();
    isWaiting = false;
  }
}

// ==============================
// 2) 샘플 데이터 불러오기
// ==============================
export async function loadSamples() {
  if (isWaiting) return;
  isWaiting = true;
  showThinking();

  try {
    const data = await loadSampleMessages();

    data.forEach((item) => {
      addMessage("bot", `샘플: ${item.email} - ${item.name}`);
    });

    renderMessages();
  } catch (err) {
    console.error(err);
    addMessage("bot", "샘플 불러오는 중 에러가 났어 ㅠㅠ");
    renderMessages();
  } finally {
    hideThinking();
    isWaiting = false;
  }
}




