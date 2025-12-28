// js/tabs.js

let currentView = "chat";

export function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const views = document.querySelectorAll(".app-content");

  if (!tabButtons.length || !views.length) {
    console.warn("탭 버튼이나 화면(.app-content)을 찾을 수 없어요.");
    return;
  }

  function switchView(view) {
    currentView = view;

    // 탭 버튼 스타일 바꾸기
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.view === view;
      if (isActive) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // 화면 보이기 / 숨기기
    views.forEach((section) => {
      const isMatch = section.dataset.view === view;
      section.style.display = isMatch ? "flex" : "none";
    });
  }

  // 탭 클릭 이벤트
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (!view) return;
      switchView(view);
    });
  });

  // 처음에는 채팅 탭
  switchView(currentView);
}


