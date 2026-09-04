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

// TODO(API 연동): GET/POST/PATCH /api/members 로 교체
const members = [
  { id: 1, nickname: "자몽톡톡", job: "대검전사", level: 100, role: "길드장", joinDate: "2023-11-02", status: "온라인", avatar: "/images/members/member_1.png", intro: "안녕하세요 톡톡입니다!" },
  { id: 2, nickname: "망고빙수", job: "화염술사", level: 100, role: "부길드장", joinDate: "2023-12-15", status: "온라인", avatar: "/images/members/member_2.png", intro: "빙수에요" },
  { id: 3, nickname: "오뜨야", job: "화염술사", level: 100, role: "부길드장", joinDate: "2024-01-20", status: "오프라인", avatar: "/images/members/member_3.png", intro: "오뜨야,오뜨르,오뜨모르" },
  { id: 4, nickname: "사생", job: "수도사", level: 100, role: "길드원", joinDate: "2024-02-11", status: "온라인", avatar: "/images/members/member_4.png", intro: "잘 부탁드립니다. 사생입니다." },
  { id: 5, nickname: "건마", job: "석궁사수", level: 100, role: "길드원", joinDate: "2024-03-05", status: "오프라인", avatar: "/images/members/member_5.png", intro: "건마" },

];

// TODO(API 연동): GET/POST/PATCH/DELETE /api/notices 로 교체
// category: "공지" | "알림" | "이벤트" | "추첨결과"
const notices = [
  {
    id: 4,
    title: "길드 규칙 및 매너 안내 (필독)",
    author: "초코라떼",
    date: "2026-08-01",
    pinned: true,
    category: "공지",
    content:
      "길드원 여러분 안녕하세요! 즐거운 길드 생활을 위해 아래 규칙을 꼭 지켜주세요.\n\n1. 서로 존중하는 말투 사용하기\n2. 파티 구인 시 시간·인원 명확히 안내하기\n3. 장기 미접속 시 사전에 알려주기\n\n규칙을 지켜주시는 모든 길드원분들께 감사드리며, 궁금한 점은 댓글로 남겨주세요!",
    views: 482,
    comments: [
      { id: 1, author: "초코라떼", date: "2026-08-25", content: "항상 규칙 지키려고 노력하고 있어요, 좋은 안내 감사합니다!" },
      { id: 2, author: "사생", date: "2026-08-25", content: "장기 미접속 기준이 며칠인지 궁금해요!" },
      { id: 3, author: "자몽톡톡", date: "2026-08-26", content: "@사생 2주 이상 미접속이면 미리 말씀해주시면 돼요~" },
    ],
  },
  {
    id: 3,
    title: "길드 정기 대비 일정 조정 고민",
    author: "솜사탕요정",
    date: "2026-08-22",
    pinned: true,
    category: "알림",
    content: "이번 주 정기 레이드 시간을 조율하고 있습니다. 참여 가능한 시간대를 댓글로 남겨주세요.",
    views: 210,
    comments: [
      { id: 1, author: "자몽톡톡", date: "2026-08-22", content: "저는 주말 저녁이 편해요!" },
    ],
  },
  {
    id: 2,
    title: "길드 사이트 가입 시 캐릭터 인증 안내",
    author: "요아정길드장",
    date: "2026-08-20",
    pinned: false,
    category: "공지",
    content: "가입 인증 시 캐릭터명과 서버명을 함께 남겨주세요. 확인 후 승인해드립니다.",
    views: 156,
    comments: [],
  },
  {
    id: 1,
    title: "8월 정기 길드 출석 체크 이벤트 안내",
    author: "초코라떼",
    date: "2026-08-10",
    pinned: false,
    category: "이벤트",
    content: "출석체크 게시판에서 이번 달 출석 이벤트에 참여해보세요!",
    views: 128,
    comments: [],
  },
];

