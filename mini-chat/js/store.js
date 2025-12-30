// store.js
// Central store for global selections

let currentCharacter = null;
let currentSituation = "";
let userPersona = "";
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn({ currentCharacter, currentSituation, userPersona });
    } catch (e) {
      console.error("Store listener error:", e);
    }
  });
}

export function getCurrentCharacter() {
  return currentCharacter;
}

export function setCurrentCharacter(char) {
  currentCharacter = char || null;
  // Preserve legacy global access for any inline scripts.
  window.currentCharacter = currentCharacter;
  notify();
}

export function getCurrentSituation() {
  return currentSituation;
}

export function setCurrentSituation(situation) {
  currentSituation = typeof situation === "string" ? situation : "";
  window.currentSituation = currentSituation;
  notify();
}

export function getUserPersona() {
  return userPersona;
}

export function setUserPersona(persona) {
  userPersona = typeof persona === "string" ? persona.trim() : "";
  window.userPersona = userPersona;
  notify();
}

export function subscribe(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Optional convenience when bootstrapping from persisted state.
export function initStore({ character = null, situation = "", persona = "" } = {}) {
  setCurrentCharacter(character);
  setCurrentSituation(situation);
  setUserPersona(persona);
}
