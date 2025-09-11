'use client';

import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JourneyReport from '@/components/journey-report';

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
  buyerJourney?: string; // 구매여정 단계
}

const AVAILABLE_MODELS = [
  { value: 'gpt-5', label: 'GPT-5' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
];

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4.1');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          includeDetail: true,
        }),
      });

      if (!response.ok) {
        throw new Error('키워드 검색에 실패했습니다.');
      }

      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: string, isInteger: boolean = false) => {
    if (value === '<10') return value;
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (isInteger) {
      return Math.round(num).toLocaleString();
    }
    return num.toLocaleString();
  };

  const getCompetitionBadge = (comp: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      mid: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    const labels = {
      low: '낮음',
      mid: '보통',
      high: '높음',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[comp as keyof typeof colors] || ''}`}>
        {labels[comp as keyof typeof labels] || comp}
      </span>
    );
  };


  // 필터링된 키워드 목록
  const filteredKeywords = keywords.filter(kw => {
    const matchesKeyword = filterKeyword === '' || kw.relKeyword.toLowerCase().includes(filterKeyword.toLowerCase());
    const matchesStage = filterStage === '' || filterStage === 'all' || kw.buyerJourney === filterStage;
    return matchesKeyword && matchesStage;
  });

  // 정렬된 키워드 목록
  const sortedKeywords = [...filteredKeywords].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: string | number = a[sortField as keyof KeywordData] || '';
    let bValue: string | number = b[sortField as keyof KeywordData] || '';
    
    // 숫자 필드인 경우 숫자로 변환
    const numericFields = ['monthlyPcQcCnt', 'monthlyMobileQcCnt', 'monthlyAvePcClkCnt', 'monthlyAveMobileClkCnt', 'monthlyAvePcCtr', 'monthlyAveMobileCtr', 'plAvgDepth'];
    if (numericFields.includes(sortField)) {
      aValue = parseFloat(String(aValue).replace('<', '').replace(',', '')) || 0;
      bValue = parseFloat(String(bValue).replace('<', '').replace(',', '')) || 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // 필터링된 키워드 기준으로 단계별 요약 계산
  const stageSummary = (() => {
    const summary: Record<string, number> = {
      '문제 인식': 0,
      '정보 탐색': 0,
      '대안 평가': 0,
      '구매 결정': 0,
      '구매 행동': 0,
      '구매 후 행동': 0,
    };

    filteredKeywords.forEach(keyword => {
      if (keyword.buyerJourney && summary[keyword.buyerJourney] !== undefined) {
        summary[keyword.buyerJourney]++;
      }
    });

    return summary;
  })();

  // 정렬 핸들러
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getBuyerJourneyBadge = (stage?: string) => {
    if (!stage) return <span className="text-gray-400 text-sm">-</span>;
    
    const stageInfo: Record<string, { color: string; label: string }> = {
      '문제 인식': { color: 'bg-blue-100 text-blue-800', label: '문제 인식' },
      '정보 탐색': { color: 'bg-cyan-100 text-cyan-800', label: '정보 탐색' },
      '대안 평가': { color: 'bg-purple-100 text-purple-800', label: '대안 평가' },
      '구매 결정': { color: 'bg-orange-100 text-orange-800', label: '구매 결정' },
      '구매 행동': { color: 'bg-green-100 text-green-800', label: '구매 행동' },
      '구매 후 행동': { color: 'bg-gray-100 text-gray-800', label: '구매 후 행동' },
    };
    
    const info = stageInfo[stage] || { color: 'bg-gray-100 text-gray-600', label: stage };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const handleAnalyzeBuyerJourney = async () => {
    if (keywords.length === 0) {
      setError('먼저 키워드를 검색해주세요.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/analyze-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.map(k => k.relKeyword),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('구매여정 분석에 실패했습니다.');
      }

      const data = await response.json();
      
      // 데이터 소스 확인 및 알림
      if (data.source === 'dummy') {
        console.log('📌 더미 데이터 사용:', data.message);
      } else if (data.source === 'openai') {
        console.log(`✅ ${data.model || selectedModel} 분석:`, data.message);
        if (data.totalBatches) {
          console.log(`📊 배치 정보: ${data.totalBatches}개 배치, 총 ${data.totalKeywords}개 키워드`);
        }
      } else if (data.source === 'fallback') {
        console.log('⚠️ Fallback 데이터:', data.message, data.error);
      }
      
      const updatedKeywords = keywords.map(kw => {
        const analysis = data.results.find((r: { keyword: string; stage: string }) => r.keyword === kw.relKeyword);
        return {
          ...kw,
          buyerJourney: analysis?.stage || undefined,
        };
      });
      
      setKeywords(updatedKeywords);
    } catch (err) {
      setError(err instanceof Error ? err.message : '구매여정 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  // 정렬 아이콘 컴포넌트
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>네이버 키워드 분석</CardTitle>
          <CardDescription>
            네이버 Search Ad API를 활용한 키워드 분석 도구입니다.
            검색하고자 하는 키워드를 입력하면 관련 키워드와 통계를 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="키워드를 입력하세요 (예: 카페)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? '검색 중...' : '검색'}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {keywords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>검색 결과</CardTitle>
                <CardDescription>
                  총 {keywords.length}개의 관련 키워드를 찾았습니다. 
                  {filteredKeywords.length !== keywords.length && (
                    <span className="text-blue-600">
                      (필터링된 결과: {filteredKeywords.length}개)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">모델:</span>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAnalyzeBuyerJourney} 
                  disabled={analyzing}
                  variant="outline"
                  className="min-w-32"
                >
                  {analyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      분석 중...
                    </div>
                  ) : (
                    '구매여정 분석'
                  )}
                </Button>
                <JourneyReport keywords={keywords} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* 필터 영역 */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">키워드 필터</label>
                  <Input
                    type="text"
                    placeholder="키워드로 검색..."
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-48">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">구매여정 단계</label>
                  <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="전체 단계" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 단계</SelectItem>
                      <SelectItem value="문제 인식">문제 인식</SelectItem>
                      <SelectItem value="정보 탐색">정보 탐색</SelectItem>
                      <SelectItem value="대안 평가">대안 평가</SelectItem>
                      <SelectItem value="구매 결정">구매 결정</SelectItem>
                      <SelectItem value="구매 행동">구매 행동</SelectItem>
                      <SelectItem value="구매 후 행동">구매 후 행동</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(filterKeyword || (filterStage && filterStage !== 'all')) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilterKeyword('');
                      setFilterStage('');
                    }}
                    className="mt-6"
                  >
                    필터 초기화
                  </Button>
                )}
              </div>
            </div>

            {/* 구매여정 단계별 요약 */}
            {filteredKeywords.some(kw => kw.buyerJourney) && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">구매여정 단계별 키워드 분포</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stageSummary).map(([stage, count]) => (
                    count > 0 && (
                      <div key={stage} className="flex items-center gap-1">
                        {getBuyerJourneyBadge(stage)}
                        <span className="text-sm text-gray-600">({count}개)</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button 
                        className="flex items-center hover:text-blue-600 font-medium"
                        onClick={() => handleSort('relKeyword')}
                      >
                        키워드
                        <SortIcon field="relKeyword" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button 
                        className="flex items-center justify-center hover:text-blue-600 font-medium"
                        onClick={() => handleSort('buyerJourney')}
                      >
                        구매여정단계
                        <SortIcon field="buyerJourney" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        className="flex items-center justify-end hover:text-blue-600 font-medium ml-auto"
                        onClick={() => handleSort('monthlyPcQcCnt')}
                      >
                        PC 검색수
                        <SortIcon field="monthlyPcQcCnt" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        className="flex items-center justify-end hover:text-blue-600 font-medium ml-auto"
                        onClick={() => handleSort('monthlyMobileQcCnt')}
                      >
                        모바일 검색수
                        <SortIcon field="monthlyMobileQcCnt" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        className="flex items-center justify-end hover:text-blue-600 font-medium ml-auto"
                        onClick={() => handleSort('monthlyAvePcClkCnt')}
                      >
                        PC 클릭수
                        <SortIcon field="monthlyAvePcClkCnt" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        className="flex items-center justify-end hover:text-blue-600 font-medium ml-auto"
                        onClick={() => handleSort('monthlyAveMobileClkCnt')}
                      >
                        모바일 클릭수
                        <SortIcon field="monthlyAveMobileClkCnt" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        className="flex items-center justify-end hover:text-blue-600 font-medium ml-auto"
                        onClick={() => handleSort('monthlyAvePcCtr')}
                      >
                        PC CTR
                        <SortIcon field="monthlyAvePcCtr" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        className="flex items-center justify-end hover:text-blue-600 font-medium ml-auto"
                        onClick={() => handleSort('monthlyAveMobileCtr')}
                      >
                        모바일 CTR
                        <SortIcon field="monthlyAveMobileCtr" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button 
                        className="flex items-center justify-end hover:text-blue-600 font-medium ml-auto"
                        onClick={() => handleSort('plAvgDepth')}
                      >
                        광고 노출순위
                        <SortIcon field="plAvgDepth" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button 
                        className="flex items-center justify-center hover:text-blue-600 font-medium"
                        onClick={() => handleSort('compIdx')}
                      >
                        경쟁도
                        <SortIcon field="compIdx" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-red-50 border-t-2 border-red-200">
                    <TableCell className="font-bold text-gray-900">
                      합계 ({filteredKeywords.length}개)
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      -
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {formatNumber(
                        filteredKeywords.reduce((sum, kw) => {
                          const str = typeof kw.monthlyPcQcCnt === 'string' ? kw.monthlyPcQcCnt : String(kw.monthlyPcQcCnt);
                          const num = parseFloat(str.replace('<', '').replace(',', ''));
                          return sum + (isNaN(num) ? 0 : num);
                        }, 0).toString()
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {formatNumber(
                        filteredKeywords.reduce((sum, kw) => {
                          const str = typeof kw.monthlyMobileQcCnt === 'string' ? kw.monthlyMobileQcCnt : String(kw.monthlyMobileQcCnt);
                          const num = parseFloat(str.replace('<', '').replace(',', ''));
                          return sum + (isNaN(num) ? 0 : num);
                        }, 0).toString()
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {formatNumber(
                        filteredKeywords.reduce((sum, kw) => {
                          const str = typeof kw.monthlyAvePcClkCnt === 'string' ? kw.monthlyAvePcClkCnt : String(kw.monthlyAvePcClkCnt);
                          const num = parseFloat(str.replace(',', ''));
                          return sum + (isNaN(num) ? 0 : num);
                        }, 0).toString(),
                        true
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {formatNumber(
                        filteredKeywords.reduce((sum, kw) => {
                          const str = typeof kw.monthlyAveMobileClkCnt === 'string' ? kw.monthlyAveMobileClkCnt : String(kw.monthlyAveMobileClkCnt);
                          const num = parseFloat(str.replace(',', ''));
                          return sum + (isNaN(num) ? 0 : num);
                        }, 0).toString(),
                        true
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {filteredKeywords.length > 0 ? (filteredKeywords.reduce((sum, kw) => {
                        const str = typeof kw.monthlyAvePcCtr === 'string' ? kw.monthlyAvePcCtr : String(kw.monthlyAvePcCtr);
                        const num = parseFloat(str);
                        return sum + (isNaN(num) ? 0 : num);
                      }, 0) / filteredKeywords.length).toFixed(2) : '0.00'}%
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {filteredKeywords.length > 0 ? (filteredKeywords.reduce((sum, kw) => {
                        const str = typeof kw.monthlyAveMobileCtr === 'string' ? kw.monthlyAveMobileCtr : String(kw.monthlyAveMobileCtr);
                        const num = parseFloat(str);
                        return sum + (isNaN(num) ? 0 : num);
                      }, 0) / filteredKeywords.length).toFixed(2) : '0.00'}%
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {filteredKeywords.length > 0 ? (filteredKeywords.reduce((sum, kw) => {
                        const str = typeof kw.plAvgDepth === 'string' ? kw.plAvgDepth : String(kw.plAvgDepth);
                        const num = parseFloat(str);
                        return sum + (isNaN(num) ? 0 : num);
                      }, 0) / filteredKeywords.length).toFixed(1) : '0.0'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {['low', 'mid', 'high'].map(comp => {
                          const count = filteredKeywords.filter(kw => kw.compIdx === comp).length;
                          return count > 0 && (
                            <div key={comp} className="flex items-center gap-1">
                              {getCompetitionBadge(comp)}
                              <span className="text-xs text-gray-600">({count})</span>
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                  {sortedKeywords.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.relKeyword}</TableCell>
                      <TableCell className="text-center">{getBuyerJourneyBadge(item.buyerJourney)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.monthlyPcQcCnt)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.monthlyMobileQcCnt)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.monthlyAvePcClkCnt, true)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.monthlyAveMobileClkCnt, true)}</TableCell>
                      <TableCell className="text-right">{item.monthlyAvePcCtr}%</TableCell>
                      <TableCell className="text-right">{item.monthlyAveMobileCtr}%</TableCell>
                      <TableCell className="text-right">{item.plAvgDepth}</TableCell>
                      <TableCell className="text-center">{getCompetitionBadge(item.compIdx)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {keywords.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            키워드를 입력하고 검색 버튼을 클릭하여 분석을 시작하세요.
          </CardContent>
        </Card>
      )}
    </div>
  );
}