// chatFlow.js
// Chat flow for "send message + fetch AI reply"
import {
  addMessage,
  clearMessages,
  overwriteMessageText,
  removeMessagesAfterId,
  getLastBotMessage,
  addBotVariant,
  stepBotVariant,
  getVariantMeta,
  messages,
} from "./state.js";
import { showThinking, hideThinking, renderMessages } from "./ui.js";
import { requestAiReply } from "./api.js";
import { getCurrentCharacter } from "./store.js";
import { typeText } from "./typewriter.js";

let isWaiting = false; // avoid parallel sends
let editingMessageId = null;

// ==============================
// 1) Send chat
// ==============================
export async function sendChat(rawText) {
  if (isWaiting) return;

  const text = (rawText || "").trim();

  if (editingMessageId && !text) {
    return;
  }

  const isAutoContinue = !editingMessageId && text.length === 0;

  // Shortcut command: clear
  if (!editingMessageId && (text === "clear" || text === "/clear")) {
    clearMessages();
    renderMessages();
    addMessage("bot", "Chat history cleared.");
    renderMessages();
    return;
  }

  isWaiting = true;
  showThinking();

  try {
    const targetIdx = editingMessageId
      ? messages.findIndex((m) => m.id === editingMessageId && m.role === "user")
      : -1;

    if (isAutoContinue) {
      const continuePrompt =
        "사용자가 아무 말도 하지 않았다. 지금부터는 같은 장면을 반복하지 말고, 이야기를 반드시 다음 단계로 진행해라. 이미 쓴 문장은 요약만 하고 새로운 사건을 추가해라.";
      const replyText = await requestAiReply([
        ...messages,
        { role: "user", content: continuePrompt },
      ]);
      const botMsg = addMessage("bot", "");
      await typeText(botMsg.id, replyText);
    } else if (editingMessageId && targetIdx >= 0) {
      overwriteMessageText(editingMessageId, text);
      removeMessagesAfterId(editingMessageId);
      renderMessages();

      const replyText = await requestAiReply();
      const botMsg = addMessage("bot", "");
      await typeText(botMsg.id, replyText);
      editingMessageId = null;
    } else {
      editingMessageId = null;

      // 1) Add user message
      addMessage("user", text);
      renderMessages();

      // 2) Fetch AI
      const replyText = await requestAiReply();

      // 3) Render bot message (typewriter)
      const botMsg = addMessage("bot", "");
      await typeText(botMsg.id, replyText);
    }
  } catch (err) {
    console.error(err);
    const friendly =
      err?.message && typeof err.message === "string"
        ? `Error: ${err.message}`
        : "Something went wrong. Please try again.";
    addMessage("bot", friendly);
    renderMessages();
  } finally {
    hideThinking();
    isWaiting = false;
  }
}

// ==============================
// 2) Reset chat to initial (apply character firstMessage if present)
// ==============================
export function resetChatToInitial() {
  const current = getCurrentCharacter();
  clearMessages();

  const first = current?.firstMessage?.trim();
  if (first && first.length > 0) {
    addMessage("bot", first);
  }

  renderMessages();
}

export function beginEditLatestUserMessage() {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      editingMessageId = messages[i].id;
      return messages[i].text || "";
    }
  }
  return null;
}

export function isChatBusy() {
  return isWaiting;
}

export function getLatestBotVariantMeta() {
  const lastBot = getLastBotMessage();
  if (!lastBot) return null;
  const meta = getVariantMeta(lastBot);
  return { ...meta, messageId: lastBot.id };
}

export function showPreviousVariant() {
  const lastBot = getLastBotMessage();
  if (!lastBot) return false;
  const result = stepBotVariant(lastBot.id, -1);
  if (result.changed) {
    renderMessages();
  }
  return result.changed;
}

export async function showNextVariantOrGenerate() {
  const lastBot = getLastBotMessage();
  if (!lastBot) return { generated: false, switched: false };
  const meta = getVariantMeta(lastBot);
  if (meta.hasNext) {
    const result = stepBotVariant(lastBot.id, 1);
    if (result.changed) {
      renderMessages();
    }
    return { generated: false, switched: result.changed };
  }

  await regenerateLatestReply();
  return { generated: true, switched: false };
}

export async function regenerateLatestReply() {
  if (isWaiting) return;

  const lastBot = getLastBotMessage();
  if (!lastBot) return;

  const lastBotIndex = messages.findIndex((m) => m.id === lastBot.id);
  const context = messages.filter((_, idx) => idx !== lastBotIndex);

  isWaiting = true;
  showThinking();
  try {
    const replyText = await requestAiReply(context);
    addBotVariant(lastBot.id, replyText);
    renderMessages();
  } catch (err) {
    console.error(err);
    const friendly =
      err?.message && typeof err.message === "string"
        ? `Error: ${err.message}`
        : "Something went wrong. Please try again.";
    addMessage("bot", friendly);
    renderMessages();
  } finally {
    hideThinking();
    isWaiting = false;
  }
}
