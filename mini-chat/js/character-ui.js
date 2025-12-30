// character-ui.js
// Character selection/management UI logic
import {
  CHARACTERS,
  saveUserCharacters,
  createEmptyCharacter,
  isDefaultCharacter,
  hideDefaultCharacterId,
} from "./characters.js";
import { loadMessages, clearMessages, messages, addMessage } from "./state.js";
import { renderMessages, setAvatarCircle } from "./ui.js";
import {
  renderCharacterButtons as renderCharacterButtonsView,
  renderCharacterGrid as renderCharacterGridView,
} from "./character-list.js";
import {
  renderScenarioCards,
  openScenarioEditor,
  saveScenarioFromEditor,
  cancelScenarioEdit,
  setScenarioRole,
  updateScenarioRoleButtons,
} from "./character-scenarios.js";
import { getCurrentCharacter, setCurrentCharacter } from "./store.js";
import {
  dialogueModal,
  setDialogueRole,
  closeDialogueModal,
  pushDialogueFromInput,
  saveDialogueModal,
  renderDialogueExampleCards,
  addDialogueExampleCard,
  collectDialogueExamples,
} from "./character-dialogue-modal.js";

let builderTabsInitialized = false;

function updateAvatarPreview(el, name, imageUrl) {
  if (!el) return;
  setAvatarCircle(el, name || "", imageUrl || "");
}

function showMainArea() {
  const mainArea = document.querySelector(".main-area");
  const placeholder = document.getElementById("mainPlaceholder");
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("sidebarToggleBtn");
  if (mainArea) mainArea.style.display = "flex";
  if (sidebar) {
    sidebar.style.display = "flex";
    sidebar.classList.add("collapsed");
  }
  if (toggleBtn) {
    toggleBtn.textContent = "Open sidebar";
    toggleBtn.setAttribute("aria-label", "Open sidebar");
  }
  if (placeholder) placeholder.style.display = "none";
  const grid = document.getElementById("characterGrid");
  if (grid) grid.style.display = "none";
}

// --------------------
// Load selection from storage
// --------------------

export function initCharacterFromStorage() {
  if (!CHARACTERS.length) return;

  const savedId = localStorage.getItem("selectedCharacterId");

  let current = CHARACTERS[0];
  if (savedId) {
    const found = CHARACTERS.find((c) => c.id === savedId);
    if (found) current = found;
  }

  setCurrentCharacter(current);
}

// --------------------
// Selection handlers
// --------------------

function handleSelectCharacter(c) {
  setCurrentCharacter(c);
  localStorage.setItem("selectedCharacterId", c.id);

  refreshCharacterUI();
  showMainArea();

  loadMessages();

  if (messages.length === 0 && c.firstMessage && c.firstMessage.trim().length > 0) {
    addMessage("bot", c.firstMessage.trim());
  }

  renderMessages();
}

function handleDeleteCharacter(c) {
  const ok = confirm(`Delete "${c.name}"? (Defaults can be hidden but not deleted permanently.)`);
  if (!ok) return;

  const idx = CHARACTERS.findIndex((item) => item.id === c.id);
  if (idx !== -1) {
    CHARACTERS.splice(idx, 1);
  }

  if (isDefaultCharacter(c)) {
    hideDefaultCharacterId(c.id);
  }

  const fallback = CHARACTERS[0];
  setCurrentCharacter(fallback || null);
  if (fallback) {
    localStorage.setItem("selectedCharacterId", fallback.id);
  } else {
    localStorage.removeItem("selectedCharacterId");
  }

  clearMessages();
  loadMessages();
  saveUserCharacters();
  refreshCharacterUI();
  renderMessages();
}

// --------------------
// Render helpers
// --------------------

function renderCharacterButtonsUI() {
  const current = getCurrentCharacter() || CHARACTERS[0];
  renderCharacterButtonsView(current, {
    onSelect: handleSelectCharacter,
    onDelete: handleDeleteCharacter,
  });
}

