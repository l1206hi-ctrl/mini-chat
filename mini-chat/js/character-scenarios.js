// character-scenarios.js
// Character scenario cards and editor
import { saveUserCharacters } from "./characters.js";

let editingScenarioId = null;
let scenarioRole = "user";

function getScenarios(currentCharacter) {
  if (!currentCharacter) return [];
  return Array.isArray(currentCharacter.scenarioExamples)
    ? currentCharacter.scenarioExamples
    : [];
}

export function renderScenarioCards(currentCharacter) {
  const listEl = document.getElementById("scenarioCards");
  if (!listEl) return;

  const scenarios = getScenarios(currentCharacter);
  listEl.innerHTML = "";

  scenarios.forEach((sc) => {
    const card = document.createElement("div");
    card.className = "scenario-card";

    const titleRow = document.createElement("div");
    titleRow.className = "scenario-title-row";

    const titleBtn = document.createElement("button");
    titleBtn.type = "button";
    titleBtn.className = "scenario-title";
    titleBtn.textContent = sc.title || "Untitled";
    titleBtn.addEventListener("click", () => openScenarioEditor(currentCharacter, sc.id));

    const actions = document.createElement("div");
    actions.className = "scenario-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "ghost-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openScenarioEditor(currentCharacter, sc.id));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "ghost-btn danger-outline";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      const ok = confirm(`Delete "${sc.title || "Untitled"}"?`);
      if (!ok) return;
      currentCharacter.scenarioExamples = scenarios.filter((s) => s.id !== sc.id);
      saveUserCharacters();
      renderScenarioCards(currentCharacter);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    titleRow.appendChild(titleBtn);
    titleRow.appendChild(actions);

    const preview = document.createElement("div");
    preview.className = "scenario-preview-text";
    preview.textContent =
      (sc.content || "").slice(0, 120) +
      ((sc.content || "").length > 120 ? "..." : "");

    card.appendChild(titleRow);
    card.appendChild(preview);
    listEl.appendChild(card);
  });

  cancelScenarioEdit();
}

export function openScenarioEditor(currentCharacter, id = null) {
  const editor = document.getElementById("scenarioEditor");
  const titleInput = document.getElementById("scenarioTitleInput");
  const contentInput = document.getElementById("scenarioContentInput");
  const roleHint = document.getElementById("scenarioRoleHint");
  if (!editor || !titleInput || !contentInput) return;

  editingScenarioId = id;
  if (id) {
    const existing = getScenarios(currentCharacter).find((s) => s.id === id);
    titleInput.value = existing?.title || "";
    contentInput.value = existing?.content || "";
    scenarioRole = existing?.role === "bot" ? "bot" : "user";
  } else {
    titleInput.value = "";
    contentInput.value = "";
    scenarioRole = "user";
  }

  updateScenarioRoleButtons();
  if (roleHint) {
    roleHint.textContent = scenarioRole === "user" ? "User" : "Bot";
  }
  editor.classList.remove("hidden");
}

export function saveScenarioFromEditor(currentCharacter) {
  if (!currentCharacter) return;
  const titleInput = document.getElementById("scenarioTitleInput");
  const contentInput = document.getElementById("scenarioContentInput");
  if (!titleInput || !contentInput) return;

  const title = titleInput.value.trim() || "Untitled";
  const content = contentInput.value.trim();

  const list = getScenarios(currentCharacter);

  if (editingScenarioId) {
    currentCharacter.scenarioExamples = list.map((s) =>
      s.id === editingScenarioId ? { ...s, title, content, role: scenarioRole } : s
    );
  } else {
    const newScenario = {
      id: `scenario-${Date.now()}`,
      title,
      content,
      role: scenarioRole,
    };
    currentCharacter.scenarioExamples = list.concat([newScenario]);
  }

  editingScenarioId = null;
  saveUserCharacters();
  renderScenarioCards(currentCharacter);
}

export function cancelScenarioEdit() {
  editingScenarioId = null;
  const editor = document.getElementById("scenarioEditor");
  if (editor) editor.classList.add("hidden");
}

export function setScenarioRole(role) {
  scenarioRole = role === "bot" ? "bot" : "user";
  updateScenarioRoleButtons();
}

export function updateScenarioRoleButtons() {
  const roleButtons = document.querySelectorAll(".role-chip");
  const roleHint = document.getElementById("scenarioRoleHint");
  roleButtons.forEach((btn) => {
    const isActive = btn.dataset.role === scenarioRole;
    btn.classList.toggle("active", isActive);
  });
  if (roleHint) {
    roleHint.textContent = scenarioRole === "user" ? "User" : "Bot";
  }
}
