// character-dialogue-modal.js
// Handles the dialogue example modal and cards.
import { CHARACTERS, saveUserCharacters } from "./characters.js";
import { getCurrentCharacter } from "./store.js";

const DIALOGUE_CHAR_LIMIT = 2000;
const MAX_DIALOGUE_EXAMPLES = 5;

const dialogueModalState = {
  index: null,
  role: "user",
  messages: [],
  editingIndex: null,
};

export const dialogueModal = {
  getElements() {
    return {
      modal: document.getElementById("dialogueModal"),
      title: document.getElementById("dialogueModalTitle"),
      charCount: document.getElementById("dialogueCharCount"),
      messages: document.getElementById("dialogueModalMessages"),
      input: document.getElementById("dialogueModalInput"),
      roleUser: document.getElementById("dialogueRoleUser"),
      roleAssistant: document.getElementById("dialogueRoleAssistant"),
      assistantName: document.getElementById("dialogueAssistantName"),
      saveBtn: document.getElementById("dialogueModalSave"),
      closeBtn: document.getElementById("dialogueModalClose"),
      sendBtn: document.getElementById("dialogueModalSend"),
    };
  },
};

export function setDialogueRole(role) {
  dialogueModalState.role = role === "assistant" ? "assistant" : "user";
  const { roleUser, roleAssistant } = dialogueModal.getElements();
  if (roleUser && roleAssistant) {
    roleUser.classList.toggle("active", dialogueModalState.role === "user");
    roleAssistant.classList.toggle("active", dialogueModalState.role === "assistant");
  }
  const input = dialogueModal.getElements().input;
  if (input) {
    input.placeholder =
      dialogueModalState.role === "user" ? "User message" : "Assistant message";
    input.focus();
  }
}

export function renderDialogueModal() {
  const { messages: messagesEl, charCount, assistantName, input } = dialogueModal.getElements();
  const current = getCurrentCharacter() || CHARACTERS[0];
  if (assistantName && current) assistantName.textContent = current.name || "Character";

  if (messagesEl) {
    messagesEl.innerHTML = "";
    const { messages } = dialogueModalState;
    if (!messages.length) {
      const empty = document.createElement("div");
      empty.className = "dialogue-empty";
      empty.textContent = "Add user/assistant lines, then press Enter or the send button.";
      messagesEl.appendChild(empty);
    } else {
      messages.forEach((m, idx) => {
        const bubble = document.createElement("div");
        bubble.className = `dialogue-bubble ${m.role}`;

        const parts = (m.text || "")
          .split(/(\*[^*]+\*)/g)
          .filter((p) => p && p.length > 0);
        (parts.length ? parts : [m.text || ""]).forEach((chunk) => {
          const isNarration = chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 1;
          const cleaned = isNarration ? chunk.slice(1, -1) : chunk;
          const span = document.createElement("span");
          span.className = `bubble-chunk ${isNarration ? "narration" : "plain"}`;
          span.textContent = cleaned;
          bubble.appendChild(span);
        });

        const actions = document.createElement("div");
        actions.className = "bubble-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "bubble-action-btn";
        editBtn.textContent = "Edit";
        editBtn.title = "Edit";
        editBtn.addEventListener("click", () => {
          dialogueModalState.editingIndex = idx;
          dialogueModalState.role = m.role;
          setDialogueRole(m.role);
          if (input) {
            input.value = m.text;
            input.focus();
          }
        });

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "bubble-action-btn";
        delBtn.textContent = "Delete";
        delBtn.title = "Delete";
        delBtn.addEventListener("click", () => {
          dialogueModalState.messages = messages.filter((_, i) => i !== idx);
          dialogueModalState.editingIndex = null;
          renderDialogueModal();
        });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        bubble.appendChild(actions);
        messagesEl.appendChild(bubble);
      });
    }
  }

  if (charCount) {
    const totalLen = dialogueModalState.messages.reduce(
      (sum, m) => sum + (m.text?.length || 0),
      0
    );
    charCount.textContent = `${totalLen}/${DIALOGUE_CHAR_LIMIT.toLocaleString()} chars`;
  }
}

export function openDialogueModal(index) {
  const current = getCurrentCharacter();
  const { modal, title, input } = dialogueModal.getElements();
  if (!current || !modal) return;
  const examples = Array.isArray(current.exampleDialogues) ? current.exampleDialogues : [];

  dialogueModalState.index = typeof index === "number" ? index : examples.length;
  const target = examples[dialogueModalState.index];
  dialogueModalState.messages = Array.isArray(target?.messages)
    ? target.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        text: typeof m.text === "string" ? m.text : "",
      }))
    : [];
  dialogueModalState.editingIndex = null;
  dialogueModalState.role = "user";

  if (title) title.textContent = `Example ${dialogueModalState.index + 1}`;
  modal.classList.remove("hidden");
  setDialogueRole("user");
  renderDialogueModal();
  if (input) {
    input.value = "";
    input.focus();
  }
}

