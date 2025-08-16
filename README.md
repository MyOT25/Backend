
# 1. Project Overview (프로젝트 개요)
- 프로젝트 이름: MyOT
- 프로젝트 설명: “뮤지컬 관극의 모든 순간을 기록하고 나누는 공간 ”

<br/>
<br/>

# 2. Team Members (Node.js 팀원 및 팀 소개)
| 전하경(재서) | 김하원(하엉) | 박호연(소시지) | 우강식(스티브) | 조예성(조이) |
|:------:|:------:|:------:|:------:|:------:|



<br/>
<br/>

# 3. Key Features (주요 기능)
- **커뮤니티**: 
  - 본인이 좋아하는 극이나 배우 커뮤니티들이 존재하며 이를 선택하여 해당 커뮤니티에 입장 가능

- **관극 기록**:
  - 오늘의 관극, 이번 달 관극, 관극 정산판 총 3가지로 구성이 되어 있으며 본인의 관극을 간편하고 체적으로 기록
   -  **관극 정산판이란 특정 작품 기간이 끝나면 해당 작품을 어느 배우로 몇번을 봤는지 좌석은 어디서 봤는지 확인 할 수 있는 판

- **질문 게시**:
  - 덕질을 하면서 궁금한 것들 익명으로 질문 가능

<br/>
<br/>


# 4. Technology Stack (기술 스택)
## 4.1 Language
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=JavaScript&logoColor=white">

<br/>

## 4.2 Backend

<img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white">    

   

<br/>

## 4.3 Cooperation
 <img src="https://img.shields.io/badge/GIT-E44C30?style=for-the-badge&logo=git&logoColor=white">    
<img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white">
<br/>

## 4.2 ORM
<img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white"> 
<br/>

## 4.5 OTHER
<img src="https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white">

# 5. Project Structure (프로젝트 구조)
```plaintext
src/
├── controllers/    # 요청 처리 및 응답 (Router)
├── dtos/           # 데이터 전송 객체 (DTO) 정의
├── services/       # 핵심 비즈니스 로직
├── repositories/   # 데이터베이스 쿼리 로직
├── middlewares/    # 인증, 에러 핸들링 등 미들웨어
├── config/         # DB 연결, Swagger 등 설정
└── index.js        # 서버 진입점
```

<br/>
<br/>

# 6. Development Workflow (개발 워크플로우)
## 브랜치 전략 (Branch Strategy)
Issue 생성: 개발할 기능 또는 수정할 버그에 대해 상세한 내용을 담아 GitHub Issue를 생성합니다.

브랜치 생성: 생성된 Issue 번호를 기반으로 브랜치를 생성합니다.

브랜치 네이밍 규칙: [작업유형]/#[이슈번호]

예시: 기능 개발 이슈 #3 → feat/#3

개발 및 푸시: 해당 브랜치에서 기능 개발을 완료한 후 원격 저장소에 푸시합니다.

Pull Request (PR) 생성: 개발이 완료되면 main 브랜치로 병합을 요청하는 PR을 생성합니다.

코드 리뷰: 팀원들이 PR에 대해 코드 리뷰를 진행합니다.

Merge: 리뷰가 완료되고 모든 CI 테스트를 통과하면 main 브랜치에 머지합니다.

정리: 머지된 브랜치를 삭제하고, 연결된 Issue를 닫습니다.

<br/>
<br/>

# 7. Coding Convention

| 요소 | 규칙 | 예시 |
| --- | --- | --- |
| 변수명 | `camelCase` | `userId`, `isLoggedIn` |
| 함수명 | `camelCase` | `getUserById()`, `createPost()` |
| 클래스명 | `PascalCase` | `UserService`, `DbConnector` |
| 파일명 | `kebab-case` | `user.controller.js`, `db.js` |
| 디렉토리명 | `kebab-case` | `services/`, `models/`, `routes/` |
| DB 테이블명 | `snake_case` (복수형) | `users`, `order_items` |
| DB 컬럼명 | `snake_case` | `user_id`, `created_at` |
| Boolean 변수명 | 접두사 is_ 사용 | `is_active`, `is_good` |


<br/>
<br/>


# 8. Commit Convention

```
feat : 새로운 기능 추가
fix : 버그 수정
docs : 문서 수정
style : 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
refactor : 코드 리펙토링
test : 테스트 코드, 리펙토링 테스트 코드 추가
chore : 빌드 업무 수정, 패키지 매니저 수정
```

<br/>

## 커밋 이모지
```
== 코드 관련
✨	새로운 기능 구현
♻️ 코드 리팩토링
🛠️		
빌드, 패키지 매니저 등 기타 수정
💄		
코드 포맷팅, 스타일 수정tyle 변경
📚	문서 작성
🐛	버그 수정
💚 CI/CD 관련 설정 변경

```

<br/>

## 커밋 예시
```
== ex1
✨ feat: 회원가입 기능 개발

- 이메일, 비밀번호 유효성 검사 로직 추가
- 중복 확인 API 연동
== ex2
🐛 fix: 로그인 시 간헐적 서버 다운 버그 수정

- 비동기 처리 로직에서 발생하던 메모리 누수 문제 해결


<br/>
<br/>


# 9. 서비스 아키텍쳐
<img width="1746" height="988" alt="image" src="https://github.com/user-attachments/assets/34b956c5-3734-46bc-a3b4-24e920b08582" />



