// events.js
// Wiring for form/buttons
import {
  sendChat,
  resetChatToInitial,
  beginEditLatestUserMessage,
  regenerateLatestReply,
  showPreviousVariant,
  showNextVariantOrGenerate,
  isChatBusy,
} from "./chatFlow.js";
import { clearAllStoredMessages, clearMessages } from "./state.js";

export function setupEvents() {
  const inputEl = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const resetBtn = document.getElementById("resetChatBtn");
  const clearAllBtn = document.getElementById("clearAllChatsBtn");

  if (!inputEl || !sendBtn) {
    console.warn("Required DOM nodes (chatInput/sendBtn) are missing.");
    return;
  }

  // Send button
  sendBtn.addEventListener("click", async () => {
    await runSend(inputEl, sendBtn);
  });

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetChatToInitial();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      const ok = confirm("모든 캐릭터의 대화 기록을 삭제할까요?");
      if (!ok) return;
      clearAllStoredMessages();
      clearMessages();
    });
  }

  // Enter to send / Shift+Enter for newline
  inputEl.addEventListener("keydown", async (e) => {
    if (e.isComposing) return;
    if (e.key !== "Enter") return;

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

    e.preventDefault();
    await runSend(inputEl, sendBtn);
  });

  // Message action bar (edit/regenerate/previous)
  const messagesEl = document.getElementById("messages");
  if (messagesEl) {
    messagesEl.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      if (target.disabled) return;
      if (isChatBusy()) return;

      const action = target.getAttribute("data-action");

      if (action === "edit-last") {
        const text = beginEditLatestUserMessage();
        if (text !== null && inputEl) {
          inputEl.value = text;
          inputEl.focus();
          inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
        }
        return;
      }

      if (action === "prev-reply") {
        showPreviousVariant();
        return;
      }

      if (action === "next-reply") {
        await showNextVariantOrGenerate();
        return;
      }

      if (action === "regen-reply") {
        await regenerateLatestReply();
      }
    });
  }
}

// ----------------------
// helpers
// ----------------------

async function runSend(inputEl, sendBtn) {
  const text = inputEl.value;

  inputEl.value = "";

  lockUI(sendBtn);
  try {
    await sendChat(text);
  } finally {
    unlockUI(sendBtn);
  }
}

function lockUI(sendBtn) {
  sendBtn.disabled = true;
}

function unlockUI(sendBtn) {
  sendBtn.disabled = false;
}
