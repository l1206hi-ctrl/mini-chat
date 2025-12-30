// ui.js
import { messages, getVariantMeta } from "./state.js";
import { getCurrentCharacter } from "./store.js";

const messagesEl = document.getElementById("messages");
const overlayEl = document.getElementById("thinkingOverlay");
let lastRenderedCount = 0;

export function setAvatarCircle(el, name = "", imageUrl = "") {
  if (!el) return;
  if (imageUrl && imageUrl.trim().length > 0) {
    el.style.backgroundImage = `url('${imageUrl}')`;
    el.classList.add("has-image");
    el.textContent = "";
    el.removeAttribute("aria-label");
  } else {
    el.style.backgroundImage = "";
    el.classList.remove("has-image");
    const initial = (name || "A").slice(0, 1);
    el.textContent = initial;
    el.setAttribute("aria-label", initial);
  }
}

export function showThinking() {
  overlayEl?.classList.remove("hidden");
}

export function hideThinking() {
  overlayEl?.classList.add("hidden");
}

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Bold text (**text**) and italic-like spans (*text*) become narration styling
function formatMessageText(text = "") {
  const safe = escapeHtml(text);
  const withDouble = safe.replace(/\*\*(.+?)\*\*/gs, '<span class="narration">$1</span>');
  const withSingle = withDouble.replace(
    /(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/gs,
    '$1<span class="narration">$2</span>'
  );
  // Preserve user/model newlines inside message bubbles.
  return withSingle.replace(/\n/g, "<br>");
}

export function renderMessages() {
  if (!messagesEl) return;

  messagesEl.innerHTML = "";

  messages.forEach((msg) => {
    const row = document.createElement("div");
    row.className = `message-row ${msg.role === "user" ? "user" : "bot"}`;

    const isUser = msg.role === "user";
    const char = getCurrentCharacter();
    const name = isUser ? "You" : char?.name || "Character";

    const wrapper = document.createElement("div");
    wrapper.classList.add("message", msg.role);

    if (!isUser) {
      const avatar = document.createElement("div");
      avatar.className = "avatar-circle";
      setAvatarCircle(avatar, name, char?.imageUrl || "");
      row.appendChild(avatar);
    }

    const textEl = document.createElement("div");
    textEl.classList.add("message-text");
    textEl.innerHTML = formatMessageText(msg.text);

    if (!isUser) {
      const senderEl = document.createElement("div");
      senderEl.className = "sender";
      senderEl.innerText = name;
      wrapper.appendChild(senderEl);
    }

    wrapper.appendChild(textEl);

    const metaEl = document.createElement("div");
    metaEl.classList.add("message-meta");
    metaEl.innerText = formatTime(msg.createdAt);
    wrapper.appendChild(metaEl);

    row.appendChild(wrapper);

    messagesEl.appendChild(row);
  });

  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === "bot") {
    const meta = getVariantMeta(lastMessage);
    const actionBar = document.createElement("div");
    actionBar.className = "latest-action-bar";
    actionBar.innerHTML = `
      <div class="latest-action-counter">${meta.index + 1}/${meta.total || 1}</div>
      <div class="latest-action-buttons">
        <button class="latest-action-btn" data-action="edit-last" data-message-id="${lastMessage.id}" aria-label="마지막 사용자 메시지 수정">
          ✏️
        </button>
        <button class="latest-action-btn" data-action="prev-reply" data-message-id="${lastMessage.id}" aria-label="이전 답변 보기" ${
          meta.hasPrev ? "" : "disabled"
        }>
          ⬅
        </button>
        <button class="latest-action-btn" data-action="next-reply" data-message-id="${lastMessage.id}" aria-label="새 답변 생성 또는 다음 답변으로 이동">
          ➡
        </button>
      </div>
    `;
    messagesEl.appendChild(actionBar);
  }

  // Auto-scroll only when a new message has been added to avoid jitter during typing.
  if (messages.length > lastRenderedCount) {
    const last = messagesEl.lastElementChild;
    if (last) {
      last.scrollIntoView({ block: "end", behavior: "auto" });
    }
    requestAnimationFrame(() => {
      messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: "auto" });
    });
  }
  lastRenderedCount = messages.length;
}
