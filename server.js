const express = require("express");
const session = require("express-session");
const path = require("path");

// TODO(API 연동): 지금은 로컬 목업 데이터를 사용합니다.
// 실제 서비스 전환 시 이 require 대신 API 클라이언트(axios 등)로 교체하세요.
const { guildIntro, members, notices, tips, photos, polls, weeklyVote, attendance } = require("./data/mockData");
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

// 출석 도장판을 월마다 초기화 + 출석 모달에 필요한 날짜 정보 계산
function syncAttendanceMonth() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

  if (attendance.checkedMonth !== monthKey) {
    attendance.checkedMonth = monthKey;
    attendance.checkedDays = [];
    attendance.todayChecked = false;
    attendance.monthlyCount = 0;
    attendance.streak = 0;
  }

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

    console.log(data);
    if (!data.success || !data.userInfo) {
      // 참고: 외부 API가 미존재 계정 등에서 500(내부 에러 메시지)을 그대로 내려주는 경우가 있어
      // 사용자에게는 항상 일반적인 안내 문구만 노출합니다.
      return res.render("login", { error: "아이디 또는 비밀번호를 다시 확인해주세요." });
    }

    const info = data.userInfo;
    req.session.user = {
      id: info.userIdx,
      username: info.userId,
      nickname: info.userNm,
      avatar: `/images/members/member_${(Number(info.userIdx) % 70) }.png`,
      role: info.userType,
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
app.get("/", (req, res) => {
  syncWeeklyVote();
  const nickname = req.session.user && req.session.user.nickname;

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
app.get("/attendance", (req, res) => {
  res.render("attendance", { pageTitle: "출석체크", attendance, ...syncAttendanceMonth() });
});

app.post("/attendance/check", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/attendance 로 교체 (오늘 날짜 + req.session.user.id 전달)
  const { attTodayDay } = syncAttendanceMonth();

  if (!attendance.todayChecked) {
    if (!attendance.checkedDays.includes(attTodayDay)) {
      attendance.checkedDays.push(attTodayDay);
    }
    attendance.todayChecked = true;
    attendance.monthlyCount = attendance.checkedDays.length;
    attendance.streak += 1;
  }

  res.redirect(req.get("Referer") || "/attendance");
});

// ---------- 공지사항 ----------
app.get("/notice", (req, res) => {
  res.render("notice", { pageTitle: "공지사항", notices });
});

app.get("/notice/:id", (req, res) => {
  const notice = notices.find((n) => n.id === Number(req.params.id));
  if (!notice) return res.redirect("/notice");
  notice.views = (notice.views || 0) + 1;
  res.render("notice_detail", { pageTitle: "공지사항", notice });
});

// TODO(API 연동): POST /api/notices 로 교체 - 등록은 관리자(ADMIN)만 가능
app.post("/notice", requireAdmin, (req, res) => {
  const { title, category, content } = req.body;
  notices.unshift({
    id: notices.length ? Math.max(...notices.map((n) => n.id)) + 1 : 1,
    title,
    author: req.session.user.nickname,
    date: new Date().toISOString().slice(0, 10),
    pinned: false,
    category: category || "공지",
    content,
    views: 0,
    comments: [],
  });
  res.redirect("/notice");
});

app.post("/notice/:id/edit", requireLogin, (req, res) => {
  // TODO(API 연동): PATCH /api/notices/:id 로 교체
  const notice = notices.find((n) => n.id === Number(req.params.id));
  if (notice) {
    notice.title = req.body.title || notice.title;
    notice.category = req.body.category || notice.category;
    notice.content = req.body.content || notice.content;
  }
  res.redirect(`/notice/${req.params.id}`);
});

app.post("/notice/:id/delete", requireLogin, (req, res) => {
  // TODO(API 연동): DELETE /api/notices/:id 로 교체
  const idx = notices.findIndex((n) => n.id === Number(req.params.id));
  if (idx !== -1) notices.splice(idx, 1);
  res.redirect("/notice");
});

app.post("/notice/:id/comments", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/notices/:id/comments 로 교체
  const notice = notices.find((n) => n.id === Number(req.params.id));
  if (notice && req.body.content && req.body.content.trim()) {
    notice.comments.push({
      id: notice.comments.length ? Math.max(...notice.comments.map((c) => c.id)) + 1 : 1,
      author: req.session.user.nickname,
      date: new Date().toISOString().slice(0, 10),
      content: req.body.content.trim(),
    });
  }
  res.redirect(`/notice/${req.params.id}`);
});

// ---------- 팁 & 공략 : 조회는 비회원도 가능, 등록/수정/삭제는 로그인 필요 ----------
app.get("/tips", (req, res) => {
  res.render("tips", { pageTitle: "팁 & 공략", tips });
});

app.get("/tips/:id", (req, res) => {
  const tip = tips.find((t) => t.id === Number(req.params.id));
  if (!tip) return res.redirect("/tips");
  tip.views = (tip.views || 0) + 1;
  res.render("tip_detail", { pageTitle: "팁 & 공략", tip });
});

// TODO(API 연동): POST /api/tips 로 교체 - 글쓰기는 관리자(ADMIN)만 가능
app.post("/tips", requireAdmin, (req, res) => {
  const { title, category, content } = req.body;
  tips.unshift({
    id: tips.length ? Math.max(...tips.map((t) => t.id)) + 1 : 1,
    title,
    author: req.session.user.nickname,
    date: new Date().toISOString().slice(0, 10),
    category: category || "생활팁",
    content,
    views: 0,
    comments: [],
  });
  res.redirect("/tips");
});

app.post("/tips/:id/comments", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/tips/:id/comments 로 교체
  const tip = tips.find((t) => t.id === Number(req.params.id));
  if (tip && req.body.content && req.body.content.trim()) {
    tip.comments.push({
      id: tip.comments.length ? Math.max(...tip.comments.map((c) => c.id)) + 1 : 1,
      author: req.session.user.nickname,
      date: new Date().toISOString().slice(0, 10),
      content: req.body.content.trim(),
    });
  }
  res.redirect(`/tips/${req.params.id}`);
});

