const express = require("express");
const session = require("express-session");
const path = require("path");

// TODO(API 연동): 지금은 로컬 목업 데이터를 사용합니다.
// 실제 서비스 전환 시 이 require 대신 API 클라이언트(axios 등)로 교체하세요.
const { guildIntro, members, notices, tips, photos, polls, attendance, users } = require("./data/mockData");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- 기본 설정 ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
  next();
});

// 쓰기 작업(등록/수정/삭제/투표/출석)에만 사용하는 로그인 가드
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// ---------- 로그인 / 로그아웃 ----------
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // TODO(API 연동): POST /api/auth/login 으로 교체
  const found = users.find((u) => u.username === username && u.password === password);

  if (!found) {
    return res.render("login", { error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  req.session.user = {
    id: found.id,
    username: found.username,
    nickname: found.nickname,
    avatar: found.avatar,
    role: found.role,
  };
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ---------- 대시보드(홈) : 비회원도 접근 가능 ----------
app.get("/", (req, res) => {
  res.render("index", {
    pageTitle: "홈",
    guildIntro,
    members,
    tips,
    photos,
    polls,
    notices,
    attendance,
  });
});

// ---------- 출석체크 : 조회는 비회원도 가능, 체크는 로그인 필요 ----------
app.get("/attendance", (req, res) => {
  res.render("attendance", { pageTitle: "출석체크", attendance });
});

app.post("/attendance/check", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/attendance 로 교체 (오늘 날짜 + req.session.user.id 전달)
  attendance.todayChecked = true;
  attendance.monthlyCount += 1;
  attendance.streak += 1;
  res.redirect("/attendance");
});

// ---------- 공지사항 ----------
app.get("/notice", (req, res) => {
  res.render("notice", { pageTitle: "공지사항", notices });
});

app.get("/notice/:id", (req, res) => {
  const notice = notices.find((n) => n.id === Number(req.params.id));
  if (!notice) return res.redirect("/notice");
  res.render("notice_detail", { pageTitle: "공지사항", notice });
});

// ---------- 팁 & 공략 : 조회는 비회원도 가능, 등록/수정/삭제는 로그인 필요 ----------
app.get("/tips", (req, res) => {
  res.render("tips", { pageTitle: "팁 & 공략", tips });
});

app.get("/tips/:id", (req, res) => {
  const tip = tips.find((t) => t.id === Number(req.params.id));
  if (!tip) return res.redirect("/tips");
  res.render("tip_detail", { pageTitle: "팁 & 공략", tip });
});

app.post("/tips", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/tips 로 교체
  const { title, category, content } = req.body;
  tips.unshift({
    id: tips.length ? Math.max(...tips.map((t) => t.id)) + 1 : 1,
    title,
    author: req.session.user.nickname,
    date: new Date().toISOString().slice(0, 10),
    category: category || "기타",
    content,
  });
  res.redirect("/tips");
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
  res.render("photo_detail", { pageTitle: "길드원 스크린샷", photo });
});

app.post("/photos", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/photos (multipart/form-data, multer 등 사용) 로 교체
  const { title, imageUrl } = req.body;
  photos.unshift({
    id: photos.length ? Math.max(...photos.map((p) => p.id)) + 1 : 1,
    title,
    author: req.session.user.nickname,
    date: new Date().toISOString().slice(0, 10),
    imageUrl: imageUrl || "https://picsum.photos/seed/default/600/600",
  });
  res.redirect("/photos");
});

app.post("/photos/:id/edit", requireLogin, (req, res) => {
  // TODO(API 연동): PATCH /api/photos/:id 로 교체
  const photo = photos.find((p) => p.id === Number(req.params.id));
  if (photo) {
    photo.title = req.body.title || photo.title;
    photo.imageUrl = req.body.imageUrl || photo.imageUrl;
  }
  res.redirect(`/photos/${req.params.id}`);
});

app.post("/photos/:id/delete", requireLogin, (req, res) => {
  // TODO(API 연동): DELETE /api/photos/:id 로 교체
  const idx = photos.findIndex((p) => p.id === Number(req.params.id));
  if (idx !== -1) photos.splice(idx, 1);
  res.redirect("/photos");
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

app.get("/members/:id", (req, res) => {
  const member = members.find((m) => m.id === Number(req.params.id));
  if (!member) return res.redirect("/members");
  res.render("member_detail", { pageTitle: "멤버소개", member });
});

app.post("/members", requireLogin, (req, res) => {
  // TODO(API 연동): POST /api/members 로 교체
  const { nickname, avatar, intro } = req.body;
  members.unshift({
    id: members.length ? Math.max(...members.map((m) => m.id)) + 1 : 1,
    nickname,
    job: "미정",
    level: 1,
    role: "신입",
    joinDate: new Date().toISOString().slice(0, 10),
    status: "오프라인",
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

app.listen(PORT, () => {
  console.log(`요아정 길드 웹뷰가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