export function closeDialogueModal() {
  const { modal, input } = dialogueModal.getElements();
  if (modal) modal.classList.add("hidden");
  if (input) input.value = "";
}

export function pushDialogueFromInput() {
  const { input } = dialogueModal.getElements();
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const currentLen = dialogueModalState.messages.reduce((sum, m) => sum + (m.text?.length || 0), 0);
  if (text.length + currentLen > DIALOGUE_CHAR_LIMIT) {
    alert("Limit is 2,000 characters.");
    return;
  }

  if (typeof dialogueModalState.editingIndex === "number") {
    dialogueModalState.messages[dialogueModalState.editingIndex] = {
      role: dialogueModalState.role,
      text,
    };
    dialogueModalState.editingIndex = null;
  } else {
    dialogueModalState.messages.push({
      role: dialogueModalState.role,
      text,
    });
  }
  input.value = "";
  renderDialogueModal();
}

export function saveDialogueModal() {
  const current = getCurrentCharacter();
  if (!current) return;
  const examples = Array.isArray(current.exampleDialogues) ? current.exampleDialogues : [];
  const { messages, index } = dialogueModalState;
  if (!messages.length) {
    closeDialogueModal();
    return;
  }

  const payload = { messages: messages.map((m) => ({ ...m })) };
  if (index >= 0 && index < examples.length) {
    examples[index] = payload;
  } else {
    examples.push(payload);
  }
  current.exampleDialogues = examples.slice(0, MAX_DIALOGUE_EXAMPLES);
  saveUserCharacters();
  renderDialogueExampleCards(current);
  closeDialogueModal();
}

export function renderDialogueExampleCards(current = getCurrentCharacter()) {
  const container = document.getElementById("dialogueExampleList");
  const addBtn = document.getElementById("addDialogueExampleBtn");
  const hint = document.getElementById("dialogueExampleHint");
  if (!container || !current) return;

  const examples = Array.isArray(current.exampleDialogues) ? current.exampleDialogues : [];
  current.exampleDialogues = examples;

  container.innerHTML = "";

  if (!examples.length) {
    const empty = document.createElement("div");
    empty.className = "dialogue-empty";
    empty.textContent = "Click 'Add example' to create examples.";
    container.appendChild(empty);
  }

  examples.forEach((ex, idx) => {
    const card = document.createElement("div");
    card.className = "dialogue-card";

    const header = document.createElement("div");
    header.className = "dialogue-card-header";

    const title = document.createElement("div");
    title.className = "dialogue-card-title";
    title.textContent = `Example ${idx + 1}`;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "ghost-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openDialogueModal(idx));

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "ghost-btn danger-outline";
    removeBtn.textContent = "Delete";
    removeBtn.addEventListener("click", () => {
      const updated = Array.isArray(current.exampleDialogues) ? current.exampleDialogues : [];
      updated.splice(idx, 1);
      current.exampleDialogues = updated;
      // Persist removal so it survives refreshes.
      saveUserCharacters();
      renderDialogueExampleCards(current);
    });

    header.appendChild(title);
    header.appendChild(editBtn);
    header.appendChild(removeBtn);

    const preview = document.createElement("div");
    preview.className = "dialogue-preview-text";
    const first = ex.messages?.[0];
    const summary =
      first?.text?.slice(0, 80) + (first?.text?.length > 80 ? "..." : "") || "Empty";
    preview.textContent = summary;

    card.appendChild(header);
    card.appendChild(preview);
    container.appendChild(card);
  });

  const limitReached = examples.length >= MAX_DIALOGUE_EXAMPLES;
  if (addBtn) {
    addBtn.disabled = limitReached;
    addBtn.title = limitReached ? "You can add up to 5 examples." : "";
  }
  if (hint) {
    hint.textContent = `${examples.length}/${MAX_DIALOGUE_EXAMPLES}`;
  }
}

export function addDialogueExampleCard() {
  const current = getCurrentCharacter();
  if (!current) return;
  const examples = Array.isArray(current.exampleDialogues) ? current.exampleDialogues : [];
  if (examples.length >= MAX_DIALOGUE_EXAMPLES) return;
  openDialogueModal(null);
}

export function collectDialogueExamples() {
  const current = getCurrentCharacter();
  if (!current) return [];
  return Array.isArray(current.exampleDialogues) ? current.exampleDialogues : [];
}
