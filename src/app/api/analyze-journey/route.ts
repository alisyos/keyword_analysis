import { NextRequest, NextResponse } from 'next/server';

// 배치 크기 상수
const BATCH_SIZE = 50;

// 키워드 배치 분할 함수
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// 재시도가 가능한 배치 처리 함수
async function processBatchWithRetry(
  keywordBatch: string[], 
  model: string, 
  apiKey: string,
  batchIndex: number,
  maxRetries: number = 2
): Promise<{ keyword: string; stage: string }[]> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await processBatch(keywordBatch, model, apiKey, batchIndex, attempt);
    } catch (error) {
      console.error(`❌ Batch ${batchIndex + 1} attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxRetries) {
        console.log(`🔄 Batch ${batchIndex + 1} failed after ${maxRetries + 1} attempts. Using fallback data.`);
        // 최종 실패 시 더미 데이터 반환
        return keywordBatch.map(keyword => ({
          keyword,
          stage: '정보 탐색'
        }));
      }
      
      // 재시도 전 잠시 대기 (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying batch ${batchIndex + 1} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // 이 코드는 실행되지 않지만 TypeScript 컴파일러를 위해 필요
  return [];
}

// 단일 배치 처리 함수
async function processBatch(
  keywordBatch: string[], 
  model: string, 
  apiKey: string,
  batchIndex: number,
  attempt: number = 0
): Promise<{ keyword: string; stage: string }[]> {
  const attemptSuffix = attempt > 0 ? ` (attempt ${attempt + 1})` : '';
  console.log(`🔄 Processing batch ${batchIndex + 1} with ${keywordBatch.length} keywords using ${model}${attemptSuffix}`);
  
  const prompt = `다음 키워드들을 6단계 구매여정 단계 중 하나로 분류해주세요.

구매여정 6단계:
1. 문제 인식: 니즈나 문제를 처음 인식하는 단계 (예: "카페란", "창업이란", "문제점")
2. 정보 탐색: 해결책을 찾기 위해 정보를 수집하는 단계 (예: "카페 추천", "창업 방법", "종류")
3. 대안 평가: 여러 대안을 비교 검토하는 단계 (예: "카페 비교", "A vs B", "장단점")
4. 구매 결정: 특정 제품/서비스 구매를 결정하는 단계 (예: "카페 가격", "비용", "할인")
5. 구매 행동: 실제 구매 행동이 일어나는 단계 (예: "카페 구매", "주문", "예약")
6. 구매 후 행동: 구매 후 만족도를 평가하는 단계 (예: "카페 후기", "리뷰", "평가")

다음 키워드들을 분석해주세요:
${keywordBatch.map((k: string, i: number) => `${i + 1}. ${k}`).join('\n')}

각 키워드에 대해 반드시 다음 형식으로만 응답해주세요:
키워드명|단계명

정확한 예시:
카페 추천|정보 탐색
카페 창업 비용|구매 결정
카페 후기|구매 후 행동`;

  // 모델별 설정 결정
  const getModelConfig = (selectedModel: string) => {
    if (selectedModel.startsWith('gpt-5')) {
      return {
        apiUrl: 'https://api.openai.com/v1/responses',
        body: {
          model: selectedModel,
          input: `당신은 마케팅 전문가입니다. 키워드를 보고 구매여정 단계를 정확하게 분류해주세요.\n\n${prompt}`,
          reasoning: {
            effort: selectedModel === 'gpt-5' ? 'medium' : 'low'
          },
          text: {
            verbosity: selectedModel === 'gpt-5-nano' ? 'medium' : 'high'
          }
        }
      };
    } else {
      return {
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        body: {
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: '당신은 마케팅 전문가입니다. 키워드를 보고 구매여정 단계를 정확하게 분류해주세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }
      };
    }
  };

  const config = getModelConfig(model);

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(config.body),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`❌ Batch ${batchIndex + 1} API Error:`, errorData);
    throw new Error(`Batch ${batchIndex + 1} failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // 모델별 응답 파싱
  let content = '';
  if (model.startsWith('gpt-5')) {
    content = data.output_text || '';
  } else {
    content = data.choices?.[0]?.message?.content || '';
  }
  
  console.log(`📝 Batch ${batchIndex + 1} ${model} Raw Response:`, content);
  
  // 응답 파싱
  const results = content.split('\n')
    .filter((line: string) => line.includes('|'))
    .map((line: string) => {
      const [keyword, stage] = line.split('|').map(s => s.trim());
      return { keyword, stage };
    });

  console.log(`🔍 Batch ${batchIndex + 1} Parsed Results:`, results);

  // 매칭되지 않은 키워드에 대해 기본값 설정
  const finalResults = keywordBatch.map((keyword: string) => {
    const result = results.find(r => r.keyword === keyword);
    return {
      keyword,
      stage: result?.stage || '정보 탐색',
    };
  });

  console.log(`✅ Batch ${batchIndex + 1} Final Results:`, finalResults);
  return finalResults;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords, model = 'gpt-5-nano' } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // OpenAI API 키가 없는 경우 더미 데이터 반환
    if (!apiKey) {
      console.log('⚠️ OpenAI API key not configured. Returning DUMMY DATA.');
      
      // 더미 데이터: 키워드 패턴에 따라 구매여정 단계 할당
      const dummyResults = keywords.map((keyword: string) => {
        let stage = '정보 탐색'; // 기본값
        
        const lowerKeyword = keyword.toLowerCase();
        
        // 키워드 패턴에 따른 단계 매칭
        if (lowerKeyword.includes('이란') || lowerKeyword.includes('뜻') || lowerKeyword.includes('개념') || lowerKeyword.includes('문제점')) {
          stage = '문제 인식';
        } else if (lowerKeyword.includes('추천') || lowerKeyword.includes('종류') || lowerKeyword.includes('방법') || lowerKeyword.includes('정보')) {
          stage = '정보 탐색';
        } else if (lowerKeyword.includes('비교') || lowerKeyword.includes('vs') || lowerKeyword.includes('차이') || lowerKeyword.includes('장단점')) {
          stage = '대안 평가';
        } else if (lowerKeyword.includes('가격') || lowerKeyword.includes('할인') || lowerKeyword.includes('최저가') || lowerKeyword.includes('비용')) {
          stage = '구매 결정';
        } else if (lowerKeyword.includes('구매') || lowerKeyword.includes('구입') || lowerKeyword.includes('주문') || lowerKeyword.includes('예약')) {
          stage = '구매 행동';
        } else if (lowerKeyword.includes('후기') || lowerKeyword.includes('리뷰') || lowerKeyword.includes('평가') || lowerKeyword.includes('만족')) {
          stage = '구매 후 행동';
        }
        
        return {
          keyword,
          stage,
        };
      });
      
      return NextResponse.json({ 
        results: dummyResults,
        source: 'dummy',
        message: 'OpenAI API 키가 설정되지 않아 더미 데이터를 사용합니다.'
      });
    }

    // 키워드 배치 분할 및 병렬 처리
    console.log(`✅ OpenAI API key found. Processing ${keywords.length} keywords in batches of ${BATCH_SIZE} using ${model}.`);
    
    const keywordBatches = chunkArray(keywords, BATCH_SIZE);
    console.log(`📦 Split into ${keywordBatches.length} batches`);
    
    try {
      // 모든 배치를 병렬로 처리 (재시도 로직 포함)
      const batchPromises = keywordBatches.map((batch, index) => 
        processBatchWithRetry(batch, model, apiKey, index)
      );
      
      console.log(`🚀 Starting parallel processing of ${keywordBatches.length} batches...`);
      const batchResults = await Promise.all(batchPromises);
      
      // 모든 배치 결과를 하나로 병합
      const allResults = batchResults.flat();
      
      console.log(`✅ Successfully processed all ${keywordBatches.length} batches. Total results: ${allResults.length}`);
      
      return NextResponse.json({ 
        results: allResults,
        source: 'openai',
        model: model,
        totalBatches: keywordBatches.length,
        totalKeywords: keywords.length,
        message: `${model}을 사용하여 ${keywordBatches.length}개 배치를 병렬 처리했습니다.`
      });
    } catch (apiError) {
      console.error('❌ Batch processing error:', apiError);
      
      // 병렬 처리 실패 시 기본값 반환
      const fallbackResults = keywords.map((keyword: string) => ({
        keyword,
        stage: '정보 탐색',
      }));
      
      return NextResponse.json({ 
        results: fallbackResults,
        source: 'fallback',
        message: '배치 처리 실패로 기본값을 사용합니다.',
        error: apiError instanceof Error ? apiError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze buyer journey', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}