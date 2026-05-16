# 🛡️ SafeWatch

> 공공기관 실무자를 위한 불법·허위 정보 모니터링 시스템

[![Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ecf8e)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React-61dafb)](https://react.dev)

---

## 💡 기획 의도

온라인 플랫폼의 확산으로 불법·허위 정보가 빠르게 유포되고 있음에도 불구하고,
공공기관 실무자들은 이를 체계적으로 탐지하고 관리할 수 있는 전용 도구가 없는 상황입니다.

**SafeWatch**는 이 문제를 해결하기 위해 설계된 관리자용 모니터링 웹 애플리케이션입니다.

> "완벽한 크롤러보다, 실무자가 실제로 쓸 수 있는 시스템이 더 중요하다"는 관점에서
> 키워드 등록 → 탐지 실행 → 결과 처리라는 **전체 업무 흐름을 하나의 시스템으로 통합**하는 데 집중했습니다.

---

## 📌 프로젝트 소개

**SafeWatch**는 키워드 기반 탐지 시뮬레이션, 탐지 결과 관리, 실무자 계정 관리 기능을 제공하며,
추후 실제 크롤링 엔진 및 AI 위험도 분석 모델로 **확장 가능한 구조**로 설계되었습니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔐 **로그인 / 회원가입** | Supabase Auth 기반 이메일 인증 |
| 📊 **대시보드** | 오늘 탐지 건수, 키워드 수, 처리 현황 한눈에 확인 |
| 🔑 **키워드 관리** | 탐지 키워드 등록·수정·삭제 및 위험도(low / medium / high) 설정 |
| 🔍 **탐지 실행** | 활성 키워드 기반 탐지 시뮬레이션 및 DB 자동 저장 |
| 📋 **탐지 결과** | 탐지된 게시글 목록 조회, 필터링, 처리 완료 처리 |
| 👥 **실무자 관리** | 관리자 / 열람자 계정 등록 및 권한 관리 |

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React, TypeScript, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth) |
| **빌드 도구** | Vite |
| **개발 플랫폼** | Lovable |
| **배포** | Lovable Publish |
| **코드 관리** | GitHub |

---

## 🚀 서비스 URL

- **배포 주소** : `https://SafeWatch_mma_kjy.lovable.app`
- **GitHub** : `https://github.com/kjy-arch/safewatch_mma_kjy`

---

## 🗺️ 향후 확장 계획

현재 MVP 단계에서는 탐지 시뮬레이션 기반으로 전체 파이프라인을 검증했으며,
아래와 같은 확장을 계획하고 있습니다.

- [ ] 실제 크롤링 엔진 연동 (RSS / Supabase Edge Function)
- [ ] AI 기반 위험도 자동 분류 모델 적용
- [ ] 이메일 알림 발송 기능
- [ ] 자동 스케줄링 탐지 (cron 기반)
- [ ] 탐지 통계 차트 대시보드

---

## 🎤 발표 멘트

> "MVP 단계에서는 탐지 시뮬레이션 기반으로 전체 파이프라인을 검증했으며,
> 추후 실제 크롤링 엔진 및 AI 위험도 분석 모델을 추가 확장할 수 있도록 구조를 설계했습니다."

---

## 👨‍💻 개발 정보

| 항목 | 내용 |
|------|------|
| 개발 도구 | Lovable |
| 개발자 | [김재연] |
| 소속 | [병무청] |

---

## 📄 라이선스

This project is for educational purposes.
