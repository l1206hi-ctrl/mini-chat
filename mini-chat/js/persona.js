// persona.js
import { getUserPersona, setUserPersona } from "./store.js";

const PERSONA_STORAGE_KEY = "mini-chat-user-persona";

export function loadStoredPersona() {
  try {
    const saved = localStorage.getItem(PERSONA_STORAGE_KEY);
    if (typeof saved === "string") {
      setUserPersona(saved);
    }
  } catch (err) {
    console.warn("Failed to load stored persona:", err);
  }
}

function persistPersona(text) {
  try {
    localStorage.setItem(PERSONA_STORAGE_KEY, text || "");
  } catch (err) {
    console.warn("Failed to save persona:", err);
  }
}

export function initPersonaUI() {
  const openBtn = document.getElementById("personaBtn");
  const openBtnAlt = document.getElementById("personaBtnAlt");
  const modal = document.getElementById("personaModal");
  const modalBody = document.getElementById("personaModalBody");
  const textarea = document.getElementById("personaTextarea");
  const saveBtn = document.getElementById("personaSaveBtn");
  const closeBtn = document.getElementById("personaCloseBtn");

  const closeModal = () => {
    modal?.classList.add("hidden");
  };

  const openModal = () => {
    if (modal && textarea) {
      modal.classList.remove("hidden");
      textarea.value = getUserPersona() || "";
      textarea.focus();
    }
  };

  openBtn?.addEventListener("click", openModal);
  openBtnAlt?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  modalBody?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  saveBtn?.addEventListener("click", () => {
    if (!textarea) return;
    const text = textarea.value.trim();
    setUserPersona(text);
    persistPersona(text);
    closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });
}
