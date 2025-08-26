---
name: "\U0001F49A CI/CD"
about: 배포 작업 템플릿입니다.
title: "\U0001F49A ci/cd: "
labels: ''
assignees: ''

---

## 💚 배포 목적 (Release Purpose)
- 어떤 이유로 배포하는지 간단히 작성해주세요  
  예: v1.0.0 정식 배포  
  예: 핫픽스 적용 (게시글 작성 에러 수정)

## 📦 배포 대상 브랜치
- [ ] main  
- [ ] develop  
- [ ] 기타: _____________

## 🧱 배포 내용 (Included Changes)
- [x] ✨ 게시글 작성 API 추가 (#23)
- [x] 🐞 로그인 오류 수정 (#31)
- [ ] ♻️ 마이페이지 UI 리팩토링 (#35)

> 관련 PR 목록을 함께 나열해주세요

## 🧪 사전 체크리스트 (Pre-deploy Checklist)
- [ ] PR 모두 merge 완료
- [ ] 테스트 모두 통과 (로컬 & CI/CD)
- [ ] `.env` 등 환경 변수 점검
- [ ] S3/CloudFront 등 외부 리소스 확인

## 🚀 배포 방식
- [ ] GitHub Actions
- [ ] Vercel / Netlify / Render
- [ ] AWS CodeDeploy
- [ ] 수동 배포
- 기타: ___________

## 🔍 배포 후 확인 항목 (Post-deploy Checklist)
- [ ] 전체 서비스 정상 작동
- [ ] 크리티컬 오류 없는지 모니터링
- [ ] 주요 기능 테스트 (ex. 로그인, CRUD)

## 🗒 기타 참고사항
- DB 마이그레이션 있음 (Prisma migrate 필요)
- 프론트엔드 CDN 캐시 초기화 필요