function renderCharacterGridUI() {
  const current = getCurrentCharacter() || CHARACTERS[0];
  renderCharacterGridView(current, { onSelect: handleSelectCharacter });
}

function updateChatHeaderWithCharacter() {
  const current = getCurrentCharacter() || CHARACTERS[0];

  const nameEl = document.getElementById("currentCharacterName");
  const taglineEl = document.getElementById("currentCharacterTagline");
  const chipNameEl = document.getElementById("inputCharName");
  const chipAvatarEl = document.getElementById("inputCharAvatar");

  if (nameEl && current) nameEl.textContent = current.name;
  if (taglineEl && current) taglineEl.textContent = current.tagline || "";
  if (chipNameEl && current) chipNameEl.textContent = current.name;
  if (chipAvatarEl && current) {
    setAvatarCircle(chipAvatarEl, current.name, current.imageUrl || "");
  }
}


// --------------------
// Form fill
// --------------------

function fillCharacterForm() {
  const current = getCurrentCharacter() || CHARACTERS[0];
  current.exampleDialogues = Array.isArray(current.exampleDialogues)
    ? current.exampleDialogues
    : [];

  const nameInput = document.getElementById("charNameInput");
  const taglineInput = document.getElementById("charTaglineInput");
  const tagsInput = document.getElementById("charTagsInput");
  const systemPromptInput = document.getElementById("charSystemPromptInput");

  const personalityInput = document.getElementById("charPersonalityInput");
  const greetingInput = document.getElementById("charGreetingInput");

  const worldviewInput = document.getElementById("charWorldviewInput");
  const descriptionInput = document.getElementById("charDescriptionInput");
  const firstMsgInput = document.getElementById("charFirstMessageInput");
  const imageUrlInput = document.getElementById("charImageUrlInput");
  const imagePreview = document.getElementById("charImagePreview");

  if (worldviewInput) worldviewInput.value = current.worldview || "";
  if (descriptionInput) descriptionInput.value = current.description || "";
  if (firstMsgInput) firstMsgInput.value = current.firstMessage || "";
  if (imageUrlInput) imageUrlInput.value = current.imageUrl || "";
  if (imagePreview) updateAvatarPreview(imagePreview, current.name, current.imageUrl);

  renderDialogueExampleCards(current);
  renderScenarioCards(current);

  const saveBtn = document.getElementById("saveCharacterBtn");
  const deleteBtn = document.getElementById("deleteCharacterBtn");

  if (!nameInput || !taglineInput || !tagsInput || !systemPromptInput) {
    return;
  }

  nameInput.value = current.name || "";
  taglineInput.value = current.tagline || "";
  tagsInput.value = Array.isArray(current.tags) ? current.tags.join(", ") : "";
  systemPromptInput.value = current.systemPrompt || "";

  if (personalityInput) {
    personalityInput.value = current.personality || "";
  }
  if (greetingInput) {
    greetingInput.value = current.greeting || "";
  }

  const isDefault = isDefaultCharacter(current);

  if (saveBtn) {
    saveBtn.disabled = false;
  }
  if (deleteBtn) {
    deleteBtn.disabled = false;
    deleteBtn.title = isDefault
      ? "Default characters can be hidden but not removed permanently."
      : "";
  }
}

// --------------------
// UI refresh
// --------------------

export function refreshCharacterUI() {
  renderCharacterButtonsUI();
  renderCharacterGridUI();
  updateChatHeaderWithCharacter();
  fillCharacterForm();
}

// --------------------
// Event binding
// --------------------

