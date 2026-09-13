const express = require("express");
const session = require("express-session");
const path = require("path");

// TODO(API 연동): 지금은 로컬 목업 데이터를 사용합니다.
// 실제 서비스 전환 시 이 require 대신 API 클라이언트(axios 등)로 교체하세요.
const { guildIntro, polls, weeklyVote } = require("./data/mockData");
const { log } = require("console");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- 기본 설정 ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
// limit: 스크린샷 등록 시 이미지를 base64로 인코딩해 전송하므로 넉넉하게 설정
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(express.json({ limit: "15mb" }));

// TODO(API 연동): 실제 서비스에서는 세션 스토어를 Redis 등으로 교체하고,
// secret 값은 .env / 환경변수(SESSION_SECRET)로 분리하세요.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "yoajeong-guild-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1일
  })
);

// 로그인한 유저 정보 + 현재 경로를 모든 뷰에서 사용할 수 있도록 공통 변수로 전달
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.isAdmin = isAdmin(req.session.user);
  res.locals.guildIntro = guildIntro;
  next();
});

// 쓰기 작업(등록/수정/삭제/투표/출석)에만 사용하는 로그인 가드
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// 실제 사용자 계정 DB API 서버
const EXTERNAL_API_BASE = "http://painvegas53.iptime.org:8026";

// 외부 API는 JSON이 아닌 form(application/x-www-form-urlencoded)으로 파라미터를 받음
// null/undefined 값은 제외하고 URLSearchParams로 변환
function toFormBody(params) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.append(key, value);
  });
  return body;
}

// 외부 API 서버가 응답 없이 멈춰있을 때 우리 페이지까지 같이 멈추지 않도록 타임아웃을 둠
// (fetch 기본 타임아웃이 없어 서버가 다운되면 요청이 수십 초씩 걸릴 수 있음)
function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// 관리자(userType: ADMIN) 전용 가드 - 팁 & 공략 글쓰기 등에 사용
const ADMIN_ROLES = ["ADMIN"];
function isAdmin(user) {
  return !!user && ADMIN_ROLES.includes(user.role);
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req.session.user)) {
    return res.redirect("/tips");
  }
  next();
}

// 출석 모달/도장판에 필요한 이번 달 날짜 정보 계산 (실제 데이터는 getAttendCheckHist로 조회)
function syncAttendanceMonth() {
  const now = new Date();

  return {
    attMonthLabel: now.getMonth() + 1,
    attDaysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    attTodayDay: now.getDate(),
  };
}

// ---------- 이번 주 투표(연주회/어비스) ----------
const VOTE_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const VOTE_DAY_LABELS = { mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일" };
const VOTE_WEEKDAY_TIMES = [20, 21, 22];
const VOTE_WEEKEND_TIMES = [12, 15, 20];

function timesForDay(dayKey) {
  return dayKey === "sat" || dayKey === "sun" ? VOTE_WEEKEND_TIMES : VOTE_WEEKDAY_TIMES;
}

// 이번 주 월요일 날짜(YYYY-MM-DD)를 주차 식별 키로 사용
function currentWeekKey() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 월=0 ... 일=6
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  return monday.toISOString().slice(0, 10);
}

// 매주 월요일이 지나면 두 투표(연주회/어비스) 집계를 초기화
function syncWeeklyVote() {
  const weekKey = currentWeekKey();
  if (weeklyVote.weekKey !== weekKey) {
    weeklyVote.weekKey = weekKey;
    ["concert", "abyss"].forEach((type) => {
      VOTE_DAY_KEYS.forEach((dayKey) => {
        const emptySlots = {};
        timesForDay(dayKey).forEach((t) => (emptySlots[t] = []));
        weeklyVote[type].slotsByDay[dayKey] = emptySlots;
      });
    });
  }
}

// 이번 주에 해당 유저가 이미 투표했는지 확인 (연주회/어비스 각각 1회만 가능)
function hasVoted(type, nickname) {
  if (!nickname) return false;
  return VOTE_DAY_KEYS.some((dayKey) =>
    Object.values(weeklyVote[type].slotsByDay[dayKey]).some((names) => names.includes(nickname))
  );
}

// 결과보기 모달에 쓸 요일별 집계(참여 인원, 막대 비율, 시간대별 텍스트) 계산
function computeVoteStats(type) {
  const dayTotals = VOTE_DAY_KEYS.map((dayKey) => {
    const slots = weeklyVote[type].slotsByDay[dayKey];
    const times = timesForDay(dayKey);
    const total = times.reduce((sum, t) => sum + slots[t].length, 0);
    return { dayKey, total, times };
  });

  const grandTotal = dayTotals.reduce((sum, d) => sum + d.total, 0);
  const maxTotal = Math.max(1, ...dayTotals.map((d) => d.total));

  const days = dayTotals.map((d) => {
    const slots = weeklyVote[type].slotsByDay[d.dayKey];
    const breakdownText = d.times.map((t) => `${t}시 ${slots[t].length}명`).join(" · ");
    return {
      dayKey: d.dayKey,
      label: VOTE_DAY_LABELS[d.dayKey],
      total: d.total,
      percent: d.total > 0 ? Math.max(6, Math.round((d.total / maxTotal) * 100)) : 0,
      breakdownText,
    };
  });

  return { total: grandTotal, days };
}

