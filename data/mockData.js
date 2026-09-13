/**
 * ============================================================
 *  하드코딩 목업 데이터
 * ------------------------------------------------------------
 *  ⚠️ TODO(API 연동):
 *  실제 서비스에서는 이 파일의 배열/객체 대신 DB 조회 또는
 *  외부 API 호출로 대체합니다. 각 항목마다 교체할 엔드포인트를
 *  주석으로 표시해두었습니다.
 * ============================================================
 */

// TODO(API 연동): GET /api/guild-intro, PATCH /api/guild-intro 로 교체
// bannerImage: public/images 폴더에 실제 이미지를 넣고 경로만 바꿔주세요.
const guildIntro = {
  title: "",
  description: "",
  bannerImage: "/images/mainbanner.png",
};

// 멤버 목록은 목업이 아닌 실제 멤버 API(getMemberList/getMember/addMember/upMember)를 사용합니다. server.js 참고.

// 공지사항 / 팁 & 공략 / 스크린샷은 목업이 아닌 실제 게시글 API를 사용합니다.
// (getBbsList/addBbs/upBbs, bbsType: 공지사항="N", 팁&공략="T", 스크린샷="S") server.js 참고.

// TODO(API 연동): GET/POST/DELETE /api/polls, POST /api/polls/:id/vote 로 교체
const polls = [
  {
    id: 2,
    title: "9월 정기 연주회 날짜 투표",
    type: "연주회",
    description: "길드 정기 연주회 날짜를 골라주세요! 다수결로 확정됩니다.",
    author: "자몽톡톡",
    date: "2026-08-25",
    deadline: "2026-08-29",
    options: [
      { id: 1, label: "9/5(토) 오후 8시", votes: ["망고빙수", "자몽톡톡"] },
      { id: 2, label: "9/6(일) 오후 3시", votes: ["자몽톡톡"] },
      { id: 3, label: "9/12(토) 오후 8시", votes: [] },
    ],
  },
  {
    id: 1,
    title: "이번 주 어비스 진행 요일 투표",
    type: "어비스",
    description: "이번 주 어비스 같이 가실 분들, 편한 요일/시간 골라주세요.",
    author: "망고빙수",
    date: "2026-08-24",
    deadline: "2026-08-28",
    options: [
      { id: 1, label: "8/30(토) 저녁 9시", votes: ["자몽톡톡", "망고빙수", "건마"] },
      { id: 2, label: "8/31(일) 오후 3시", votes: ["사생"] },
      { id: 3, label: "8/31(일) 저녁 9시", votes: ["사생", "오뜨야"] },
    ],
  },
];

// TODO(API 연동): GET/POST /api/weekly-vote 로 교체
// weekKey: 그 주 월요일 날짜(YYYY-MM-DD). 서버에서 이번 주 월요일과 다르면 집계를 초기화합니다.
// slotsByDay[요일][시간] = 투표한 닉네임 배열. 평일(월~금)은 20/21/22시, 주말(토·일)은 12/15/20시 슬롯만 사용합니다.
const weeklyVote = {
  weekKey: "2026-08-24",
  concert: {
    slotsByDay: {
      mon: { 20: ["딸기치즈타"], 21: [], 22: [] },
      tue: { 20: [], 21: ["레몬사이다"], 22: [] },
      wed: { 20: [], 21: [], 22: [] },
      thu: { 20: [], 21: [], 22: ["솜사탕요정"] },
      fri: { 20: [], 21: [], 22: [] },
      sat: { 12: [], 15: ["건마", "사생"], 20: [] },
      sun: { 12: [], 15: [], 20: [] },
    },
  },
  abyss: {
    slotsByDay: {
      mon: { 20: ["딸기치즈타", "우사기"], 21: ["레몬사이다", "밀크라떼"], 22: ["초코라떼"] },
      tue: { 20: ["자몽쿠키"], 21: ["솜사탕요정"], 22: [] },
      wed: { 20: [], 21: [], 22: [] },
      thu: { 20: ["건마"], 21: ["사생", "우사기"], 22: ["딸기라떼"] },
      fri: { 20: ["초코라떼", "레몬사이다"], 21: ["밀크라떼", "자몽쿠키", "솜사탕요정"], 22: ["딸기치즈타"] },
      sat: { 12: ["건마"], 15: ["사생"], 20: [] },
      sun: { 12: [], 15: [], 20: [] },
    },
  },
};

// 출석체크는 목업이 아닌 실제 API(addAttendCheck/getAttendCheckHist)를 사용합니다. server.js 참고.
// 로그인은 목업이 아닌 실제 계정 API(POST /v1Api/loginUser)를 사용합니다. server.js 참고.

module.exports = { guildIntro, polls, weeklyVote };
