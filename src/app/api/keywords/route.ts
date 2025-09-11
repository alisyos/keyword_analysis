import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, includeDetail } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // 환경 변수가 설정되지 않은 경우 더미 데이터 반환
    const apiKey = process.env.NAVER_API_KEY;
    const secretKey = process.env.NAVER_SECRET_KEY;
    const customerId = process.env.NAVER_CUSTOMER_ID;

    if (!apiKey || !secretKey || !customerId) {
      // 더미 데이터 반환 (테스트용)
      const dummyData = [
        {
          relKeyword: keyword,
          monthlyPcQcCnt: "1234",
          monthlyMobileQcCnt: "5678",
          monthlyAvePcClkCnt: "123.4",
          monthlyAveMobileClkCnt: "567.8",
          monthlyAvePcCtr: "10.5",
          monthlyAveMobileCtr: "8.3",
          plAvgDepth: "2.1",
          compIdx: "low"
        },
        {
          relKeyword: `${keyword} 추천`,
          monthlyPcQcCnt: "890",
          monthlyMobileQcCnt: "2345",
          monthlyAvePcClkCnt: "89.0",
          monthlyAveMobileClkCnt: "234.5",
          monthlyAvePcCtr: "7.2",
          monthlyAveMobileCtr: "9.1",
          plAvgDepth: "3.5",
          compIdx: "mid"
        },
        {
          relKeyword: `${keyword} 가격`,
          monthlyPcQcCnt: "456",
          monthlyMobileQcCnt: "1890",
          monthlyAvePcClkCnt: "45.6",
          monthlyAveMobileClkCnt: "189.0",
          monthlyAvePcCtr: "5.8",
          monthlyAveMobileCtr: "6.4",
          plAvgDepth: "4.2",
          compIdx: "high"
        },
        {
          relKeyword: `${keyword} 후기`,
          monthlyPcQcCnt: "<10",
          monthlyMobileQcCnt: "3456",
          monthlyAvePcClkCnt: "0",
          monthlyAveMobileClkCnt: "345.6",
          monthlyAvePcCtr: "0",
          monthlyAveMobileCtr: "11.2",
          plAvgDepth: "1.8",
          compIdx: "low"
        },
        {
          relKeyword: `${keyword} 비교`,
          monthlyPcQcCnt: "789",
          monthlyMobileQcCnt: "4567",
          monthlyAvePcClkCnt: "78.9",
          monthlyAveMobileClkCnt: "456.7",
          monthlyAvePcCtr: "8.9",
          monthlyAveMobileCtr: "10.3",
          plAvgDepth: "2.9",
          compIdx: "mid"
        }
      ];

      console.log('Warning: Naver API credentials not configured. Returning dummy data.');
      return NextResponse.json({ keywords: dummyData });
    }

    // 실제 API 호출 (환경 변수가 설정된 경우)
    try {
      const { NaverSearchAdAPI } = await import('@/lib/naver-api');
      
      const naverApi = new NaverSearchAdAPI({
        apiKey,
        secretKey,
        customerId,
      });

      const keywords = await naverApi.getRelatedKeywords({
        hintKeywords: keyword,
        showDetail: includeDetail ? '1' : '0',
        includeHintKeywords: '1',
      });

      return NextResponse.json({ keywords });
    } catch (apiError) {
      console.error('Naver API Error:', apiError);
      // API 호출 실패 시에도 더미 데이터 반환
      const fallbackData = [
        {
          relKeyword: keyword,
          monthlyPcQcCnt: "N/A",
          monthlyMobileQcCnt: "N/A",
          monthlyAvePcClkCnt: "0",
          monthlyAveMobileClkCnt: "0",
          monthlyAvePcCtr: "0",
          monthlyAveMobileCtr: "0",
          plAvgDepth: "0",
          compIdx: "low"
        }
      ];
      return NextResponse.json({ keywords: fallbackData });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}