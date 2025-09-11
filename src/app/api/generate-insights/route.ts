import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface KeywordData {
  relKeyword: string;
  monthlyPcQcCnt: string;
  monthlyMobileQcCnt: string;
  monthlyAvePcClkCnt: string;
  monthlyAveMobileClkCnt: string;
  monthlyAvePcCtr: string;
  monthlyAveMobileCtr: string;
  plAvgDepth: string;
  compIdx: string;
  buyerJourney?: string;
}

interface InsightRequest {
  keywords: KeywordData[];
  insightType: 'marketing' | 'budget' | 'landing' | 'da' | 'sa';
  stageData?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const { keywords, insightType } = await request.json() as InsightRequest;

    const stageKeywords = {
      '문제 인식': keywords.filter(kw => kw.buyerJourney === '문제 인식'),
      '정보 탐색': keywords.filter(kw => kw.buyerJourney === '정보 탐색'),
      '대안 평가': keywords.filter(kw => kw.buyerJourney === '대안 평가'),
      '구매 결정': keywords.filter(kw => kw.buyerJourney === '구매 결정'),
      '구매 행동': keywords.filter(kw => kw.buyerJourney === '구매 행동'),
      '구매 후 행동': keywords.filter(kw => kw.buyerJourney === '구매 후 행동'),
    };

    const dataContext = `
구매여정 단계별 키워드 분포:
- 문제 인식: ${stageKeywords['문제 인식'].length}개 키워드
- 정보 탐색: ${stageKeywords['정보 탐색'].length}개 키워드
- 대안 평가: ${stageKeywords['대안 평가'].length}개 키워드
- 구매 결정: ${stageKeywords['구매 결정'].length}개 키워드
- 구매 행동: ${stageKeywords['구매 행동'].length}개 키워드
- 구매 후 행동: ${stageKeywords['구매 후 행동'].length}개 키워드

주요 키워드 샘플:
${Object.entries(stageKeywords).map(([stage, kws]) => 
  `${stage}: ${kws.slice(0, 5).map(k => k.relKeyword).join(', ')}`
).join('\n')}
`;

    let systemPrompt = '';
    let userPrompt = '';

