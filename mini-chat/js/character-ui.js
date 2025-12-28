// character-ui.js
// 캐릭터 관련 UI + 이벤트를 모두 모아둔 파일

import {
  CHARACTERS,
  saveUserCharacters,
  createEmptyCharacter,
  isDefaultCharacter,
} from "./characters.js";

import {
  loadMessages,
  clearMessages,
  messages,
  addMessage,
} from "./state.js";
import { renderMessages } from "./ui.js";


// --------------------
// 현재 캐릭터 선택 (localStorage)
// --------------------

export function initCharacterFromStorage() {
  if (!CHARACTERS.length) return;

  const savedId = localStorage.getItem("selectedCharacterId");

  let current = CHARACTERS[0];
  if (savedId) {
    const found = CHARACTERS.find((c) => c.id === savedId);
    if (found) current = found;
  }

  window.currentCharacter = current;
}

// --------------------
// 사이드바 버튼 렌더링
// --------------------

function renderCharacterButtons() {
  const container = document.getElementById("character-buttons");
  if (!container || !CHARACTERS.length) return;

  const current = window.currentCharacter || CHARACTERS[0];

  container.innerHTML = "";

  CHARACTERS.forEach((c) => {
    const btn = document.createElement("button");
    btn.textContent = c.name;
    btn.className = "character-button";

    if (current && current.id === c.id) {
      btn.classList.add("is-active");
    }

        btn.addEventListener("click", () => {
      window.currentCharacter = c;
      localStorage.setItem("selectedCharacterId", c.id);

      refreshCharacterUI();

      // 캐릭터별 대화 로드
      loadMessages();

      // 이 캐릭터로는 처음 대화하는 거라면, 첫 인사 자동 추가
      if (
        messages.length === 0 &&
        c.firstMessage &&
        c.firstMessage.trim().length > 0
      ) {
        addMessage("bot", c.firstMessage.trim());
      }

      renderMessages();
    });


    container.appendChild(btn);
  });
}

// --------------------
// 가운데 채팅 헤더(이름/태그라인)
// --------------------

function updateChatHeaderWithCharacter() {
  const current = window.currentCharacter || CHARACTERS[0];

  const nameEl = document.getElementById("currentCharacterName");
  const taglineEl = document.getElementById("currentCharacterTagline");

  if (nameEl && current) {
    nameEl.textContent = current.name;
  }
  if (taglineEl && current) {
    taglineEl.textContent = current.tagline || "";
  }
}

// --------------------
// 오른쪽 캐릭터 폼 채우기 (채팅 탭)
// --------------------

function fillCharacterForm() {
  const current = window.currentCharacter || CHARACTERS[0];

  const nameInput = document.getElementById("charNameInput");
  const taglineInput = document.getElementById("charTaglineInput");
  const tagsInput = document.getElementById("charTagsInput");
  const systemPromptInput = document.getElementById("charSystemPromptInput");

  const toneSelect = document.getElementById("charToneSelect");
  const personalityInput = document.getElementById("charPersonalityInput");
  const greetingInput = document.getElementById("charGreetingInput");

  const worldviewInput = document.getElementById("charWorldviewInput");
  const descriptionInput = document.getElementById("charDescriptionInput");
  const exampleInput = document.getElementById("charExampleDialoguesInput");
  const firstMsgInput = document.getElementById("charFirstMessageInput");
  
  worldviewInput && (worldviewInput.value = current.worldview || "");
  descriptionInput && (descriptionInput.value = current.description || "");
  exampleInput && (exampleInput.value = current.exampleDialogues || "");
  firstMsgInput && (firstMsgInput.value = current.firstMessage || "");


  const saveBtn = document.getElementById("saveCharacterBtn");
  const deleteBtn = document.getElementById("deleteCharacterBtn");

  if (!nameInput || !taglineInput || !tagsInput || !systemPromptInput) {
    return;
  }

  nameInput.value = current.name || "";
  taglineInput.value = current.tagline || "";
  tagsInput.value = Array.isArray(current.tags) ? current.tags.join(", ") : "";
  systemPromptInput.value = current.systemPrompt || "";

  if (toneSelect) {
    toneSelect.value = current.tone || "formal";
  }
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
    deleteBtn.disabled = isDefault;
  }
}

// --------------------
// 전체 캐릭터 UI 갱신 (사이드바 + 헤더 + 폼)
// --------------------

export function refreshCharacterUI() {
  renderCharacterButtons();
  updateChatHeaderWithCharacter();
  fillCharacterForm();
}

// --------------------
// 캐릭터 관리 버튼 이벤트 (채팅 탭 오른쪽 폼)
// --------------------

