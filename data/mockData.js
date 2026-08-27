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
  bannerImage: "/images/mainbanner.jpg",
};

// TODO(API 연동): GET/POST/PATCH /api/members 로 교체
const members = [
  { id: 1, nickname: "초코라떼", job: "전사", level: 87, role: "길드장", joinDate: "2023-11-02", status: "온라인", avatar: "https://i.pravatar.cc/300?img=1", intro: "신입도 잡담 편하게 오세요" },
  { id: 2, nickname: "자몽쿠키", job: "궁수", level: 82, role: "부길드장", joinDate: "2023-12-15", status: "온라인", avatar: "https://i.pravatar.cc/300?img=2", intro: "출근중이오니 메시지 남겨주세요" },
  { id: 3, nickname: "솜사탕요정", job: "마법사", level: 79, role: "정예원", joinDate: "2024-01-20", status: "오프라인", avatar: "https://i.pravatar.cc/300?img=3", intro: "말레 여왕님과 함께해요" },
  { id: 4, nickname: "딸기치즈타", job: "힐러", level: 75, role: "정예원", joinDate: "2024-02-11", status: "온라인", avatar: "https://i.pravatar.cc/300?img=4", intro: "아기 힐러 잘 부탁드려요" },
  { id: 5, nickname: "딸기라떼", job: "도적", level: 70, role: "일반", joinDate: "2024-03-05", status: "오프라인", avatar: "https://i.pravatar.cc/300?img=5", intro: "일단은 만렙 갑니다" },
  { id: 6, nickname: "우사기", job: "음유시인", level: 68, role: "일반", joinDate: "2024-04-18", status: "온라인", avatar: "https://i.pravatar.cc/300?img=6", intro: "이용약관 숙지완료" },
  { id: 7, nickname: "밀크라떼", job: "전사", level: 64, role: "일반", joinDate: "2024-05-27", status: "오프라인", avatar: "https://i.pravatar.cc/300?img=7", intro: "느긋한 성장 좋아합니다" },
  { id: 8, nickname: "레몬사이다", job: "궁수", level: 60, role: "신입", joinDate: "2024-06-30", status: "오프라인", avatar: "https://i.pravatar.cc/300?img=8", intro: "신입입니다! 잘 부탁드려요" },
];

// TODO(API 연동): GET/POST/PATCH/DELETE /api/notices 로 교체
const notices = [
  { id: 3, title: "길드 정기 대비 일정 조정 고민", author: "솜사탕요정", date: "2026-08-22", pinned: true, content: "이번 주 정기 레이드 시간을 조율하고 있습니다. 참여 가능한 시간대를 댓글로 남겨주세요." },
  { id: 2, title: "길드 사이트 가입 시 캐릭터 인증 안내", author: "요아정길드장", date: "2026-08-20", pinned: true, content: "가입 인증 시 캐릭터명과 서버명을 함께 남겨주세요. 확인 후 승인해드립니다." },
  { id: 1, title: "8월 정기 길드 출석 체크 이벤트 안내", author: "초코라떼", date: "2026-08-10", pinned: false, content: "출석체크 게시판에서 이번 달 출석 이벤트에 참여해보세요!" },
];

// TODO(API 연동): GET/POST/PATCH/DELETE /api/tips 로 교체 (텍스트 게시판)
const tips = [
  { id: 3, title: "길드 정예 대비 일정 조정 고민", author: "솜사탕요정", date: "2026-08-24", category: "기타", content: "정예 대비 일정이 겹치는 분들 많으실 텐데, 다들 편한 시간대를 알려주세요." },
  { id: 2, title: "어비스 3주간 공략 순서 정리", author: "자몽쿠키", date: "2026-08-19", category: "성장 공략", content: "어비스 3주차부터는 순서를 바꿔서 도는 게 훨씬 효율적입니다. 자세한 루트 공유해요." },
  { id: 1, title: "신출내기 초보 스킬트리 추천", author: "딸기치즈타", date: "2026-08-14", category: "장비/강화", content: "처음 시작하시는 분들을 위한 추천 스킬트리 순서입니다. 무리해서 찍지 마세요!" },
];

// TODO(API 연동): GET/POST/PATCH/DELETE /api/photos (실제로는 파일 업로드) 로 교체
const photos = [
  { id: 4, title: "에어스 골든 편집", author: "레몬사이다", date: "2026-08-24", imageUrl: "https://picsum.photos/seed/yoajeong4/600/600" },
  { id: 3, title: "3인 방석 컷", author: "딸기치즈타", date: "2026-08-20", imageUrl: "https://picsum.photos/seed/yoajeong3/600/600" },
  { id: 2, title: "낚시 방송 방영", author: "자몽쿠키", date: "2026-08-16", imageUrl: "https://picsum.photos/seed/yoajeong2/600/600" },
  { id: 1, title: "정예 대비 스킨", author: "초코라떼", date: "2026-08-12", imageUrl: "https://picsum.photos/seed/yoajeong1/600/600" },
];

// TODO(API 연동): GET/POST/DELETE /api/polls, POST /api/polls/:id/vote 로 교체
const polls = [
  {
    id: 2,
    title: "9월 정기 연주회 날짜 투표",
    type: "연주회",
    description: "길드 정기 연주회 날짜를 골라주세요! 다수결로 확정됩니다.",
    author: "우사기",
    date: "2026-08-25",
    deadline: "2026-08-29",
    options: [
      { id: 1, label: "9/5(토) 오후 8시", votes: ["초코라떼", "딸기치즈타"] },
      { id: 2, label: "9/6(일) 오후 3시", votes: ["자몽쿠키"] },
      { id: 3, label: "9/12(토) 오후 8시", votes: [] },
    ],
  },
  {
    id: 1,
    title: "이번 주 어비스 진행 요일 투표",
    type: "어비스",
    description: "이번 주 어비스 같이 가실 분들, 편한 요일/시간 골라주세요.",
    author: "초코라떼",
    date: "2026-08-24",
    deadline: "2026-08-28",
    options: [
      { id: 1, label: "8/30(토) 저녁 9시", votes: ["자몽쿠키", "솜사탕요정", "딸기라떼"] },
      { id: 2, label: "8/31(일) 오후 3시", votes: ["딸기치즈타"] },
      { id: 3, label: "8/31(일) 저녁 9시", votes: ["밀크라떼", "레몬사이다"] },
    ],
  },
];

// TODO(API 연동): GET /api/attendance, POST /api/attendance 로 교체
const attendance = {
  todayChecked: false,
  monthlyCount: 14,
  streak: 5,
  ranking: [
    { rank: 1, nickname: "초코라떼", count: 24 },
    { rank: 2, nickname: "자몽쿠키", count: 22 },
    { rank: 3, nickname: "딸기치즈타", count: 20 },
    { rank: 4, nickname: "솜사탕요정", count: 18 },
    { rank: 5, nickname: "우사기", count: 16 },
  ],
};

// TODO(API 연동): POST /api/auth/login 으로 교체
const users = [
  { id: 1, username: "guildmaster", password: "1234", nickname: "초코라떼", avatar: "https://i.pravatar.cc/300?img=1", role: "마스터" },
  { id: 2, username: "vice", password: "1234", nickname: "자몽쿠키", avatar: "https://i.pravatar.cc/300?img=2", role: "부마스터" },
  { id: 3, username: "member1", password: "1234", nickname: "딸기치즈타", avatar: "https://i.pravatar.cc/300?img=4", role: "길드원" },
];

module.exports = { guildIntro, members, notices, tips, photos, polls, attendance, users };