// ---------- 로그인 / 로그아웃 ----------
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const apiRes = await fetch(`${EXTERNAL_API_BASE}/v1Api/loginUser`, {
      method: "POST",
      body: toFormBody({ userId: username, userPw: password }),
    });
    const data = await apiRes.json();

    if (!data.success || !data.userInfo) {
      // 참고: 외부 API가 미존재 계정 등에서 500(내부 에러 메시지)을 그대로 내려주는 경우가 있어
      // 사용자에게는 항상 일반적인 안내 문구만 노출합니다.
      return res.render("login", { error: "아이디 또는 비밀번호를 다시 확인해주세요." });
    }

    const info = data.userInfo;
    const setCookie = apiRes.headers.get("set-cookie");
    req.session.user = {
      id: info.userIdx,
      username: info.userId,
      nickname: info.userNm,
      avatar: `/images/members/member_${(Number(info.userIdx) % 70) }.png`,
      role: info.userType,
      // 출석체크(addAttendCheck)처럼 별도 식별자 없이 "로그인 세션 자체"로 본인을 판별하는 API 호출에 사용
      externalSessionCookie: setCookie ? setCookie.split(";")[0] : null,
    };
    res.redirect("/?login=success");
  } catch (err) {
    res.render("login", { error: "로그인 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ---------- 대시보드(홈) : 비회원도 접근 가능 ----------
app.get("/", async (req, res) => {
  syncWeeklyVote();
  const nickname = req.session.user && req.session.user.nickname;
  const [memberList, noticeList, tipList, photoList, attendHist] = await Promise.all([
    fetchExternalMemberList().catch(() => []),
    fetchExternalBbsList(BBS_TYPE.notice).catch(() => []),
    fetchExternalBbsList(BBS_TYPE.tip).catch(() => []),
    fetchExternalBbsList(BBS_TYPE.photo).catch(() => []),
    fetchAttendHist().catch(() => []),
  ]);
  const members = sortMembersByRole(memberList.map(mapMember));
  const notices = sortBbsByPinned(noticeList).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "공지")));
  const tips = sortByDateDesc(tipList).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "생활팁")));
  const photos = sortByDateDesc(photoList).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "생활")));
  const attendance = buildAttendanceView(attendHist, req.session.user);

  res.render("index", {
    pageTitle: "홈",
    guildIntro,
    members,
    tips,
    photos,
    notices,
    attendance,
    ...syncAttendanceMonth(),
    voteDayKeys: VOTE_DAY_KEYS,
    voteDayLabels: VOTE_DAY_LABELS,
    concertVoted: hasVoted("concert", nickname),
    abyssVoted: hasVoted("abyss", nickname),
    concertStats: computeVoteStats("concert"),
    abyssStats: computeVoteStats("abyss"),
    loginSuccess: req.query.login === "success",
  });
});

// 연주회/어비스 요일·시간 투표 (사용자당 주 1회씩만 가능)
app.post("/weekly-vote/:type", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/weekly-vote 로 교체
  const { type } = req.params;
  if (type !== "concert" && type !== "abyss") return res.redirect("/");

  syncWeeklyVote();

  const { day } = req.body;
  const time = Number(req.body.time);
  const nickname = req.session.user.nickname;

  if (VOTE_DAY_KEYS.includes(day) && timesForDay(day).includes(time) && !hasVoted(type, nickname)) {
    weeklyVote[type].slotsByDay[day][time].push(nickname);
  }

  res.redirect(req.get("Referer") || "/");
});

// ---------- 출석체크 : 조회는 비회원도 가능, 체크는 로그인 필요 ----------
app.get("/attendance", async (req, res) => {
  const hist = await fetchAttendHist().catch(() => []);
  const attendance = buildAttendanceView(hist, req.session.user);
  res.render("attendance", { pageTitle: "출석체크", attendance, ...syncAttendanceMonth() });
});

app.post("/attendance/check", requireLogin, async (req, res) => {
  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) {
      throw new Error("로그인 세션 정보가 없습니다. 다시 로그인해주세요.");
    }

    await fetch(`${EXTERNAL_API_BASE}/v1Api/addAttendCheck`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
  } catch (err) {
    // TODO: 실패 사유를 화면에 노출하도록 개선
  }

  res.redirect(req.get("Referer") || "/attendance");
});

// ---------- 공지사항 (외부 게시글 API 연동, bbsType="N") ----------
app.get("/notice", async (req, res) => {
  const list = await fetchExternalBbsList(BBS_TYPE.notice).catch(() => []);
  const notices = sortBbsByPinned(list).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "공지")));
  res.render("notice", { pageTitle: "공지사항", notices, result: null });
});

app.get("/notice/:id", async (req, res) => {
  const list = await fetchExternalBbsList(BBS_TYPE.notice).catch(() => []);
  const found = list.find((b) => String(b.bbsIdx) === req.params.id);
  if (!found) return res.redirect("/notice");
  const extras = getBbsExtras(found.bbsIdx, "공지");
  extras.views += 1;
  res.render("notice_detail", { pageTitle: "공지사항", notice: mapBbs(found, extras) });
});

