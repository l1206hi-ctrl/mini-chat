// character-list.js
// 캐릭터 목록/그리드 렌더링 전용 모듈
import { CHARACTERS } from "./characters.js";

export function renderCharacterButtons(currentCharacter, { onSelect, onDelete } = {}) {
  const container = document.getElementById("character-buttons");
  if (!container || !CHARACTERS.length) return;

  container.innerHTML = "";

  CHARACTERS.forEach((c) => {
    const btn = document.createElement("button");
    btn.textContent = c.name;
    btn.className = "character-button";

    if (currentCharacter && currentCharacter.id === c.id) {
      btn.classList.add("is-active");
    }

    btn.addEventListener("click", () => {
      onSelect?.(c);
    });

    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      onDelete?.(c);
    });

    container.appendChild(btn);
  });
}

export function renderCharacterGrid(currentCharacter, { onSelect } = {}) {
  const grid = document.getElementById("characterGrid");
  if (!grid) return;

  grid.innerHTML = "";

  CHARACTERS.forEach((c) => {
    const card = document.createElement("div");
    card.className = "char-card";

    const img = document.createElement("div");
    img.className = "char-card__image";
    if (c.imageUrl) {
      img.style.backgroundImage = `url('${c.imageUrl}')`;
    } else {
      img.style.background = "linear-gradient(135deg, #e5e7eb, #cbd5e1)";
    }

    const body = document.createElement("div");
    body.className = "char-card__body";

    const nameEl = document.createElement("div");
    nameEl.className = "char-card__name";
    nameEl.textContent = c.name;

    const summaryEl = document.createElement("div");
    summaryEl.className = "char-card__summary";
    summaryEl.textContent = c.summary || c.tagline || "";

    const tagsEl = document.createElement("div");
    tagsEl.className = "char-card__tags";
    tagsEl.textContent = (c.tags || []).map((t) => `#${t}`).join(" ");

    body.appendChild(nameEl);
    body.appendChild(summaryEl);
    body.appendChild(tagsEl);

    card.appendChild(img);
    card.appendChild(body);

    card.addEventListener("click", () => {
      onSelect?.(c);
    });

    grid.appendChild(card);
  });
}
