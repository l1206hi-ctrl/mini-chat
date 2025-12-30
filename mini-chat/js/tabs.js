// js/tabs.js

let currentView = "chat";

export function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const views = document.querySelectorAll(".app-content");

  if (!tabButtons.length || !views.length) {
    console.warn("Tab buttons or view sections are missing (.tab-btn/.app-content).");
    return;
  }

  function switchView(view) {
    currentView = view;

    // update active state
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle("active", isActive);
    });

    // show/hide
    views.forEach((section) => {
      const isMatch = section.dataset.view === view;
      section.style.display = isMatch ? "flex" : "none";
    });
  }

  // click handlers
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (!view) return;
      switchView(view);
    });
  });

  // initial view
  switchView(currentView);
}