app.post("/notice", requireAdmin, async (req, res) => {
  const { title, category, content } = req.body;
  let errorResult = null;

  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    const apiRes = await fetch(`${EXTERNAL_API_BASE}/v1Api/addBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsType: BBS_TYPE.notice, bbsTitle: title, bbsContext: content, fixYn: "N" }),
    });
    const data = await apiRes.json();

    if (data.success) {
      const list = await fetchExternalBbsList(BBS_TYPE.notice).catch(() => []);
      const created = findJustCreated(list);
      if (created) {
        getBbsExtras(created.bbsIdx, "공지").category = category || "공지";
      }
    } else {
      errorResult = { success: false, message: "공지 등록에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }
  } catch (err) {
    errorResult = { success: false, message: "서버 요청에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  if (errorResult) {
    const list = await fetchExternalBbsList(BBS_TYPE.notice).catch(() => []);
    const notices = sortBbsByPinned(list).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "공지")));
    return res.render("notice", { pageTitle: "공지사항", notices, result: errorResult });
  }

  res.redirect("/notice");
});

app.post("/notice/:id/edit", requireLogin, async (req, res) => {
  const { title, category, content } = req.body;

  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    await fetch(`${EXTERNAL_API_BASE}/v1Api/upBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsIdx: req.params.id, bbsType: BBS_TYPE.notice, bbsTitle: title, bbsContext: content }),
    });
  } catch (err) {
    // TODO: 수정 실패 사유를 화면에 노출하도록 개선
  }

  if (category) getBbsExtras(req.params.id, "공지").category = category;
  res.redirect(`/notice/${req.params.id}`);
});

app.post("/notice/:id/delete", requireLogin, async (req, res) => {
  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    // 별도 삭제 API가 없어 upBbs의 delYn="Y"로 소프트 삭제 처리
    await fetch(`${EXTERNAL_API_BASE}/v1Api/upBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsIdx: req.params.id, delYn: "Y" }),
    });
  } catch (err) {
    // TODO: 삭제 실패 사유를 화면에 노출하도록 개선
  }

  delete bbsExtras[req.params.id];
  res.redirect("/notice");
});

app.post("/notice/:id/comments", requireLogin, (req, res) => {
  // 참고: bbs API에 댓글 개념이 없어 다른 게시판들과 동일하게 로컬(메모리)에서만 관리합니다.
  const extras = getBbsExtras(req.params.id, "공지");
  if (req.body.content && req.body.content.trim()) {
    extras.comments.push({
      id: extras.comments.length ? Math.max(...extras.comments.map((c) => c.id)) + 1 : 1,
      author: req.session.user.nickname,
      date: new Date().toISOString().slice(0, 10),
      content: req.body.content.trim(),
    });
  }
  res.redirect(`/notice/${req.params.id}`);
});

// ---------- 팁 & 공략 (외부 게시글 API 연동, bbsType="T") : 조회는 비회원도 가능, 등록/수정/삭제는 로그인 필요 ----------
app.get("/tips", async (req, res) => {
  const list = await fetchExternalBbsList(BBS_TYPE.tip).catch(() => []);
  const tips = sortByDateDesc(list).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "생활팁")));
  res.render("tips", { pageTitle: "팁 & 공략", tips, result: null });
});

app.get("/tips/:id", async (req, res) => {
  const list = await fetchExternalBbsList(BBS_TYPE.tip).catch(() => []);
  const found = list.find((b) => String(b.bbsIdx) === req.params.id);
  if (!found) return res.redirect("/tips");
  const extras = getBbsExtras(found.bbsIdx, "생활팁");
  extras.views += 1;
  res.render("tip_detail", { pageTitle: "팁 & 공략", tip: mapBbs(found, extras) });
});

// 글쓰기는 관리자(ADMIN)만 가능
app.post("/tips", requireAdmin, async (req, res) => {
  const { title, category, content } = req.body;
  let errorResult = null;

  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    const apiRes = await fetch(`${EXTERNAL_API_BASE}/v1Api/addBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsType: BBS_TYPE.tip, bbsTitle: title, bbsContext: content, fixYn: "N" }),
    });
    const data = await apiRes.json();

    if (data.success) {
      const list = await fetchExternalBbsList(BBS_TYPE.tip).catch(() => []);
      const created = findJustCreated(list);
      if (created) {
        getBbsExtras(created.bbsIdx, "생활팁").category = category || "생활팁";
      }
    } else {
      errorResult = { success: false, message: "글 등록에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }
  } catch (err) {
    errorResult = { success: false, message: "서버 요청에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  if (errorResult) {
    const list = await fetchExternalBbsList(BBS_TYPE.tip).catch(() => []);
    const tips = sortByDateDesc(list).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "생활팁")));
    return res.render("tips", { pageTitle: "팁 & 공략", tips, result: errorResult });
  }

  res.redirect("/tips");
});

app.post("/tips/:id/comments", requireLogin, (req, res) => {
  // 참고: bbs API에 댓글 개념이 없어 로컬(메모리)에서만 관리합니다.
  const extras = getBbsExtras(req.params.id, "생활팁");
  if (req.body.content && req.body.content.trim()) {
    extras.comments.push({
      id: extras.comments.length ? Math.max(...extras.comments.map((c) => c.id)) + 1 : 1,
      author: req.session.user.nickname,
      date: new Date().toISOString().slice(0, 10),
      content: req.body.content.trim(),
    });
  }
  res.redirect(`/tips/${req.params.id}`);
});

