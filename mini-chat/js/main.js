// main.js
import { setupEvents } from "./events.js";
import { loadMessages } from "./state.js";
import { renderMessages } from "./ui.js";

import { loadUserCharacters } from "./characters.js";
import {
  initCharacterFromStorage,
  refreshCharacterUI,
  setupCharacterManagementEvents,
  initCharacterStudio,
} from "./character-ui.js";

import { loadUserProfile, saveUserProfile } from "./profile.js";
import { initTabs } from "./tabs.js";

// --------------------
// 프로필 탭 (이름만 저장/불러오기 버전)
// --------------------

function setupProfileView() {
  const profile = loadUserProfile(); // { name: "..."} 또는 기본값

  const nameInput = document.getElementById("profileNameInput");
  const saveBtn = document.getElementById("saveProfileBtn");

  if (nameInput) {
    nameInput.value = profile.name || "";
  }

  if (saveBtn && nameInput) {
    saveBtn.addEventListener("click", () => {
      const newProfile = {
        name: nameInput.value.trim(),
      };
      saveUserProfile(newProfile);
      alert("프로필을 저장했어요!");
    });
  }
}

// --------------------
// 앱 전체 초기화 (bootstrap)
// --------------------

document.addEventListener("DOMContentLoaded", () => {
  // 1) 유저 캐릭터 불러오기
  loadUserCharacters();

  // 2) 현재 캐릭터 결정 + 캐릭터 UI
  initCharacterFromStorage();
  refreshCharacterUI();
  setupCharacterManagementEvents();

  // 3) 현재 캐릭터 기준으로 메시지 불러오기 + 렌더링
  loadMessages();
  renderMessages();

  // 4) 채팅 입력/버튼 이벤트
  setupEvents();

  // 5) 탭 버튼 초기화
  initTabs();

  // 6) 캐릭터 스튜디오 초기화
  initCharacterStudio();

  // 7) 프로필 탭 초기화
  setupProfileView();
});