export function setupCharacterManagementEvents() {
  if (!builderTabsInitialized) {
    setupBuilderTabs();
    builderTabsInitialized = true;
  }

  const createNewCharacter = () => {
    const newChar = createEmptyCharacter();
    setCurrentCharacter(newChar);
    CHARACTERS.push(newChar);
    saveUserCharacters();
    refreshCharacterUI();
    showMainArea();
  };

  const newBtn = document.getElementById("newCharacterBtn");
  const saveBtn = document.getElementById("saveCharacterBtn");
  const deleteBtn = document.getElementById("deleteCharacterBtn");
  const placeholderAddBtn = document.getElementById("placeholderAddCharacterBtn");

  const nameInput = document.getElementById("charNameInput");
  const taglineInput = document.getElementById("charTaglineInput");
  const tagsInput = document.getElementById("charTagsInput");
  const systemPromptInput = document.getElementById("charSystemPromptInput");

  const personalityInput = document.getElementById("charPersonalityInput");
  const greetingInput = document.getElementById("charGreetingInput");

  const worldviewInput = document.getElementById("charWorldviewInput");
  const descriptionInput = document.getElementById("charDescriptionInput");
  const firstMsgInput = document.getElementById("charFirstMessageInput");
  const imageUrlInput = document.getElementById("charImageUrlInput");
  const imageFileInput = document.getElementById("charImageFileInput");
  const imagePreview = document.getElementById("charImagePreview");
  const addDialogueExampleBtn = document.getElementById("addDialogueExampleBtn");
  const {
    closeBtn: dialogueCloseBtn,
    saveBtn: dialogueSaveBtn,
    roleUser: dialogueRoleUserBtn,
    roleAssistant: dialogueRoleAssistantBtn,
    sendBtn: dialogueSendBtn,
    input: dialogueInputEl,
  } = dialogueModal.getElements();

  if (newBtn) {
    newBtn.addEventListener("click", createNewCharacter);
  }

  if (placeholderAddBtn) {
    placeholderAddBtn.addEventListener("click", createNewCharacter);
  }

  if (addDialogueExampleBtn) {
    addDialogueExampleBtn.addEventListener("click", () => addDialogueExampleCard());
  }

  if (dialogueCloseBtn) {
    dialogueCloseBtn.addEventListener("click", closeDialogueModal);
  }
  if (dialogueSaveBtn) {
    dialogueSaveBtn.addEventListener("click", saveDialogueModal);
  }
  if (dialogueRoleUserBtn) {
    dialogueRoleUserBtn.addEventListener("click", () => setDialogueRole("user"));
  }
  if (dialogueRoleAssistantBtn) {
    dialogueRoleAssistantBtn.addEventListener("click", () => setDialogueRole("assistant"));
  }
  if (dialogueSendBtn) {
    dialogueSendBtn.addEventListener("click", pushDialogueFromInput);
  }
  if (dialogueInputEl) {
    dialogueInputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        pushDialogueFromInput();
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const current = getCurrentCharacter();
      if (!current) return;
      if (!nameInput || !taglineInput || !tagsInput || !systemPromptInput) return;

      const name = nameInput.value.trim() || "Untitled";
      const tagline = taglineInput.value.trim();
      const systemPrompt = systemPromptInput.value.trim();

      const tagsRaw = tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const personality = personalityInput ? personalityInput.value.trim() : "";
      const greeting = greetingInput ? greetingInput.value.trim() : "";
      const worldview = worldviewInput ? worldviewInput.value.trim() : "";
      const description = descriptionInput ? descriptionInput.value.trim() : "";
      const exampleDialogues = collectDialogueExamples();
      const firstMessage = firstMsgInput ? firstMsgInput.value.trim() : "";
      const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : current.imageUrl;

      current.name = name;
      current.tagline = tagline;
      current.systemPrompt = systemPrompt;
      current.tags = tagsRaw;
      current.personality = personality;
      current.greeting = greeting;
      current.worldview = worldview;
      current.description = description;
      current.exampleDialogues = exampleDialogues;
      current.firstMessage = firstMessage;
      current.imageUrl = imageUrl || "";
      current.scenarioExamples = Array.isArray(current.scenarioExamples)
        ? current.scenarioExamples
        : [];

      saveUserCharacters();
      refreshCharacterUI();
    });
  }

  const applyImage = (url) => {
    const current = getCurrentCharacter() || CHARACTERS[0];
    if (!current) return;
    current.imageUrl = url || "";
    if (imageUrlInput) {
      imageUrlInput.value = current.imageUrl;
    }
    updateAvatarPreview(imagePreview, current.name, current.imageUrl);
    saveUserCharacters();
    refreshCharacterUI();
  };

  if (imageUrlInput) {
    imageUrlInput.addEventListener("change", () => {
      applyImage(imageUrlInput.value.trim());
    });
  }

  if (imageFileInput) {
    imageFileInput.addEventListener("change", () => {
      const file = imageFileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        applyImage(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // Delete
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const current = getCurrentCharacter();
      if (!current) return;
      handleDeleteCharacter(current);
    });
  }

  // Scenario buttons
  const addScenarioBtn = document.getElementById("addScenarioBtn");
  const saveScenarioBtn = document.getElementById("saveScenarioBtn");
  const cancelScenarioBtn = document.getElementById("cancelScenarioBtn");
  const roleButtons = document.querySelectorAll(".role-chip");
  if (addScenarioBtn) {
    addScenarioBtn.addEventListener("click", () =>
      openScenarioEditor(getCurrentCharacter(), null)
    );
  }
  if (saveScenarioBtn) {
    saveScenarioBtn.addEventListener("click", () =>
      saveScenarioFromEditor(getCurrentCharacter())
    );
  }
  if (cancelScenarioBtn) {
    cancelScenarioBtn.addEventListener("click", () => cancelScenarioEdit());
  }
  roleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role === "bot" ? "bot" : "user";
      setScenarioRole(role);
      updateScenarioRoleButtons();
    });
  });
}