app.post("/tips/:id/edit", requireLogin, async (req, res) => {
  const { title, category, content } = req.body;

  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    await fetch(`${EXTERNAL_API_BASE}/v1Api/upBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsIdx: req.params.id, bbsType: BBS_TYPE.tip, bbsTitle: title, bbsContext: content }),
    });
  } catch (err) {
    // TODO: 수정 실패 사유를 화면에 노출하도록 개선
  }

  if (category) getBbsExtras(req.params.id, "생활팁").category = category;
  res.redirect(`/tips/${req.params.id}`);
});

app.post("/tips/:id/delete", requireLogin, async (req, res) => {
  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    // 별도 삭제 API가 없어 upBbs의 delYn="Y"로 소프트 삭제 처리
    await fetch(`${EXTERNAL_API_BASE}/v1Api/upBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsIdx: req.params.id, delYn: "Y" }),
    });
  } catch (err) {
    // TODO: 삭제 실패 사유를 화면에 노출하도록 개선
  }

  delete bbsExtras[req.params.id];
  res.redirect("/tips");
});

// ---------- 스크린샷(사진) (외부 게시글 API 연동, bbsType="S") : 조회는 비회원도 가능, 등록/수정/삭제는 로그인 필요 ----------
app.get("/photos", async (req, res) => {
  const list = await fetchExternalBbsList(BBS_TYPE.photo).catch(() => []);
  const photos = sortByDateDesc(list).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "생활")));
  res.render("photos", { pageTitle: "길드원 스크린샷", photos, result: null });
});

app.get("/photos/:id", async (req, res) => {
  const list = await fetchExternalBbsList(BBS_TYPE.photo).catch(() => []);
  const found = list.find((b) => String(b.bbsIdx) === req.params.id);
  if (!found) return res.redirect("/photos");
  const extras = getBbsExtras(found.bbsIdx, "생활");
  extras.views += 1;
  const photo = mapBbs(found, extras);
  const liked = !!(req.session.user && photo.likedBy.includes(req.session.user.nickname));
  res.render("photo_detail", { pageTitle: "길드원 스크린샷", photo, liked });
});

app.post("/photos", requireLogin, async (req, res) => {
  const { title, category, description, imageUrl } = req.body;
  const image = imageUrl || "https://picsum.photos/seed/default/600/600";
  let errorResult = null;

  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    const apiRes = await fetch(`${EXTERNAL_API_BASE}/v1Api/addBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsType: BBS_TYPE.photo, bbsTitle: title, bbsContext: description, bbsImage: image, fixYn: "N" }),
    });
    const data = await apiRes.json();
   
    if (data.success) {
      const list = await fetchExternalBbsList(BBS_TYPE.photo).catch(() => []);
      const created = findJustCreated(list);
      if (created) {
        getBbsExtras(created.bbsIdx, "생활").category = category || "생활";
      }
    } else {
      errorResult = { success: false, message: "스크린샷 등록에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }
  } catch (err) {
    errorResult = { success: false, message: "서버 요청에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  if (errorResult) {
    const list = await fetchExternalBbsList(BBS_TYPE.photo).catch(() => []);
    const photos = sortByDateDesc(list).map((b) => mapBbs(b, getBbsExtras(b.bbsIdx, "생활")));
    return res.render("photos", { pageTitle: "길드원 스크린샷", photos, result: errorResult });
  }

  res.redirect("/photos");
});

app.post("/photos/:id/edit", requireLogin, async (req, res) => {
  // 이미지는 수정 대상에서 제외, 제목/항목/내용만 반영
  const { title, category, content } = req.body;

  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    await fetch(`${EXTERNAL_API_BASE}/v1Api/upBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsIdx: req.params.id, bbsType: BBS_TYPE.photo, bbsTitle: title, bbsContext: content }),
    });
  } catch (err) {
    // TODO: 수정 실패 사유를 화면에 노출하도록 개선
  }

  if (category) getBbsExtras(req.params.id, "생활").category = category;
  res.redirect(`/photos/${req.params.id}`);
});

app.post("/photos/:id/delete", requireLogin, async (req, res) => {
  try {
    const cookie = req.session.user.externalSessionCookie;
    if (!cookie) throw new Error("세션 정보가 없습니다.");

    // 별도 삭제 API가 없어 upBbs의 delYn="Y"로 소프트 삭제 처리
    await fetch(`${EXTERNAL_API_BASE}/v1Api/upBbs`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: toFormBody({ bbsIdx: req.params.id, delYn: "Y" }),
    });
  } catch (err) {
    // TODO: 삭제 실패 사유를 화면에 노출하도록 개선
  }

  delete bbsExtras[req.params.id];
  res.redirect("/photos");
});

app.post("/photos/:id/like", requireLogin, (req, res) => {
  // 참고: bbs API에 좋아요 개념이 없어 로컬(메모리)에서만 관리합니다.
  const extras = getBbsExtras(req.params.id, "생활");
  const nickname = req.session.user.nickname;
  const idx = extras.likedBy.indexOf(nickname);
  if (idx === -1) {
    extras.likedBy.push(nickname);
  } else {
    extras.likedBy.splice(idx, 1);
  }
  res.redirect(`/photos/${req.params.id}`);
});