    switch (insightType) {
      case 'marketing':
        systemPrompt = '당신은 마케팅 전략 전문가입니다. 구매여정 단계별 키워드 데이터를 분석하여 마케팅 인사이트를 제공합니다. 반드시 지정된 JSON 형식으로만 응답하세요.';
        userPrompt = `다음 구매여정 단계별 키워드 데이터를 기반으로 마케팅 인사이트를 제공해주세요:

${dataContext}

다음 JSON 형식으로 응답해주세요:
{
  "stages": {
    "문제 인식": {
      "characteristics": "주요 특징과 패턴 (2-3문장)",
      "customerNeeds": "타겟 고객의 니즈 분석 (2-3문장)",
      "messageStrategy": "핵심 마케팅 메시지 제안 (2-3문장)",
      "contentStrategy": "콘텐츠 전략 방향 (2-3문장)",
      "keywords": ["주요 키워드 3-5개"]
    },
    "정보 탐색": { ... 동일한 구조 },
    "대안 평가": { ... 동일한 구조 },
    "구매 결정": { ... 동일한 구조 },
    "구매 행동": { ... 동일한 구조 },
    "구매 후 행동": { ... 동일한 구조 }
  },
  "summary": "전체 구매여정에 대한 종합 인사이트 (3-4문장)"
}

각 단계별로 구체적이고 실행 가능한 인사이트를 제공하되, 해당 단계에 키워드가 없으면 해당 단계는 생략하세요.`;
        break;

      case 'budget':
        systemPrompt = '당신은 디지털 마케팅 예산 전략가입니다. 구매여정 단계별 데이터를 기반으로 효율적인 예산 배분을 제안합니다. 반드시 지정된 JSON 형식으로만 응답하세요.';
        userPrompt = `다음 구매여정 단계별 키워드 데이터를 기반으로 매체별 예산 배분을 제안해주세요:

${dataContext}

다음 JSON 형식으로 응답해주세요:
{
  "overallAllocation": {
    "SA": { "percentage": 40, "description": "검색광고 설명" },
    "DA": { "percentage": 15, "description": "디스플레이 광고 설명" },
    "Social": { "percentage": 10, "description": "소셜미디어 광고 설명" },
    "Content": { "percentage": 25, "description": "콘텐츠 마케팅 설명" },
    "Email": { "percentage": 10, "description": "이메일 마케팅 설명" }
  },
  "stageAllocation": {
    "문제 인식": {
      "primaryChannels": ["DA", "Social"],
      "allocation": { "DA": 50, "Social": 30, "Content": 20 },
      "strategy": "브랜드 인지도 확산 전략"
    },
    "정보 탐색": { ... 동일한 구조 },
    "대안 평가": { ... 동일한 구조 },
    "구매 결정": { ... 동일한 구조 },
    "구매 행동": { ... 동일한 구조 },
    "구매 후 행동": { ... 동일한 구조 }
  },
  "channelDetails": {
    "SA": {
      "strengths": ["즉각적 니즈 대응", "높은 전환율"],
      "bestStages": ["대안 평가", "구매 결정", "구매 행동"],
      "tactics": "키워드별 입찰 전략"
    },
    "DA": { ... 동일한 구조 },
    "Social": { ... 동일한 구조 },
    "Content": { ... 동일한 구조 },
    "Email": { ... 동일한 구조 }
  },
  "summary": "전체 예산 배분 전략 요약 (3-4문장)"
}

각 단계별 예산 합은 100%가 되도록 하고, 해당 단계에 키워드가 없으면 생략하세요.`;
        break;

      case 'landing':
        systemPrompt = '당신은 랜딩 페이지 최적화 전문가입니다. 구매여정 단계별로 효과적인 랜딩 페이지 전략을 수립합니다.';
        userPrompt = `다음 구매여정 단계별 키워드 데이터를 기반으로 랜딩 페이지 전략을 제안해주세요:

${dataContext}

각 구매여정 단계별로:
1. 랜딩 페이지 주요 메시지
2. 필수 구성 요소
3. CTA(Call-to-Action) 전략
4. 콘텐츠 구성 제안
5. 전환 최적화 포인트

구체적이고 실행 가능한 랜딩 페이지 전략을 제공해주세요.`;
        break;

      case 'da':
        systemPrompt = '당신은 디스플레이 광고 전문가입니다. 구매여정 단계별로 효과적인 DA 광고 전략과 크리에이티브를 제안합니다.';
        userPrompt = `다음 구매여정 단계별 키워드 데이터를 기반으로 DA 광고 전략을 제안해주세요:

${dataContext}

각 구매여정 단계별로:
1. 타겟팅 전략
2. 광고 메시지 방향
3. 비주얼 컨셉 제안
4. 광고 소재 예시 (헤드라인, 설명문구)
5. 리마케팅 전략

구체적인 광고 소재 예시를 포함하여 실행 가능한 DA 광고 전략을 제공해주세요.`;
        break;

      case 'sa':
        systemPrompt = '당신은 검색광고 전문가입니다. 구매여정 단계별로 효과적인 SA 광고 전략과 광고문구를 제안합니다.';
        userPrompt = `다음 구매여정 단계별 키워드 데이터를 기반으로 SA 광고 전략을 제안해주세요:

${dataContext}

각 구매여정 단계별로:
1. 키워드 그룹 전략
2. 광고 문구 예시 (제목, 설명)
3. 광고 확장 전략
4. 입찰 전략
5. 부정 키워드 제안

구체적인 광고 문구 예시를 포함하여 실행 가능한 SA 광고 전략을 제공해주세요.`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid insight type' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: (insightType === 'marketing' || insightType === 'budget') ? { type: 'json_object' } : undefined,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // For marketing and budget insights, parse JSON response
    if (insightType === 'marketing' || insightType === 'budget') {
      try {
        const jsonInsight = JSON.parse(content);
        return NextResponse.json({ insight: jsonInsight });
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        return NextResponse.json({ insight: content });
      }
    }

    return NextResponse.json({ insight: content });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}