app.post("/tips/:id/edit", requireLogin, (req, res) => {
  // TODO(API 연동): PATCH /api/tips/:id 로 교체
  const tip = tips.find((t) => t.id === Number(req.params.id));
  if (tip) {
    tip.title = req.body.title || tip.title;
    tip.category = req.body.category || tip.category;
    tip.content = req.body.content || tip.content;
  }
  res.redirect(`/tips/${req.params.id}`);
});

app.post("/tips/:id/delete", requireLogin, (req, res) => {
  // TODO(API 연동): DELETE /api/tips/:id 로 교체
  const idx = tips.findIndex((t) => t.id === Number(req.params.id));
  if (idx !== -1) tips.splice(idx, 1);
  res.redirect("/tips");
});

// ---------- 스크린샷(사진) : 조회는 비회원도 가능, 등록/수정/삭제는 로그인 필요 ----------
app.get("/photos", (req, res) => {
  res.render("photos", { pageTitle: "길드원 스크린샷", photos });
});

app.get("/photos/:id", (req, res) => {
  const photo = photos.find((p) => p.id === Number(req.params.id));
  if (!photo) return res.redirect("/photos");
  photo.views = (photo.views || 0) + 1;
  const liked = !!(req.session.user && photo.likedBy.includes(req.session.user.nickname));
  res.render("photo_detail", { pageTitle: "길드원 스크린샷", photo, liked });
});

app.post("/photos", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/photos (multipart/form-data, multer 등 사용) 로 교체
  const { title, category, description, imageUrl } = req.body;
  photos.unshift({
    id: photos.length ? Math.max(...photos.map((p) => p.id)) + 1 : 1,
    title,
    author: req.session.user.nickname,
    date: new Date().toISOString().slice(0, 10),
    category: category || "생활",
    content: description || "",
    imageUrl: imageUrl || "https://picsum.photos/seed/default/600/600",
    views: 0,
    likedBy: [],
    comments: [],
  });
  res.redirect("/photos");
});