app.post("/photos/:id/comments", requireLogin, (req, res) => {
  // 참고: bbs API에 댓글 개념이 없어 로컬(메모리)에서만 관리합니다.
  const extras = getBbsExtras(req.params.id, "생활");
  if (req.body.content && req.body.content.trim()) {
    extras.comments.push({
      id: extras.comments.length ? Math.max(...extras.comments.map((c) => c.id)) + 1 : 1,
      author: req.session.user.nickname,
      date: new Date().toISOString().slice(0, 10),
      content: req.body.content.trim(),
    });
  }
  res.redirect(`/photos/${req.params.id}`);
});

// ---------- 투표게시판 : 조회는 비회원도 가능, 투표/등록/삭제는 로그인 필요 ----------
app.get("/polls", (req, res) => {
  res.render("polls", { pageTitle: "투표게시판", polls });
});

app.get("/polls/:id", (req, res) => {
  const poll = polls.find((p) => p.id === Number(req.params.id));
  if (!poll) return res.redirect("/polls");

  let userVotedOptionId = null;
  if (req.session.user) {
    const votedOption = poll.options.find((o) => o.votes.includes(req.session.user.nickname));
    if (votedOption) userVotedOptionId = votedOption.id;
  }

  res.render("poll_detail", { pageTitle: "투표게시판", poll, userVotedOptionId });
});

app.post("/polls", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/polls 로 교체
  const { title, type, description, deadline, optionsText } = req.body;
  const optionLabels = (optionsText || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  polls.unshift({
    id: polls.length ? Math.max(...polls.map((p) => p.id)) + 1 : 1,
    title,
    type: type || "기타",
    description,
    author: req.session.user.nickname,
    date: new Date().toISOString().slice(0, 10),
    deadline,
    options: optionLabels.map((label, idx) => ({ id: idx + 1, label, votes: [] })),
  });

  res.redirect("/polls");
});

app.post("/polls/:id/vote", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/polls/:id/vote 로 교체
  const poll = polls.find((p) => p.id === Number(req.params.id));
  if (poll) {
    const optionId = Number(req.body.optionId);
    poll.options.forEach((o) => {
      o.votes = o.votes.filter((v) => v !== req.session.user.nickname);
    });
    const target = poll.options.find((o) => o.id === optionId);
    if (target) target.votes.push(req.session.user.nickname);
  }
  res.redirect(`/polls/${req.params.id}`);
});

app.post("/polls/:id/delete", requireLogin, (req, res) => {
  // TODO(API 연동): DELETE /api/polls/:id 로 교체
  const idx = polls.findIndex((p) => p.id === Number(req.params.id));
  if (idx !== -1) polls.splice(idx, 1);
  res.redirect("/polls");
});

// ---------- 길드원 리스트 (외부 멤버 API 연동) : 조회는 비회원도 가능, 등록/수정은 로그인 필요 ----------
app.get("/members", async (req, res) => {
  const list = await fetchExternalMemberList().catch(() => []);
  res.render("members", { pageTitle: "멤버소개", members: sortMembersByRole(list.map(mapMember)) });
});

const EMPTY_MEMBER_FORM = { userIdx: "", nickname: "", role: "", job: "", level: "", intro: "" };

// 주의: '/members/:id'보다 먼저 등록해야 'new'가 id로 잘못 해석되지 않음
app.get("/members/new", requireLogin, (req, res) => {
  // 기본값은 본인 계정이지만, 다른 사용자 몫으로 등록할 수도 있어 직접 수정 가능하게 둠
  const form = { ...EMPTY_MEMBER_FORM, userIdx: req.session.user.id };
  res.render("member_new", { pageTitle: "멤버 등록", result: null, form });
});

app.get("/members/:id", async (req, res) => {
  const info = await fetchExternalMember(req.params.id).catch(() => null);
  if (!info) return res.redirect("/members");
  res.render("member_detail", { pageTitle: "멤버소개", member: mapMember(info), editResult: null });
});

app.post("/members", requireLogin, async (req, res) => {
  const { userIdx, nickname, avatar, role, job, level, intro } = req.body;
  const form = { userIdx, nickname, role, job, level, intro };

  try {
    const login = await loginExternalApi();
    if (!login.sessionCookie) {
      throw new Error(`세션 로그인 실패: ${login.message}`);
    }
    const apiRes = await fetch(`${EXTERNAL_API_BASE}/v1Api/addMember`, {
      method: "POST",
      headers: { Cookie: login.sessionCookie },
      body: toFormBody({
        userIdx,
        userNickName: nickname,
        userGameRoll: job,
        userGameLevel: level,
        userClanRoll: role,
        userIntro: intro,
        userProfileImage: avatar,
      }),
    });
    const data = await apiRes.json();
    if (!data.success) {
      // 참고: 실패 시 data.message에 DB 예외 메시지가 그대로 담겨오는 경우가 있어 노출하지 않고 일반 문구로 대체
      return res.render("member_new", {
        pageTitle: "멤버 등록",
        result: { success: false, message: "멤버 등록에 실패했습니다. 잠시 후 다시 시도해주세요." },
        form,
      });
    }
  } catch (err) {
    return res.render("member_new", {
      pageTitle: "멤버 등록",
      result: { success: false, message: "서버 요청에 실패했습니다. 잠시 후 다시 시도해주세요." },
      form,
    });
  }

  res.redirect(`/members/${userIdx}`);
});

