// typewriter.js
// Renders bot replies with a typewriter effect.
import { updateMessageText, overwriteMessageText } from "./state.js";
import { renderMessages } from "./ui.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function typeText(messageId, fullText) {
  const text = fullText || "";
  if (!text) {
    updateMessageText(messageId, "", false);
    renderMessages();
    overwriteMessageText(messageId, "");
    return;
  }

  const len = text.length;
  const chunkSize = len > 1200 ? 48 : len > 600 ? 32 : 16;
  const delayMs = 16;
  let lastRender = Date.now();

  for (let i = 0; i < len; i += chunkSize) {
    const slice = text.slice(0, Math.min(len, i + chunkSize));
    updateMessageText(messageId, slice, false);

    const now = Date.now();
    if (now - lastRender >= 50) {
      renderMessages();
      lastRender = now;
    }

    await sleep(delayMs);
  }

  renderMessages();
  overwriteMessageText(messageId, text);
}