app.post("/photos/:id/edit", requireLogin, (req, res) => {
  // TODO(API 연동): PATCH /api/photos/:id 로 교체 (이미지는 수정 대상에서 제외, 제목/항목/내용만 반영)
  const photo = photos.find((p) => p.id === Number(req.params.id));
  if (photo) {
    photo.title = req.body.title || photo.title;
    photo.category = req.body.category || photo.category;
    photo.content = req.body.content || "";
  }
  res.redirect(`/photos/${req.params.id}`);
});

app.post("/photos/:id/delete", requireLogin, (req, res) => {
  // TODO(API 연동): DELETE /api/photos/:id 로 교체
  const idx = photos.findIndex((p) => p.id === Number(req.params.id));
  if (idx !== -1) photos.splice(idx, 1);
  res.redirect("/photos");
});

app.post("/photos/:id/like", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/photos/:id/like 로 교체
  const photo = photos.find((p) => p.id === Number(req.params.id));
  if (photo) {
    const nickname = req.session.user.nickname;
    const idx = photo.likedBy.indexOf(nickname);
    if (idx === -1) {
      photo.likedBy.push(nickname);
    } else {
      photo.likedBy.splice(idx, 1);
    }
  }
  res.redirect(`/photos/${req.params.id}`);
});

app.post("/photos/:id/comments", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/photos/:id/comments 로 교체
  const photo = photos.find((p) => p.id === Number(req.params.id));
  if (photo && req.body.content && req.body.content.trim()) {
    photo.comments.push({
      id: photo.comments.length ? Math.max(...photo.comments.map((c) => c.id)) + 1 : 1,
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

// ---------- 길드원 리스트 : 조회는 비회원도 가능, 등록/수정은 로그인 필요 ----------
app.get("/members", (req, res) => {
  res.render("members", { pageTitle: "멤버소개", members });
});

// 주의: '/members/:id'보다 먼저 등록해야 'new'가 id로 잘못 해석되지 않음
app.get("/members/new", requireLogin, (req, res) => {
  res.render("member_new", { pageTitle: "멤버 등록" });
});

app.get("/members/:id", (req, res) => {
  const member = members.find((m) => m.id === Number(req.params.id));
  if (!member) return res.redirect("/members");
  res.render("member_detail", { pageTitle: "멤버소개", member });
});

app.post("/members", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/members 로 교체
  const { nickname, avatar, role, job, intro } = req.body;
  members.unshift({
    id: members.length ? Math.max(...members.map((m) => m.id)) + 1 : 1,
    nickname,
    job: job || "미정",
    level: 1,
    role: role || "길드원",
    joinDate: new Date().toISOString().slice(0, 10),
    status: "온라인",
    avatar: avatar || "https://i.pravatar.cc/300?img=12",
    intro,
  });
  res.redirect("/members");
});

app.post("/members/:id/edit", requireLogin, (req, res) => {
  // TODO(API 연동): PATCH /api/members/:id 로 교체
  const member = members.find((m) => m.id === Number(req.params.id));
  if (member) {
    member.nickname = req.body.nickname || member.nickname;
    member.avatar = req.body.avatar || member.avatar;
    member.intro = req.body.intro || member.intro;
  }
  res.redirect(`/members/${req.params.id}`);
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
  const res = await fetch(`${EXTERNAL_API_BASE}/v1Api/getUserList`);
  const data = await res.json().catch(() => ({}));
  return data.success && Array.isArray(data.userList) ? data.userList : [];
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
    // message 문구로 실제 성공 여부를 다시 판단합니다. API가 수정되면 data.success만 봐도 됩니다.
    const actuallySucceeded = !!data.success && data.message && data.message.includes("추가했습니다");

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

// TODO(화면 미구현): 아직 수정 페이지 UI는 없음 - 우선 API 연동만 추가. JSON으로 응답.
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
