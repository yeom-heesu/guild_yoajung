// 글쓰기/수정 폼 열기·닫기 토글
function toggleForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.classList.toggle("hidden");
}

// 출석체크 모달 열기/닫기
(function initAttendanceModal() {
  const overlay = document.getElementById("attendanceModalOverlay");
  if (!overlay) return;

  const closeBtn = document.getElementById("attendanceModalClose");

  document.querySelectorAll("[data-open-attendance-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      overlay.hidden = false;
    });
  });

  closeBtn.addEventListener("click", () => {
    overlay.hidden = true;
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) overlay.hidden = true;
  });
})();

// 이번 주 투표 : 요일 선택 시 평일/주말에 맞는 시간대 버튼 노출
(function initWeeklyVoteDays() {
  document.querySelectorAll("[data-vote-days]").forEach((daysWrap) => {
    const col = daysWrap.closest(".weekly-vote-col");
    if (!col) return;
    const form = col.querySelector("[data-time-form]");
    const dayInput = form.querySelector("[data-day-input]");
    const weekdayTimes = form.querySelector("[data-weekday-times]");
    const weekendTimes = form.querySelector("[data-weekend-times]");

    daysWrap.querySelectorAll(".weekly-vote-day-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        daysWrap.querySelectorAll(".weekly-vote-day-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        dayInput.value = btn.dataset.day;
        form.hidden = false;

        const isWeekend = btn.dataset.day === "sat" || btn.dataset.day === "sun";
        weekdayTimes.hidden = isWeekend;
        weekendTimes.hidden = !isWeekend;
      });
    });
  });
})();

// 이번 주 투표 : 결과보기 모달 열기/닫기
(function initVoteResultModal() {
  const overlays = document.querySelectorAll(".vote-result-overlay");
  if (!overlays.length) return;

  document.querySelectorAll("[data-open-vote-result]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const overlay = document.getElementById("voteResultOverlay-" + btn.dataset.openVoteResult);
      if (overlay) overlay.hidden = false;
    });
  });

  document.querySelectorAll("[data-close-vote-result]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".vote-result-overlay").hidden = true;
    });
  });

  overlays.forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.hidden = true;
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    overlays.forEach((overlay) => {
      if (!overlay.hidden) overlay.hidden = true;
    });
  });
})();

// 홈 화면 스크롤 위치에 따라 상단 GNB 활성 탭 전환
(function initScrollSpy() {
  if (!document.body.classList.contains("page-home")) return;

  const sections = [
    { id: "section-members", href: "/#section-members" },
    { id: "section-notice", href: "/#section-notice" },
    { id: "section-tips", href: "/#section-tips" },
    { id: "section-photos", href: "/#section-photos" },
  ]
    .map((s) => ({ ...s, el: document.getElementById(s.id) }))
    .filter((s) => s.el)
    // 실제 DOM 상 세로 위치 순으로 정렬 (섹션 순서가 바뀌어도 항상 정확하게 동작하도록)
    .sort((a, b) => a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top);

  if (!sections.length) return;

  const navLinks = document.querySelectorAll(".topnav-gnb a");
  const topbar = document.querySelector(".topbar");
  const triggerY = (topbar ? topbar.getBoundingClientRect().height : 70) + 25;
  let ticking = false;

  function setActive(href) {
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === href));
  }

  function updateActiveNav() {
    ticking = false;
    let current = "/";
    for (const s of sections) {
      if (s.el.getBoundingClientRect().top <= triggerY) {
        current = s.href;
      }
    }
    const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
    if (atBottom) {
      current = sections[sections.length - 1].href;
    }
    setActive(current);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActiveNav);
    },
    { passive: true }
  );

  updateActiveNav();
})();
