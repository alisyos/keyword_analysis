# 구매여정 분석 리포트 - UI/UX 가이드라인

## 프로젝트 개요
키워드 분석 도구의 구매여정 분석 리포트 기능으로, GPT-4.1 기반 AI 인사이트를 제공합니다.

## 기술 스택
- **Framework**: Next.js 14.2.30
- **UI Components**: shadcn/ui (Radix UI 기반)
- **Charts**: Recharts
- **AI Model**: GPT-4.1
- **Styling**: Tailwind CSS

## 탭 구조
6개의 메인 탭으로 구성:
1. **차트 분석** - 통계 차트 및 데이터 시각화
2. **마케팅 인사이트** - 구매여정 단계별 마케팅 전략
3. **예산 배분** - 매체별 예산 배분 전략
4. **랜딩 전략** - 랜딩 페이지 최적화
5. **DA 광고** - 디스플레이 광고 전략
6. **SA 광고** - 검색 광고 전략

### 탭 UI 패턴
```tsx
<TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
  <TabsTrigger value="charts" className="text-xs">
    <BarChart3 className="h-3 w-3 mr-1" />
    차트 분석
  </TabsTrigger>
  // ... 다른 탭들
</TabsList>
```

## 색상 시스템

### 구매여정 단계별 색상
```typescript
const STAGE_COLORS = {
  '문제 인식': '#3B82F6',    // Blue
  '정보 탐색': '#06B6D4',    // Cyan
  '대안 평가': '#8B5CF6',    // Purple
  '구매 결정': '#F59E0B',    // Amber
  '구매 행동': '#10B981',    // Emerald
  '구매 후 행동': '#6B7280', // Gray
};
```

### 인사이트 카테고리별 아이콘 색상
- 마케팅: `text-blue-600`
- 예산: `text-green-600`
- 랜딩: `text-purple-600`
- DA 광고: `text-orange-600`
- SA 광고: `text-cyan-600`

## 아이콘 사용 가이드

### 메인 아이콘 (lucide-react)
- **탭 아이콘**: `h-3 w-3` 크기
- **카드 헤더 아이콘**: `h-4 w-4` 크기
- **컨텐츠 아이콘**: `h-4 w-4` 크기

### 주요 아이콘 매핑
```typescript
// 탭 아이콘
BarChart3 - 차트 분석
TrendingUp - 마케팅 인사이트
DollarSign - 예산 배분
Globe - 랜딩 전략
Megaphone - DA 광고
Search - SA 광고

// 컨텐츠 아이콘
Target - 주요 특징
Users - 고객 니즈
MessageSquare - 메시지 전략
BookOpen - 콘텐츠 전략
```

## API 응답 형식

### 마케팅 인사이트 JSON 구조
```typescript
interface MarketingInsight {
  stages: {
    [stageName: string]: {
      characteristics: string;    // 주요 특징과 패턴
      customerNeeds: string;      // 타겟 고객의 니즈
      messageStrategy: string;    // 핵심 마케팅 메시지
      contentStrategy: string;    // 콘텐츠 전략 방향
      keywords?: string[];        // 주요 키워드 3-5개
    };
  };
  summary: string;  // 전체 구매여정 종합 인사이트
}
```

### 다른 인사이트 유형 (예정)
- **예산 배분**: 매체별 비율과 근거를 JSON으로
- **랜딩 전략**: 단계별 페이지 구성 요소를 JSON으로
- **DA/SA 광고**: 광고 소재와 타겟팅을 JSON으로

## UI 컴포넌트 패턴

### 인사이트 카드 레이아웃
```tsx
// 2열 그리드 (PC)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* 단계별 카드 */}
</div>

// 카드 구조
<Card className="overflow-hidden">
  {/* 상단 색상 바 */}
  <div className="h-2" style={{ backgroundColor: stageColor }} />
  
  <CardHeader>
    {/* 단계명과 색상 인디케이터 */}
    <CardTitle className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor }} />
      {stageName}
    </CardTitle>
    
    {/* 키워드 태그 */}
    <div className="flex flex-wrap gap-1">
      {keywords.map(keyword => (
        <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
          {keyword}
        </span>
      ))}
    </div>
  </CardHeader>
  
  <CardContent>
    {/* 4개 섹션 구조 */}
    <div className="space-y-3">
      <div className="flex gap-3">
        <Icon className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">섹션 제목</h4>
          <p className="text-sm text-gray-600 leading-relaxed">내용</p>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### 로딩 상태
```tsx
<Button disabled={loadingInsight === type}>
  {loadingInsight === type ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      생성 중...
    </>
  ) : (
    <>
      <Sparkles className="h-4 w-4" />
      인사이트 생성
    </>
  )}
</Button>
```

### 스크롤 영역
```tsx
<ScrollArea className="h-[600px] w-full pr-4">
  {/* 컨텐츠 */}
</ScrollArea>
```

## 텍스트 스타일 가이드

### 제목 계층
- **Dialog Title**: `text-lg` + 아이콘
- **Card Title**: `text-lg` 또는 기본
- **Section Title**: `text-sm font-medium text-gray-900`
- **Description**: `text-sm text-gray-600`

### 간격 (Spacing)
- **카드 간격**: `gap-4`
- **섹션 간격**: `space-y-3` 또는 `space-y-4`
- **아이템 간격**: `gap-2` 또는 `gap-3`

## 반응형 디자인

### 브레이크포인트
- **모바일**: 기본 (1열)
- **태블릿/PC**: `md:` (2열)
- **대형 화면**: `lg:` (필요시 3열 이상)

### 그리드 시스템
```tsx
// 탭 버튼 (3열 → 6열)
grid-cols-3 lg:grid-cols-6

// 컨텐츠 카드 (1열 → 2열)
grid-cols-1 md:grid-cols-2
```

## 개발 가이드

### 린트 및 타입체크
```bash
npm run lint
npm run typecheck
```

### 새로운 인사이트 탭 추가 시
1. API 엔드포인트에 새 케이스 추가
2. JSON 응답 형식 정의
3. UI 컴포넌트는 마케팅 인사이트 패턴 참조
4. 2열 그리드 레이아웃 유지
5. 단계별 색상 코딩 적용

## 향후 개선 예정
- [ ] 예산 배분 탭 JSON 구조화
- [ ] 랜딩 전략 탭 JSON 구조화
- [ ] DA 광고 탭 JSON 구조화 및 크리에이티브 미리보기
- [ ] SA 광고 탭 JSON 구조화 및 광고 문구 템플릿
- [ ] 인사이트 다운로드 기능 (PDF/Excel)
- [ ] 인사이트 히스토리 저장

## 주의사항
- GPT-4.1 모델 사용 (`gpt-4.1`)
- OpenAI API 키 필요 (`.env.local`)
- 응답 형식: JSON (`response_format: { type: 'json_object' }`)
- 최대 토큰: 2000
- Temperature: 0.7