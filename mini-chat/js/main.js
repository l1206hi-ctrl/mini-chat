// main.js
import { setupEvents } from "./events.js";
import { loadMessages } from "./state.js";
import { renderMessages } from "./ui.js";

import { loadUserCharacters } from "./characters.js";
import {
  initCharacterFromStorage,
  refreshCharacterUI,
  setupCharacterManagementEvents,
  renderCharacterGrid,
} from "./character-ui.js";

import { initTabs } from "./tabs.js";
import { initPersonaUI, loadStoredPersona } from "./persona.js";

document.addEventListener("DOMContentLoaded", () => {
  // 0) Load stored persona before building chat history
  loadStoredPersona();

  // 1) Load character data from storage
  loadUserCharacters();

  // 2) Initialize selection/UI
  initCharacterFromStorage();
  refreshCharacterUI();
  renderCharacterGrid();
  setupCharacterManagementEvents();

  // 3) Load messages and render chat
  loadMessages();
  renderMessages();

  // 3.5) Home button -> show character grid page
  const homeBtn = document.getElementById("homeBtn");
  const mainArea = document.querySelector(".main-area");
  const placeholder = document.getElementById("mainPlaceholder");
  const grid = document.getElementById("characterGrid");

  const showGridPage = () => {
    if (mainArea) mainArea.style.display = "none";
    if (placeholder) placeholder.style.display = "flex";
    if (grid) grid.style.display = "grid";
    renderCharacterGrid();
  };

  if (homeBtn) {
    homeBtn.addEventListener("click", showGridPage);
  }

  // 4) Hook chat events
  setupEvents();

  // 5) Tabs
  initTabs();

  // 6) Persona modal
  initPersonaUI();
});