// TODO(API 연동): GET/POST/PATCH/DELETE /api/tips 로 교체 (텍스트 게시판)
const tips = [
  {
    id: 3,
    title: "길드 정예 대비 일정 조정 고민",
    author: "솜사탕요정",
    date: "2026-08-24",
    category: "레이드",
    content: "정예 대비 일정이 겹치는 분들 많으실 텐데, 다들 편한 시간대를 알려주세요.",
    views: 84,
    comments: [],
  },
  {
    id: 2,
    title: "어비스 3주간 공략 순서 정리",
    author: "자몽쿠키",
    date: "2026-08-19",
    category: "어비스",
    content: "어비스 3주차부터는 순서를 바꿔서 도는 게 훨씬 효율적입니다. 자세한 루트 공유해요.",
    views: 156,
    comments: [
      { id: 1, author: "자몽톡톡", date: "2026-08-19", content: "오 이 순서 좋네요, 저도 따라해볼게요!" },
    ],
  },
  {
    id: 1,
    title: "신출내기 초보 스킬트리 추천",
    author: "딸기치즈타",
    date: "2026-08-14",
    category: "직업공략",
    content:
      "초반 검술사는 스킬 포인트가 한정적이라 우선순위가 중요해요. 더블 슬래시 → 스매시 → 윈드밀 순으로 찍는 걸 추천드립니다.\n\n1. 더블 슬래시: 기본 딜링기, 최우선으로 마스터\n2. 스매시: 낙백 + 큰 데미지, 윌드보스전에 유용\n3. 윈드밀: 광역기, 파티 사냥 시 효율 좋음\n\n이후 레벨업하면서 백스텝, 리버스 슬래시 순으로 채워나가면 초반 PvE/PvP 둘 다 무난하게 대응할 수 있어요. 질문 있으면 댓글로 남겨주세요!",
    views: 213,
    comments: [
      { id: 1, author: "초코라떼", date: "2026-08-25", content: "저도 이 순서로 갔는데 확실히 초반 사냥 편해요!" },
      { id: 2, author: "망고빙수", date: "2026-08-25", content: "윈드밀 몇 레벨에 찍으면 되나요?" },
      { id: 3, author: "자몽톡톡", date: "2026-08-26", content: "@망고빙수 15레벨부터 찍으시면 돼요~" },
    ],
  },
];

// TODO(API 연동): GET/POST/PATCH/DELETE /api/photos (실제로는 파일 업로드) 로 교체
// category: "어비스/레이드" | "연주회" | "생활" | "협동" | "사이드" | "수다"
const photos = [
  {
    id: 5,
    title: "필드보스 처치 완료!",
    author: "초코라떼",
    date: "2026-08-25",
    category: "어비스/레이드",
    imageUrl: "https://picsum.photos/seed/yoajeongboss/900/675",
    views: 1699,
    likedBy: ["솜사탕요정", "사생", "건마", "레몬사이다", "딸기치즈타", "자몽쿠키", "길드원A", "길드원B", "길드원C", "길드원D", "길드원E", "길드원F"],
    comments: [
      { id: 1, author: "자몽톡톡", date: "2026-08-25", content: "드디어 잡았네요 고생하셨어요!" },
      { id: 2, author: "솜사탕요정", date: "2026-08-25", content: "저도 다음엔 같이 가요 ㅠㅠ" },
    ],
  },
  {
    id: 4,
    title: "에어스 골든 편집",
    author: "레몬사이다",
    date: "2026-08-24",
    category: "사이드",
    imageUrl: "https://picsum.photos/seed/yoajeong4/600/600",
    views: 340,
    likedBy: [],
    comments: [],
  },
  {
    id: 3,
    title: "3인 방석 컷",
    author: "딸기치즈타",
    date: "2026-08-20",
    category: "협동",
    imageUrl: "https://picsum.photos/seed/yoajeong3/600/600",
    views: 212,
    likedBy: [],
    comments: [],
  },
  {
    id: 2,
    title: "낚시 방송 방영",
    author: "자몽쿠키",
    date: "2026-08-16",
    category: "생활",
    imageUrl: "https://picsum.photos/seed/yoajeong2/600/600",
    views: 158,
    likedBy: [],
    comments: [],
  },
  {
    id: 1,
    title: "정예 대비 스킨",
    author: "초코라떼",
    date: "2026-08-12",
    category: "어비스/레이드",
    imageUrl: "https://picsum.photos/seed/yoajeong1/600/600",
    views: 189,
    likedBy: [],
    comments: [],
  },
];

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

// TODO(API 연동): GET /api/attendance, POST /api/attendance 로 교체
// checkedMonth: "YYYY-M" 형식. 서버에서 현재 월과 다르면 도장판을 초기화합니다.
const attendance = {
  checkedMonth: "2026-8",
  checkedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  todayChecked: false,
  monthlyCount: 14,
  streak: 5,
  ranking: [
    { rank: 1, nickname: "자몽톡톡", count: 24 },
    { rank: 2, nickname: "망고빙수", count: 22 },
    { rank: 3, nickname: "사생", count: 20 },
    { rank: 4, nickname: "건마", count: 18 },
    { rank: 5, nickname: "오뜨야", count: 16 },
  ],
};

// TODO(API 연동): POST /api/auth/login 으로 교체
const users = [
  { id: 1, username: "admin", password: "1234", nickname: "자몽톡톡", avatar: "/images/members/member_1.png", role: "마스터" },
  { id: 2, username: "admin1", password: "1234", nickname: "망고빙수", avatar: "/images/members/member_2.png", role: "부마스터" },
  { id: 3, username: "admin2", password: "1234", nickname: "오뜨야", avatar: "/images/members/member_3.png", role: "부마스터" },
];

module.exports = { guildIntro, members, notices, tips, photos, polls, weeklyVote, attendance, users };
