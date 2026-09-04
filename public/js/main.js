// 글쓰기/수정 폼 열기·닫기 토글
function toggleForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.classList.toggle("hidden");
}

// 팁 & 공략 게시판 : 카테고리 필터
(function initTipFilter() {
  const filterRow = document.querySelector("[data-tip-filter]");
  if (!filterRow) return;

  const buttons = filterRow.querySelectorAll(".tip-filter-btn");
  const cards = document.querySelectorAll(".tip-grid-card");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        card.style.display = filter === "전체" || card.dataset.category === filter ? "" : "none";
      });
    });
  });
})();

// 팁 & 공략 게시판 : 새 글쓰기 모달
(function initTipWriteModal() {
  const overlay = document.getElementById("tipWriteOverlay");
  if (!overlay) return;

  const openBtn = document.getElementById("tipWriteOpen");
  const closeBtn = document.getElementById("tipWriteClose");
  const cancelBtn = document.getElementById("tipWriteCancel");
  const textarea = document.getElementById("tipWriteContent");
  const counter = document.getElementById("tipWriteCount");
  const form = document.getElementById("tip-write-form");

  const trigger = document.getElementById("tipCategoryTrigger");
  const triggerText = document.getElementById("tipCategoryTriggerText");
  const options = document.getElementById("tipCategoryOptions");
  const categoryValue = document.getElementById("tipCategoryValue");

  function open() {
    overlay.hidden = false;
  }

  function close() {
    overlay.hidden = true;
    options.hidden = true;
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  textarea.addEventListener("input", () => {
    counter.textContent = textarea.value.length;
  });

  trigger.addEventListener("click", () => {
    options.hidden = !options.hidden;
  });

  options.querySelectorAll(".custom-select-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      categoryValue.value = opt.dataset.value;
      triggerText.textContent = opt.dataset.value;
      trigger.classList.add("has-value");
      options.hidden = true;
    });
  });

  document.addEventListener("click", (e) => {
    if (!options.hidden && !e.target.closest("#tipCategorySelect")) {
      options.hidden = true;
    }
  });

  form.addEventListener("submit", (e) => {
    if (!categoryValue.value) {
      e.preventDefault();
      options.hidden = false;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
})();

// 공지사항 게시판 : 등록 모달 (카테고리 커스텀 드롭다운 포함)
(function initNoticeWriteModal() {
  const overlay = document.getElementById("noticeWriteOverlay");
  if (!overlay) return;

  const openBtn = document.getElementById("noticeWriteOpen");
  const closeBtn = document.getElementById("noticeWriteClose");
  const cancelBtn = document.getElementById("noticeWriteCancel");
  const textarea = document.getElementById("noticeWriteContent");
  const counter = document.getElementById("noticeWriteCount");
  const form = document.getElementById("notice-write-form");

  const trigger = document.getElementById("noticeCategoryTrigger");
  const triggerText = document.getElementById("noticeCategoryTriggerText");
  const options = document.getElementById("noticeCategoryOptions");
  const valueInput = document.getElementById("noticeCategoryValue");

  function open() {
    overlay.hidden = false;
  }

  function close() {
    overlay.hidden = true;
    options.hidden = true;
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  textarea.addEventListener("input", () => {
    counter.textContent = textarea.value.length;
  });

  trigger.addEventListener("click", () => {
    options.hidden = !options.hidden;
  });

  options.querySelectorAll(".custom-select-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      valueInput.value = opt.dataset.value;
      triggerText.textContent = opt.dataset.value;
      trigger.classList.add("has-value");
      options.hidden = true;
    });
  });

  document.addEventListener("click", (e) => {
    if (!options.hidden && !e.target.closest("#noticeCategorySelect")) {
      options.hidden = true;
    }
  });

  form.addEventListener("submit", (e) => {
    if (!valueInput.value) {
      e.preventDefault();
      options.hidden = false;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
})();

// 스크린샷 게시판 : 등록 모달 (이미지 드롭존 + 카테고리 커스텀 드롭다운)
(function initPhotoWriteModal() {
  const overlay = document.getElementById("photoWriteOverlay");
  if (!overlay) return;

  const openBtn = document.getElementById("photoWriteOpen");
  const closeBtn = document.getElementById("photoWriteClose");
  const cancelBtn = document.getElementById("photoWriteCancel");
  const textarea = document.getElementById("photoWriteDescription");
  const counter = document.getElementById("photoWriteCount");
  const form = document.getElementById("photo-write-form");

  const trigger = document.getElementById("photoCategoryTrigger");
  const triggerText = document.getElementById("photoCategoryTriggerText");
  const options = document.getElementById("photoCategoryOptions");
  const categoryValue = document.getElementById("photoCategoryValue");

  const dropzone = document.getElementById("photoDropzone");
  const fileInput = document.getElementById("photoFileInput");
  const dropzoneInner = document.getElementById("photoDropzoneInner");
  const preview = document.getElementById("photoDropzonePreview");
  const imageUrlValue = document.getElementById("photoImageUrlValue");

  function open() {
    overlay.hidden = false;
  }

  function close() {
    overlay.hidden = true;
    options.hidden = true;
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  textarea.addEventListener("input", () => {
    counter.textContent = textarea.value.length;
  });

  trigger.addEventListener("click", () => {
    options.hidden = !options.hidden;
  });

  options.querySelectorAll(".custom-select-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      categoryValue.value = opt.dataset.value;
      triggerText.textContent = opt.dataset.value;
      trigger.classList.add("has-value");
      options.hidden = true;
    });
  });

  document.addEventListener("click", (e) => {
    if (!options.hidden && !e.target.closest("#photoCategorySelect")) {
      options.hidden = true;
    }
  });

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      imageUrlValue.value = reader.result;
      preview.src = reader.result;
      preview.hidden = false;
      dropzoneInner.hidden = true;
    };
    reader.readAsDataURL(file);
  }

  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));

  ["dragover", "dragenter"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    loadFile(e.dataTransfer.files[0]);
  });

  form.addEventListener("submit", (e) => {
    if (!imageUrlValue.value || !categoryValue.value) {
      e.preventDefault();
      if (!categoryValue.value) options.hidden = false;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
})();

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

// 모바일 상단 햄버거 메뉴 열기/닫기
(function initMobileMenu() {
  const toggle = document.getElementById("mobileMenuToggle");
  const overlay = document.getElementById("mobileMenuOverlay");
  if (!toggle || !overlay) return;

  const closeBtn = document.getElementById("mobileMenuClose");

  function openMenu() {
    overlay.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    overlay.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);
  overlay.querySelectorAll(".mobile-menu-nav a").forEach((a) => a.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeMenu();
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

// 멤버 등록 : 아바타 업로드 + 직급/직업 커스텀 드롭다운
(function initMemberNewForm() {
  const form = document.getElementById("member-new-form");
  if (!form) return;

  const dropzone = document.getElementById("memberAvatarDropzone");
  const fileInput = document.getElementById("memberAvatarInput");
  const inner = document.getElementById("memberAvatarInner");
  const preview = document.getElementById("memberAvatarPreview");
  const avatarValue = document.getElementById("memberAvatarValue");

  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatarValue.value = reader.result;
      preview.src = reader.result;
      preview.hidden = false;
      inner.hidden = true;
    };
    reader.readAsDataURL(file);
  });

  function setupSelect(prefix) {
    const trigger = document.getElementById(prefix + "Trigger");
    const triggerText = document.getElementById(prefix + "TriggerText");
    const options = document.getElementById(prefix + "Options");
    const value = document.getElementById(prefix + "Value");

    trigger.addEventListener("click", () => {
      options.hidden = !options.hidden;
    });

    options.querySelectorAll(".custom-select-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        value.value = opt.dataset.value;
        triggerText.textContent = opt.dataset.value;
        trigger.classList.add("has-value");
        options.hidden = true;
      });
    });

    document.addEventListener("click", (e) => {
      if (!options.hidden && !e.target.closest("#" + prefix + "Select")) {
        options.hidden = true;
      }
    });

    return { options, value };
  }

  const role = setupSelect("memberRole");
  const job = setupSelect("memberJob");

  form.addEventListener("submit", (e) => {
    if (!role.value.value || !job.value.value) {
      e.preventDefault();
      if (!role.value.value) role.options.hidden = false;
      else job.options.hidden = false;
    }
  });
})();
