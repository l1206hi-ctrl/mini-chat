// ui.js
import { messages } from "./state.js";

const messagesEl = document.getElementById("messages");
const overlayEl = document.getElementById("thinkingOverlay");

export function showThinking() {
  overlayEl.classList.remove("hidden");
}

export function hideThinking() {
  overlayEl.classList.add("hidden");
}


function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function renderMessages() {
  messagesEl.innerHTML = "";

  messages.forEach((msg) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("message", msg.role);

    const textEl = document.createElement("div");
    textEl.classList.add("message-text");
    textEl.innerText = msg.text;

    const metaEl = document.createElement("div");
    metaEl.classList.add("message-meta");
    metaEl.innerText = formatTime(msg.createdAt);

    wrapper.appendChild(textEl);
    wrapper.appendChild(metaEl);

    messagesEl.appendChild(wrapper);
  });

    // 항상 맨 아래로 스크롤 (좀 더 안전한 방식)
  const last = messagesEl.lastElementChild;
  if (last) {
    last.scrollIntoView({ block: "end" });
  }
}

