// state.js

// Message shape:
// { id: string, role: "user" | "bot", text: string, createdAt: Date }
import { getCurrentCharacter } from "./store.js";

export const messages = [];

function ensureBotVariantShape(msg) {
  if (!msg || msg.role !== "bot") return;
  if (!Array.isArray(msg.variants)) {
    msg.variants = [msg.text || ""];
  }
  if (typeof msg.variantIndex !== "number" || msg.variantIndex < 0) {
    msg.variantIndex = Math.max(0, msg.variants.length - 1);
  }
}

// Local storage key depends on selected character
function getStorageKey() {
  const char = getCurrentCharacter();
  const id = char && char.id ? char.id : "default";
  return `mini-chat-messages-${id}`;
}

export function saveMessages() {
  try {
    const json = JSON.stringify(messages);
    const key = getStorageKey();
    localStorage.setItem(key, json);
  } catch (err) {
    console.error("Failed to persist messages:", err);
  }
}

export function loadMessages() {
  try {
    const key = getStorageKey();
    const json = localStorage.getItem(key);

    if (!json) {
      messages.length = 0;
      return;
    }

    const parsed = JSON.parse(json);

    messages.length = 0;
    parsed.forEach((m) => {
      const restored = {
        ...m,
        createdAt: new Date(m.createdAt), // revive date
      };
      if (restored.role === "bot") {
        ensureBotVariantShape(restored);
      }
      messages.push(restored);
    });
  } catch (err) {
    console.error("Failed to load messages:", err);
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

  if (role === "bot") {
    newMessage.variants = [text];
    newMessage.variantIndex = 0;
  }

  messages.push(newMessage);
  saveMessages();
  return newMessage;
}

// Optional save flag lets callers batch persistence (e.g., typewriter effect).
export function updateMessageText(id, newText, save = true) {
  const msg = messages.find((m) => m.id === id);
  if (!msg) return;

  msg.text = newText;
  if (save) {
    saveMessages();
  }
}

export function clearMessages() {
  messages.length = 0;
  try {
    const key = getStorageKey();
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Failed to clear messages:", err);
  }
}

// Remove all stored chats for every character key.
export function clearAllStoredMessages() {
  messages.length = 0;
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("mini-chat-messages-"));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error("Failed to clear all stored messages:", err);
  }
}

export function overwriteMessageText(id, newText) {
  const msg = messages.find((m) => m.id === id);
  if (!msg) return;
  msg.text = newText;
  if (msg.role === "bot") {
    ensureBotVariantShape(msg);
    msg.variants[msg.variantIndex] = newText;
  }
  saveMessages();
}

export function removeMessagesAfterId(targetId) {
  const idx = messages.findIndex((m) => m.id === targetId);
  if (idx === -1) return;
  messages.splice(idx + 1);
  saveMessages();
}

export function getLastBotMessage() {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "bot") {
      ensureBotVariantShape(messages[i]);
      return messages[i];
    }
  }
  return null;
}

export function addBotVariant(messageId, newText) {
  const msg = messages.find((m) => m.id === messageId && m.role === "bot");
  if (!msg) return null;
  ensureBotVariantShape(msg);
  msg.variants.push(newText);
  msg.variantIndex = msg.variants.length - 1;
  msg.text = newText;
  saveMessages();
  return msg;
}

export function stepBotVariant(messageId, delta) {
  const msg = messages.find((m) => m.id === messageId && m.role === "bot");
  if (!msg) return { changed: false };
  ensureBotVariantShape(msg);
  const nextIndex = msg.variantIndex + delta;
  if (nextIndex < 0 || nextIndex >= msg.variants.length) {
    return { changed: false, total: msg.variants.length, index: msg.variantIndex };
  }
  msg.variantIndex = nextIndex;
  msg.text = msg.variants[nextIndex] || "";
  saveMessages();
  return { changed: true, total: msg.variants.length, index: nextIndex, text: msg.text };
}

export function getVariantMeta(msg) {
  if (!msg || msg.role !== "bot") return { total: 0, index: 0, hasPrev: false, hasNext: false };
  ensureBotVariantShape(msg);
  const total = msg.variants.length;
  const index = msg.variantIndex;
  return {
    total,
    index,
    hasPrev: index > 0,
    hasNext: index < total - 1,
  };
}