app.post("/members/:id/edit", requireLogin, async (req, res) => {
  const { nickname, avatar, role, job, level, intro } = req.body;
  const payload = { userIdx: req.params.id };
  // "선택 값은 입력된 필드만 반영" 정책에 맞춰, 실제로 입력된 필드만 함께 보냄
  if (nickname) payload.userNickName = nickname;
  if (job) payload.userGameRoll = job;
  if (level) payload.userGameLevel = level;
  if (role) payload.userClanRoll = role;
  if (intro) payload.userIntro = intro;
  if (avatar) payload.userProfileImage = avatar;

  let editResult;
  try {
    const login = await loginExternalApi();
    if (!login.sessionCookie) {
      throw new Error(`세션 로그인 실패: ${login.message}`);
    }

    const apiRes = await fetch(`${EXTERNAL_API_BASE}/v1Api/upMember`, {
      method: "POST",
      headers: { Cookie: login.sessionCookie },
      body: toFormBody(payload),
    });
    const data = await apiRes.json();
    // 참고: 실패 시 data.message에 DB 예외 메시지가 그대로 담겨오는 경우가 있어 노출하지 않고 일반 문구로 대체
    editResult = data.success
      ? { success: true, message: "멤버 정보가 수정되었습니다." }
      : { success: false, message: "멤버 수정에 실패했습니다. 잠시 후 다시 시도해주세요." };
  } catch (err) {
    editResult = { success: false, message: "서버 요청에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  const info = await fetchExternalMember(req.params.id).catch(() => null);
  if (!info) return res.redirect("/members");
  res.render("member_detail", { pageTitle: "멤버소개", member: mapMember(info), editResult });
});

// ---------- 사용자 계정 등록/수정 (외부 API 연동, 관리자 전용) ----------
const EMPTY_ADMIN_USER_FORM = { userId: "", userNm: "", userType: "USER", userPhone: "", userEmail: "", userMemo: "" };

// addUser/upUser 호출 전 세션을 얻기 위한 서비스 계정. 운영 전환 시 하드코딩 대신 환경변수로 분리 권장
const EXTERNAL_API_SERVICE_ACCOUNT = {
  userId: process.env.EXTERNAL_API_USER_ID || "admin",
  userPw: process.env.EXTERNAL_API_USER_PW || "admin",
};

// 외부 API 로그인 후 세션 쿠키(JSESSIONID)를 반환. 로그인 실패 시 sessionCookie: null
async function loginExternalApi() {
  const res = await fetch(`${EXTERNAL_API_BASE}/v1Api/loginUser`, {
    method: "POST",
    body: toFormBody(EXTERNAL_API_SERVICE_ACCOUNT),
  });
  const data = await res.json().catch(() => ({}));
  const setCookie = res.headers.get("set-cookie");
  const sessionCookie = data.success && setCookie ? setCookie.split(";")[0] : null;
  return { success: !!data.success, message: data.message || "로그인 응답을 확인할 수 없습니다.", sessionCookie };
}

// 사용자 목록 조회 (세션 불필요, 조회 확인됨)
async function fetchExternalUserList() {
  const res = await fetchWithTimeout(`${EXTERNAL_API_BASE}/v1Api/getUserList`);
  const data = await res.json().catch(() => ({}));
  return data.success && Array.isArray(data.userList) ? data.userList : [];
}

// 외부 멤버 API 응답을 기존 화면(member.nickname/job/level/role/intro/avatar)에서 쓰던 필드 형태로 변환
function mapMember(m) {
  return {
    id: m.userIdx,
    nickname: m.userNickName || "이름 미정",
    job: m.userGameRoll || "미정",
    level: m.userGameLevel || "-",
    role: m.userClanRoll || "길드원",
    intro: m.userIntro || "",
    avatar: m.userProfileImage || "https://i.pravatar.cc/300?img=12",
  };
}

// 멤버 목록을 길드장 → 부길드장 → 길드원 순으로 정렬 (그 외 값은 맨 뒤)
const MEMBER_ROLE_ORDER = { 길드장: 0, 부길드장: 1, 길드원: 2 };
function sortMembersByRole(list) {
  return [...list].sort((a, b) => {
    const orderA = MEMBER_ROLE_ORDER[a.role] ?? 99;
    const orderB = MEMBER_ROLE_ORDER[b.role] ?? 99;
    return orderA - orderB;
  });
}

// 멤버 목록 조회 (세션 불필요)
async function fetchExternalMemberList() {
  const res = await fetchWithTimeout(`${EXTERNAL_API_BASE}/v1Api/getMemberList`);
  const data = await res.json().catch(() => ({}));
  return data.success && Array.isArray(data.memberList) ? data.memberList : [];
}

// 멤버 단건 조회 (세션 불필요)
async function fetchExternalMember(userIdx) {
  const res = await fetchWithTimeout(`${EXTERNAL_API_BASE}/v1Api/getMember?userIdx=${encodeURIComponent(userIdx)}`);
  const data = await res.json().catch(() => ({}));
  return data.success ? data.memberInfo : null;
}

// ---------- 게시글(bbs) 공통 헬퍼 : 공지사항/팁&공략/스크린샷 3개 게시판이 bbsType으로 구분되어 공용 사용 ----------
const BBS_TYPE = { notice: "N", tip: "T", photo: "S" };

// bbs API에는 카테고리/조회수/댓글/좋아요 개념이 없어 bbsIdx 기준으로 로컬에만 보조 저장합니다.
// (댓글은 원래부터 세 게시판 다 로컬 mock이라 이전과 동일한 수준입니다)
const bbsExtras = {};
function getBbsExtras(bbsIdx, defaultCategory) {
  if (!bbsExtras[bbsIdx]) {
    bbsExtras[bbsIdx] = { category: defaultCategory, views: 0, comments: [], likedBy: [] };
  }
  return bbsExtras[bbsIdx];
}

function mapBbs(b, extras) {
  return {
    id: b.bbsIdx,
    title: b.bbsTitle || "",
    content: b.bbsContext || "",
    imageUrl: b.bbsImage || "",
    author: b.regNm || "익명",
    date: (b.modDt || b.regDt || "").slice(0, 10),
    pinned: b.fixYn === "Y",
    category: extras.category,
    views: extras.views,
    comments: extras.comments,
    likedBy: extras.likedBy,
  };
}

// 게시글 목록 조회 (세션 불필요). delYn === "Y"인 항목은 제외
async function fetchExternalBbsList(bbsType) {
  const res = await fetchWithTimeout(`${EXTERNAL_API_BASE}/v1Api/getBbsList?bbsType=${encodeURIComponent(bbsType)}`);
  const data = await res.json().catch(() => ({}));
  const list = data.success && Array.isArray(data.bbsList) ? data.bbsList : [];
  return list.filter((b) => b.delYn !== "Y");
}

// 고정(fixYn) 게시글을 맨 위로, 나머지는 최신순
// 참고: mapBbs()가 date를 "YYYY-MM-DD"로 자르기 때문에 같은 날 등록된 글끼리는 구분이 안 됨
// -> 시:분:초까지 있는 원본 modDt/regDt 기준으로, mapBbs() 적용 "전" 원본 목록을 정렬해야 함
function bbsSortKey(b) {
  return b.modDt || b.regDt || "";
}

// addBbs가 생성된 글의 bbsIdx를 응답에 안 주기 때문에, 등록 직후 목록을 다시 조회해서
// "방금 만든 글"을 찾아야 함. 제목/내용으로 매칭하면 예전에 같은 텍스트로 만든 글과 헷갈릴 수 있어
// bbsIdx(auto-increment)가 가장 큰, 즉 가장 최근에 생성된 항목을 그 글로 간주합니다.
function findJustCreated(list) {
  return list.reduce((latest, b) => (!latest || Number(b.bbsIdx) > Number(latest.bbsIdx) ? b : latest), null);
}

function sortBbsByPinned(rawList) {
  return [...rawList].sort((a, b) => {
    const aPinned = a.fixYn === "Y";
    const bPinned = b.fixYn === "Y";
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return bbsSortKey(b).localeCompare(bbsSortKey(a));
  });
}

// 최신순 정렬 (팁&공략/스크린샷처럼 고정 개념이 없는 게시판용)
function sortByDateDesc(rawList) {
  return [...rawList].sort((a, b) => bbsSortKey(b).localeCompare(bbsSortKey(a)));
}

// ---------- 출석체크 이력 조회 (세션 불필요) ----------
// 응답 메시지가 "이번달 출석체크 이력 조회를 성공했습니다"인 것으로 보아 매번 이번 달 데이터만 내려주는 것으로 보임
async function fetchAttendHist(params = {}) {
  const qs = new URLSearchParams();
  if (params.userId) qs.set("userId", params.userId);
  if (params.userNm) qs.set("userNm", params.userNm);
  const query = qs.toString();
  const res = await fetchWithTimeout(`${EXTERNAL_API_BASE}/v1Api/getAttendCheckHist${query ? "?" + query : ""}`);
  const data = await res.json().catch(() => ({}));
  return data.success && Array.isArray(data.AttHist) ? data.AttHist : [];
}

// 이번 달 연속 출석일수 계산 : 오늘(출석 안했으면 어제)부터 거슬러 올라가며 빈 날이 나올 때까지 카운트
function computeStreak(checkedDaySet, todayDay) {
  let streak = 0;
  let day = checkedDaySet.has(todayDay) ? todayDay : todayDay - 1;
  while (checkedDaySet.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}

// 전체 출석 이력(이번 달) -> 화면에서 쓰는 attendance 형태로 변환 (본인 도장판 + 전체 랭킹)
function buildAttendanceView(allHist, currentUser) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDay = new Date().getDate();

  const myHist = currentUser ? allHist.filter((h) => h.userId === currentUser.username) : [];
  const checkedDaySet = new Set(myHist.map((h) => Number((h.attendDt || "").slice(8, 10))));
  const checkedDays = [...checkedDaySet].sort((a, b) => a - b);
  const todayChecked = myHist.some((h) => (h.attendDt || "").slice(0, 10) === todayStr);

  // 같은 날 중복 체크인이 있을 수 있어(백엔드에 하루 1회 제한이 없는 것으로 보임) 날짜 기준으로 중복 제거 후 집계
  const datesByUser = {};
  allHist.forEach((h) => {
    const name = h.userNm || h.userId || "익명";
    const dateStr = (h.attendDt || "").slice(0, 10);
    if (!datesByUser[name]) datesByUser[name] = new Set();
    datesByUser[name].add(dateStr);
  });
  const ranking = Object.entries(datesByUser)
    .map(([nickname, dates]) => [nickname, dates.size])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nickname, count], i) => ({ rank: i + 1, nickname, count }));

  return {
    checkedDays,
    todayChecked,
    monthlyCount: checkedDays.length,
    streak: computeStreak(checkedDaySet, todayDay),
    ranking,
  };
}

