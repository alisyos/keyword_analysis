# 네이버 키워드 분석 도구

네이버 Search Ad API를 활용한 키워드 분석 도구입니다.

## 주요 기능

- 키워드 검색 및 관련 키워드 분석
- PC/모바일 검색량 확인
- 클릭률(CTR) 및 경쟁도 분석
- 광고 노출 순위 확인

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
NAVER_API_KEY=your_api_key
NAVER_SECRET_KEY=your_secret_key
NAVER_CUSTOMER_ID=your_customer_id
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## Vercel 배포

### 1. Vercel에 프로젝트 연결

```bash
vercel
```

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 추가합니다:
- `NAVER_API_KEY`
- `NAVER_SECRET_KEY`
- `NAVER_CUSTOMER_ID`

### 3. 배포

```bash
vercel --prod
```

## API 인증 정보 발급

1. [네이버 광고 관리 시스템](http://searchad.naver.com)에 가입
2. [관리 페이지](http://manage.searchad.naver.com)에서 도구 > API 관리자로 이동
3. API 라이선스 생성

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI Components
- Naver Search Ad API

## 라이선스

MIT