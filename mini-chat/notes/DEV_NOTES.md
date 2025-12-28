# Todo

- 모델 선택 UI 추가 (여러 모델 중 골라서 대화)
- 캐릭터별 기본 설정 (모델 / temperature / 말투 프리셋)
- 대화 내보내기 / 불러오기 (JSON export/import)
- 모바일 UI 튜닝 (키보드 열릴 때 input 가려지는 문제)
- 토큰/비용 대략 표시 (요청당 토큰 수, 대략 비용)
- 오류/예외 메시지 더 친절하게 만들기 (네트워크 장애, 429 등)

---

# Done

- 프로젝트 기본 구조 세팅
- 메시지 상태(state.js) 설계
- 메시지 localStorage 저장 구현
- UI 렌더링 코드 분리(ui.js)
- 이벤트와 흐름 분리(chatFlow.js, events.js)
- 타이핑 효과 구현 (한 글자씩 출력)
- 샘플 메시지 로딩 기능 추가
- clear 입력시 대화 초기화
- 봇 응답 대기 중 입력/버튼 잠금(중복 전송 방지)
- 생각중 오버레이(로딩 상태 UI)
- 캐릭터 시스템 도입 (characters.js)
- 캐릭터별 대화 기록 분리 (캐릭터마다 독립 히스토리)
- 캐릭터 생성 / 수정 / 삭제 UI
- 캐릭터 설정 폼 (이름 / 한 줄 소개 / 태그 / 말투 / 성격 / 스타일 / 추가 프롬프트)
- system prompt 자동 생성 로직 (공통 규칙 + 캐릭터 설정)
- OpenRouter 프록시 서버(server.mjs) 구현
- 진짜 AI API(OpenRouter) 연결 (chat completions)
- temperature / top_p / max_tokens 기본값 설정 및 전달
- 최근 N개 메시지만 히스토리에 포함 (간단 토큰 관리)

---

# FEATURES (현재 기능)

- 기본 채팅 UI
- 메시지 저장 및 복원(localStorage)
- 캐릭터 선택 사이드바
- 캐릭터별 독립 대화방
- 캐릭터 생성 / 수정 / 삭제
- 캐릭터 설정:
  - 말투(존댓말 / 반말)
  - 성격 / 대화 스타일
  - 추가 system 프롬프트
  - 태그
- 캐릭터 설정을 기반으로 한 system prompt 자동 생성
- OpenRouter를 통한 실제 LLM 응답
- 봇 타이핑 효과 (한 글자씩 출력)
- 생각중 오버레이(로딩 상태 표시)
- Enter = 전송 / Shift+Enter = 줄바꿈
- "clear" 입력 시 대화 초기화
- 봇 응답 대기 중 입력/버튼 잠금(중복 전송 방지)

---

# NEXT FEATURES (로드맵)

- **모델 관련**
  - 모델 선택 드롭다운 (예: llama 8B / 70B / claude 등)
  - 캐릭터별 기본 모델/temperature 설정

- **캐릭터/대화 UX**
  - 캐릭터별 “샘플 프롬프트 / 추천 질문” 표시
  - 캐릭터별 대화 초기 멘트(자동 첫 인사)

- **데이터 관리**
  - 대화 export / import (JSON)
  - 캐릭터 설정 export / import

- **UI/UX**
  - 모바일에서 입력창 고정 / 키보드 튀는 현상 개선
  - 다크 모드 / 테마 선택
  - 간단한 사용량/토큰 카운터 UI

- **고급 기능 (나중에 하고 싶으면)**
  - 스트리밍 응답 (글자 하나씩이 아니라 토큰 단위 스트림)
  - 여러 채팅방(프로젝트별/캐릭터별 탭)
  - 간단한 “캐릭터 마켓” 느낌의 목록/검색 UI


# Question / 모르는 것

# 폴더 구조

mini-chat
│
├── index.html            앱의 메인 HTML (레이아웃 + 스크립트 로드)
├── style.css             채팅 UI 스타일 정의
├── server.mjs            개발용 로컬 서버 (정적 파일 + API 자리)
├── package.json          프로젝트 설정 / 의존성 목록
├── package-lock.json     의존성 버전 고정 파일
│
├── js/
│   ├── api.js            가짜 AI / 샘플 데이터 등 외부 연동 로직
│   ├── characters.js     캐릭터 / 프롬프트 설정 데이터
│   ├── chatFlow.js       채팅 흐름 핵심 로직 (타이핑, 응답 처리 등)
│   ├── events.js         버튼/키보드 이벤트 → chatFlow 호출
│   ├── main.js           앱 초기화 진입점 (시작 세팅)
│   ├── script_backup.js  리팩토링 전 코드 백업 (참고용)
│   ├── state.js          메시지 상태 + localStorage 관리
│   └── ui.js             화면 렌더링 / 생각중 오버레이 처리
│
├── node_modules/         설치된 라이브러리들
│
└── notes/
    └── DEV_NOTES.md      개발 메모 / TODO / 기록



## 설치, 시행방법


cd "C:\Users\pione\OneDrive\바탕 화면\mini-chat"

node server.mjs


잘 되면 이렇게 뜸 + 이 창은 열어둬야 함

✅ 서버 실행: http://localhost:3000


그 뒤 브라우저 주소창에

http://localhost:3000

## node_modules

npm install