app.get("/admin/users/new", requireAdmin, async (req, res) => {
  let userList = [];
  let userListError = null;
  try {
    userList = await fetchExternalUserList();
  } catch (err) {
    userListError = "사용자 목록을 불러오지 못했습니다.";
  }

  res.render("admin_user_new", {
    pageTitle: "사용자 계정 등록",
    result: null,
    form: EMPTY_ADMIN_USER_FORM,
    userList,
    userListError,
  });
});

app.post("/admin/users", requireAdmin, async (req, res) => {
  const { userType, userId, userPw, userNm, userPhone, userEmail, userMemo } = req.body;
  const form = { userId, userNm, userType, userPhone: userPhone || "", userEmail: userEmail || "", userMemo: userMemo || "" };

  const userList = await fetchExternalUserList().catch(() => []);

  try {
    const login = await loginExternalApi();
    if (!login.sessionCookie) {
      throw new Error(`세션 로그인 실패: ${login.message}`);
    }

    const apiRes = await fetch(`${EXTERNAL_API_BASE}/v1Api/addUser`, {
      method: "POST",
      headers: { Cookie: login.sessionCookie },
      body: toFormBody({ userType, userId, userPw, userNm, userPhone, userEmail, userMemo }),
    });
    const data = await apiRes.json();

    // 참고: API 명세상 ID 중복 등 실패 케이스도 success:true로 내려오는 것으로 보여
    // (실측 결과 성공 메시지 문구가 "새로운 사용자가 추가되었습니다."로 스펙 문서와 살짝 다르게 내려옴)
    // 정확한 성공 문구에 의존하는 대신, 명세에 나온 실패 문구("이미 존재하는 ID")가 있을 때만 실패로 판단합니다.
    const isDuplicateIdError = data.message && data.message.includes("이미 존재");
    const actuallySucceeded = !!data.success && !isDuplicateIdError;

    res.render("admin_user_new", {
      pageTitle: "사용자 계정 등록",
      result: { success: actuallySucceeded, message: data.message || "알 수 없는 응답입니다." },
      form: actuallySucceeded ? EMPTY_ADMIN_USER_FORM : form,
      userList: actuallySucceeded ? await fetchExternalUserList().catch(() => userList) : userList,
      userListError: null,
    });
  } catch (err) {
    res.render("admin_user_new", {
      pageTitle: "사용자 계정 등록",
      result: { success: false, message: err.message || "서버 요청에 실패했습니다. 잠시 후 다시 시도해주세요." },
      form,
      userList,
      userListError: null,
    });
  }
});