// --------------------
// Builder tabs
// --------------------

function setupBuilderTabs() {
  const tabButtons = document.querySelectorAll(".builder-tab");
  const panels = document.querySelectorAll(".builder-panel");
  if (!tabButtons.length || !panels.length) return;

  const activate = (targetId) => {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.target === targetId;
      btn.classList.toggle("active", isActive);
    });
    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === targetId);
    });
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (!target) return;
      activate(target);
    });
  });

  const first = tabButtons[0];
  if (first?.dataset?.target) {
    activate(first.dataset.target);
  }
}

// --------------------
// Character studio (minimal)
// --------------------

function renderStudioCharacterList() {
  const listEl = document.getElementById("studioCharacterList");
  if (!listEl) return;

  listEl.innerHTML = "";

  CHARACTERS.forEach((c) => {
    const li = document.createElement("li");
    li.className = "studio-char-item";
    li.textContent = c.name + (isDefaultCharacter(c) ? " (default)" : "");
    li.addEventListener("click", () => {
      setCurrentCharacter(c);
      refreshCharacterUI();
      fillStudioFormWithCharacter(c);
    });
    listEl.appendChild(li);
  });
}

function fillStudioFormWithCharacter(c) {
  const f = document.getElementById("studioCharacterForm");
  if (!f || !c) return;

  const nameInput = f.querySelector("#studioCharNameInput");
  if (nameInput) nameInput.value = c.name || "";
}

function setupStudioFormEvents() {
  const f = document.getElementById("studioCharacterForm");
  const studioNewBtn = document.getElementById("studioNewCharacterBtn");
  if (!f) return;

  if (studioNewBtn) {
    studioNewBtn.addEventListener("click", () => {
      const newChar = createEmptyCharacter();
      setCurrentCharacter(newChar);
      CHARACTERS.push(newChar);
      saveUserCharacters();
      renderStudioCharacterList();
      refreshCharacterUI();
      fillStudioFormWithCharacter(newChar);
    });
  }

  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const current = getCurrentCharacter();
    if (!current) return;

    const nameInput = f.querySelector("#studioCharNameInput");
    current.name = nameInput?.value.trim() || "Untitled";

    saveUserCharacters();
    renderCharacterButtonsUI();
    renderStudioCharacterList();
    refreshCharacterUI();
  });
}

// Studio UI init
export function initCharacterStudio() {
  renderStudioCharacterList();
  setupStudioFormEvents();
}

// Keep existing API surface
export function renderCharacterGrid() {
  renderCharacterGridUI();
}