export function setupCharacterManagementEvents() {
  const newBtn = document.getElementById("newCharacterBtn");
  const saveBtn = document.getElementById("saveCharacterBtn");
  const deleteBtn = document.getElementById("deleteCharacterBtn");

  const nameInput = document.getElementById("charNameInput");
  const taglineInput = document.getElementById("charTaglineInput");
  const tagsInput = document.getElementById("charTagsInput");
  const systemPromptInput = document.getElementById("charSystemPromptInput");

  const toneSelect = document.getElementById("charToneSelect");
  const personalityInput = document.getElementById("charPersonalityInput");
  const greetingInput = document.getElementById("charGreetingInput");

  const worldviewInput = document.getElementById("charWorldviewInput");
  const descriptionInput = document.getElementById("charDescriptionInput");
  const exampleInput = document.getElementById("charExampleDialoguesInput");
  const firstMsgInput = document.getElementById("charFirstMessageInput");


  // 새 캐릭터 버튼
  if (newBtn) {
    newBtn.addEventListener("click", () => {
      const newChar = createEmptyCharacter();
      window.currentCharacter = newChar;
      CHARACTERS.push(newChar);
      saveUserCharacters();
      refreshCharacterUI();
    });
  }

  // 저장 버튼
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const current = window.currentCharacter;
      if (!current) return;

      if (!nameInput || !taglineInput || !tagsInput || !systemPromptInput) return;

      const name = nameInput.value.trim() || "이름 없음";
      const tagline = taglineInput.value.trim();
      const systemPrompt = systemPromptInput.value.trim();

      const tagsRaw = tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const tone = toneSelect ? toneSelect.value : "formal";
      const personality = personalityInput ? personalityInput.value.trim() : "";
      const greeting = greetingInput ? greetingInput.value.trim() : "";
       const worldview = worldviewInput ? worldviewInput.value.trim() : "";
      const description = descriptionInput ? descriptionInput.value.trim() : "";
      const exampleDialogues = exampleInput ? exampleInput.value.trim() : "";
      const firstMessage = firstMsgInput ? firstMsgInput.value.trim() : "";

      current.name = name;
      current.tagline = tagline;
      current.systemPrompt = systemPrompt;
      current.tags = tagsRaw;
      current.tone = tone;
      current.personality = personality;
      current.greeting = greeting;
      current.worldview = worldview;
      current.description = description;
      current.exampleDialogues = exampleDialogues;
      current.firstMessage = firstMessage;

      saveUserCharacters();
      refreshCharacterUI();
    });
  }

  // 삭제 버튼
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const current = window.currentCharacter;
      if (!current) return;

      if (isDefaultCharacter(current)) {
        // 기본 캐릭터는 삭제 불가
        return;
      }

      const idx = CHARACTERS.findIndex((c) => c.id === current.id);
      if (idx !== -1) {
        CHARACTERS.splice(idx, 1);
      }

      // 현재 선택을 기본 캐릭터(첫 번째)로 돌리기
      const fallback = CHARACTERS[0];
      window.currentCharacter = fallback;
      localStorage.setItem("selectedCharacterId", fallback.id);

      // 해당 캐릭터의 대화 로그 안 보이게(초기화 후 다시 로드)
      clearMessages();
      loadMessages();
      renderMessages();

      saveUserCharacters();
      refreshCharacterUI();
    });
  }
}

// --------------------
// 캐릭터 스튜디오 (Characters 탭)
// --------------------

function renderStudioCharacterList() {
  const listEl = document.getElementById("studioCharacterList");
  if (!listEl) return;

  listEl.innerHTML = "";

  CHARACTERS.forEach((c) => {
    const li = document.createElement("li");
    li.className = "studio-char-item";
    li.textContent = c.name + (isDefaultCharacter(c) ? " (기본)" : "");
    li.addEventListener("click", () => {
      window.currentCharacter = c;
      refreshCharacterUI(); // 채팅 탭 UI 동기화
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

  // TODO: tagline, tags, tone, personality, greeting, systemPrompt 등도
  //       여기서 같이 채워주면 됨.
}

function setupStudioFormEvents() {
  const f = document.getElementById("studioCharacterForm");
  const studioNewBtn = document.getElementById("studioNewCharacterBtn");
  if (!f) return;

  // 새 캐릭터 버튼 (스튜디오 탭 전용)
  if (studioNewBtn) {
    studioNewBtn.addEventListener("click", () => {
      const newChar = createEmptyCharacter();
      window.currentCharacter = newChar;
      CHARACTERS.push(newChar);
      saveUserCharacters();
      renderStudioCharacterList();
      refreshCharacterUI();
      fillStudioFormWithCharacter(newChar);
    });
  }

  // 폼 submit → 현재 캐릭터에 반영
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const current = window.currentCharacter;
    if (!current) return;

    const nameInput = f.querySelector("#studioCharNameInput");
    current.name = (nameInput?.value.trim() || "이름 없음");

    // TODO: 여기도 나중에 다른 필드들 추가

    saveUserCharacters();
    renderCharacterButtons();
    renderStudioCharacterList();
    refreshCharacterUI(); // 채팅쪽 헤더/폼도 함께 갱신
  });
}

// 스튜디오 탭 초기화용 외부 함수
export function initCharacterStudio() {
  renderStudioCharacterList();
  setupStudioFormEvents();
}