app.post("/admin/users/:userIdx/edit", requireAdmin, async (req, res) => {
  const { userType, userId, userPw, userNm, userPhone, userEmail, userMemo } = req.body;
  const payload = { userIdx: req.params.userIdx };
  // "null이 아닌 값만 수정" 명세에 맞춰, 실제로 입력된 필드만 함께 보냄
  if (userType) payload.userType = userType;
  if (userId) payload.userId = userId;
  if (userPw) payload.userPw = userPw;
  if (userNm) payload.userNm = userNm;
  if (userPhone) payload.userPhone = userPhone;
  if (userEmail) payload.userEmail = userEmail;
  if (userMemo) payload.userMemo = userMemo;

  let result;
  try {
    const login = await loginExternalApi();
    if (!login.sessionCookie) {
      throw new Error(`세션 로그인 실패: ${login.message}`);
    }

    const apiRes = await fetch(`${EXTERNAL_API_BASE}/v1Api/upUser`, {
      method: "POST",
      headers: { Cookie: login.sessionCookie },
      body: toFormBody(payload),
    });
    const data = await apiRes.json();
    result = { success: !!data.success, message: data.message || "알 수 없는 응답입니다." };
  } catch (err) {
    result = { success: false, message: err.message || "서버 요청에 실패했습니다." };
  }

  const userList = await fetchExternalUserList().catch(() => []);
  res.render("admin_user_new", {
    pageTitle: "사용자 계정 등록",
    result,
    form: EMPTY_ADMIN_USER_FORM,
    userList,
    userListError: null,
  });
});

app.listen(PORT, () => {
  console.log(`요아정 길드 웹뷰가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
