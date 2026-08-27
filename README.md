# 요아정 길드 웹뷰 (v2 — 피그마 디자인 반영)

마비노기 모바일 길드 **요아정**의 길드원 친목 도모 및 공지사항 관리를 위한
반응형(모바일/PC) 웹뷰 프로젝트입니다. Node.js + Express + EJS로 제작되었습니다.

## 실행 방법

```bash
npm install
npm start
```

브라우저에서 http://localhost:3000 접속

테스트 계정 (모두 비밀번호 `1234`):
| 아이디 | 닉네임 | 직급 |
|---|---|---|
| guildmaster | 초코라떼 | 마스터 |
| vice | 자몽쿠키 | 부마스터 |
| member1 | 딸기치즈타 | 길드원 |

## 화면 구성 (피그마 반영)

- **상단 GNB**: 멤버소개 / 공지사항 / 팁&공략 / 스크린샷 탭 + 가입문의 버튼 (데스크탑)
- **홈(랜딩)**: 히어로 배너, 웰컴백 카드(로그인 시 출석체크 버튼 노출), 4색 길드 메뉴 카드, 멤버 쇼케이스, 최신 팁&공지, 투표게시판 미리보기, 스크린샷
- **사이드바(PC) / 하단탭바(모바일)**: 홈·출석체크·공지사항·팁&공략·스크린샷·투표·길드원 7개 메뉴 공통 사용
- **브라운 푸터**: 전 페이지 공통

## 기능 목록

| 기능 | 경로 | 비회원 | 회원 |
|---|---|---|---|
| 로그인/로그아웃 | `/login` | 로그인만 | - |
| 홈 대시보드 | `/` | 조회 | 조회 + 출석체크 |
| 출석체크 | `/attendance` | 조회 | 조회 + 체크 |
| 공지사항 | `/notice`, `/notice/:id` | 조회 | 조회 |
| 팁 & 공략 | `/tips`, `/tips/:id` | 조회 | 조회 + 등록/수정/삭제 |
| 스크린샷 | `/photos`, `/photos/:id` | 조회 | 조회 + 등록/수정/삭제 |
| 투표게시판 | `/polls`, `/polls/:id` | 조회 | 조회 + 등록/투표/삭제(작성자만) |
| 길드원 리스트 | `/members`, `/members/:id` | 조회 | 조회 + 등록/수정 |

## 현재 구현 상태 (하드코딩)

`data/mockData.js` 안의 배열/객체를 목업 DB처럼 사용 중입니다.
실제 서비스 연결 시 손대야 할 자리는 코드 안에 `// TODO(API 연동): ...` 주석으로 모두 표시해두었습니다.

주요 교체 지점:
- `data/mockData.js` — guildIntro, members, notices, tips, photos, polls, attendance, users
- `server.js` — 각 GET/POST 라우트 (로그인, CRUD, 투표, 출석)

## 이미지 관련 안내

- 히어로 배너: `data/mockData.js`의 `guildIntro.bannerImage` 경로(`/images/mainbanner.jpg`)에 실제 파일을 `public/images/mainbanner.jpg`로 넣어주세요. 파일이 없으면 "길드 사진을 업로드해주세요" placeholder가 대신 표시됩니다.
- 멤버 아바타 / 스크린샷: 현재는 데모용 외부 이미지 서비스(pravatar, picsum)를 사용 중입니다. 실제 서비스 시 각 항목의 "수정" 기능으로 이미지 URL을 교체하거나, 실제 파일 업로드(multer 등) 방식으로 바꾸면 됩니다.

## 배포 (Render 기준)

1. GitHub 저장소에 push
2. Render → New Web Service → 저장소 연결
3. Build Command: `npm install`
4. Start Command: `npm start`
5. (선택) Environment 탭에 `SESSION_SECRET` 값 등록

## 폴더 구조

```
yoajeong-guild/
├── server.js
├── data/
│   └── mockData.js
├── views/
│   ├── partials/           # header(GNB) / nav(사이드바+하단탭바) / footer / tip_thumb / photo_thumb
│   ├── login.ejs
│   ├── index.ejs           # 홈 랜딩 (피그마 반영)
│   ├── attendance.ejs
│   ├── notice.ejs / notice_detail.ejs
│   ├── tips.ejs / tip_detail.ejs
│   ├── photos.ejs / photo_detail.ejs
│   ├── polls.ejs / poll_detail.ejs
│   └── members.ejs / member_detail.ejs
└── public/
    ├── css/style.css        # 피그마 컬러 테마, 반응형
    ├── js/main.js
    └── images/              # 배너/업로드 이미지 위치 (직접 추가 필요)
```
