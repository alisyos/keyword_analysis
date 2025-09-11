import CryptoJS from 'crypto-js';

export interface KeywordData {
  relKeyword: string;
  monthlyPcQcCnt: string;
  monthlyMobileQcCnt: string;
  monthlyAvePcClkCnt: string;
  monthlyAveMobileClkCnt: string;
  monthlyAvePcCtr: string;
  monthlyAveMobileCtr: string;
  plAvgDepth: string;
  compIdx: string;
}

export interface NaverApiConfig {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

export class NaverSearchAdAPI {
  private baseUrl = 'https://api.searchad.naver.com';
  private config: NaverApiConfig;

  constructor(config: NaverApiConfig) {
    this.config = config;
  }

  private generateSignature(timestamp: string, method: string, uri: string): string {
    const message = `${timestamp}.${method}.${uri}`;
    const hash = CryptoJS.HmacSHA256(message, this.config.secretKey);
    return CryptoJS.enc.Base64.stringify(hash);
  }

  private getHeaders(method: string, uri: string) {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(timestamp, method, uri);

    return {
      'X-Timestamp': timestamp,
      'X-API-KEY': this.config.apiKey,
      'X-Customer': this.config.customerId,
      'X-Signature': signature,
      'Content-Type': 'application/json',
    };
  }

  async getRelatedKeywords(params: {
    hintKeywords: string;
    showDetail?: '0' | '1';
    month?: number;
    event?: number;
    includeHintKeywords?: '0' | '1';
    siteId?: string;
    biztpId?: number;
    mobileDaAdWeight?: number;
    pcDaAdWeight?: number;
    mobileSaAdWeight?: number;
    pcSaAdWeight?: number;
    keyword?: string;
    keywords?: string;
  }): Promise<KeywordData[]> {
    const uri = '/keywordstool';
    const queryString = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      )
    ).toString();
    const fullUri = `${uri}?${queryString}`;
    
    // 서명 생성 시에는 경로만 사용 (쿼리 파라미터 제외)
    const headers = this.getHeaders('GET', uri);
    
    console.log('API Request:', {
      url: `${this.baseUrl}${fullUri}`,
      headers: {
        ...headers,
        'X-API-KEY': headers['X-API-KEY'].substring(0, 10) + '...',
        'X-Signature': headers['X-Signature'].substring(0, 10) + '...'
      }
    });

    try {
      const response = await fetch(`${this.baseUrl}${fullUri}`, {
        method: 'GET',
        headers,
      });

      const responseText = await response.text();
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      
      if (!response.ok) {
        console.error('API Error Response:', responseText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${responseText}`);
      }

      try {
        const data = JSON.parse(responseText);
        return data.keywordList || [];
      } catch {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid JSON response from API');
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
      throw error;
    }
  }
}