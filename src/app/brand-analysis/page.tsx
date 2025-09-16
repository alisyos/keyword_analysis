'use client';

import { useState } from 'react';
import { Plus, X, TrendingUp, BarChart3, Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface BrandKeyword {
  brand: string;
  keyword: string;
  monthlyPcQcCnt: string;
  monthlyMobileQcCnt: string;
  monthlyAvePcClkCnt: string;
  monthlyAveMobileClkCnt: string;
  monthlyAvePcCtr: string;
  monthlyAveMobileCtr: string;
  plAvgDepth: string;
  compIdx: string;
}

interface BrandData {
  brand: string;
  keywords: BrandKeyword[];
  totalSearchVolume: number;
  totalClickVolume: number;
  avgCtr: number;
  avgPosition: number;
}

const BRAND_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
];

export default function BrandAnalysisPage() {
  const [brandInputs, setBrandInputs] = useState<string[]>(['', '']);
  const [brandsData, setBrandsData] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addBrandInput = () => {
    if (brandInputs.length < 6) {
      setBrandInputs([...brandInputs, '']);
    }
  };

  const removeBrandInput = (index: number) => {
    if (brandInputs.length > 2) {
      const newInputs = brandInputs.filter((_, i) => i !== index);
      setBrandInputs(newInputs);
    }
  };

  const updateBrandInput = (index: number, value: string) => {
    const newInputs = [...brandInputs];
    newInputs[index] = value;
    setBrandInputs(newInputs);
  };

  const handleAnalyze = async () => {
    const validBrands = brandInputs.filter(brand => brand.trim());

    if (validBrands.length < 2) {
      setError('최소 2개 이상의 브랜드 키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setBrandsData([]);

    try {
      const results = await Promise.all(
        validBrands.map(async (brand) => {
          const response = await fetch('/api/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyword: brand.trim(),
              includeDetail: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`${brand} 검색 실패`);
          }

          const data = await response.json();
          const keywords = data.keywords || [];

          console.log(`${brand} 검색 결과:`, keywords.length, '개 키워드');

          // 브랜드 데이터 집계
          const totalSearchVolume = keywords.reduce((sum: number, kw: any) => {
            const pcStr = String(kw.monthlyPcQcCnt || '0');
            const mobileStr = String(kw.monthlyMobileQcCnt || '0');
            const pc = parseFloat(pcStr.replace('<', '').replace(/,/g, '')) || 0;
            const mobile = parseFloat(mobileStr.replace('<', '').replace(/,/g, '')) || 0;
            return sum + pc + mobile;
          }, 0);

          const totalClickVolume = keywords.reduce((sum: number, kw: any) => {
            const pcStr = String(kw.monthlyAvePcClkCnt || '0');
            const mobileStr = String(kw.monthlyAveMobileClkCnt || '0');
            const pc = parseFloat(pcStr.replace(/,/g, '')) || 0;
            const mobile = parseFloat(mobileStr.replace(/,/g, '')) || 0;
            return sum + pc + mobile;
          }, 0);

          const avgCtr = keywords.length > 0
            ? keywords.reduce((sum: number, kw: any) => {
                const pc = parseFloat(String(kw.monthlyAvePcCtr || '0')) || 0;
                const mobile = parseFloat(String(kw.monthlyAveMobileCtr || '0')) || 0;
                return sum + (pc + mobile) / 2;
              }, 0) / keywords.length
            : 0;

          const avgPosition = keywords.length > 0
            ? keywords.reduce((sum: number, kw: any) => sum + (parseFloat(String(kw.plAvgDepth || '0')) || 0), 0) / keywords.length
            : 0;

          console.log(`${brand} 집계:`, {
            totalSearchVolume,
            totalClickVolume,
            avgCtr,
            avgPosition,
            keywordCount: keywords.length
          });

          return {
            brand,
            keywords: keywords.map((kw: any) => ({
              ...kw,
              relKeyword: kw.relKeyword || brand,
            })).slice(0, 20), // 상위 20개만
            totalSearchVolume,
            totalClickVolume,
            avgCtr,
            avgPosition,
          };
        })
      );

      setBrandsData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  // 차트 데이터 준비
  const volumeComparisonData = brandsData.map((brand, index) => ({
    name: brand.brand,
    검색량: brand.totalSearchVolume,
    클릭량: brand.totalClickVolume,
    color: BRAND_COLORS[index],
  }));

  const performanceComparisonData = brandsData.map((brand, index) => ({
    name: brand.brand,
    'CTR (%)': brand.avgCtr.toFixed(2),
    '평균 순위': brand.avgPosition.toFixed(1),
    color: BRAND_COLORS[index],
  }));

  const radarData = brandsData.length > 0 ? [
    { metric: '검색량', ...Object.fromEntries(brandsData.map(b => [b.brand, (b.totalSearchVolume / Math.max(...brandsData.map(d => d.totalSearchVolume))) * 100])) },
    { metric: '클릭량', ...Object.fromEntries(brandsData.map(b => [b.brand, (b.totalClickVolume / Math.max(...brandsData.map(d => d.totalClickVolume))) * 100])) },
    { metric: 'CTR', ...Object.fromEntries(brandsData.map(b => [b.brand, (b.avgCtr / Math.max(...brandsData.map(d => d.avgCtr))) * 100])) },
    { metric: '키워드 수', ...Object.fromEntries(brandsData.map(b => [b.brand, (b.keywords.length / Math.max(...brandsData.map(d => d.keywords.length))) * 100])) },
    { metric: '노출 순위', ...Object.fromEntries(brandsData.map(b => [b.brand, ((5 - b.avgPosition) / 4) * 100])) },
  ] : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>브랜드 키워드 비교 분석</CardTitle>
          <CardDescription>
            2개 이상의 브랜드 키워드를 입력하여 검색 성과를 비교 분석합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              {brandInputs.map((brand, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: BRAND_COLORS[index] }}
                  />
                  <Input
                    placeholder={`브랜드 ${index + 1} (예: 삼성, 애플, LG)`}
                    value={brand}
                    onChange={(e) => updateBrandInput(index, e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                    className="flex-1"
                  />
                  {brandInputs.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBrandInput(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {brandInputs.length < 6 && (
                <Button
                  variant="outline"
                  onClick={addBrandInput}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  브랜드 추가
                </Button>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? '분석 중...' : '비교 분석 시작'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {brandsData.length > 0 && (
        <>
          {/* 브랜드 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {brandsData.map((brand, index) => (
              <Card key={brand.brand}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: BRAND_COLORS[index] }}
                      />
                      {brand.brand}
                    </CardTitle>
                    <Badge variant="outline">
                      {brand.keywords.length}개 키워드
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">총 검색량</span>
                      <span className="font-medium">{formatNumber(brand.totalSearchVolume)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">총 클릭량</span>
                      <span className="font-medium">{formatNumber(brand.totalClickVolume)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">평균 CTR</span>
                      <span className="font-medium">{brand.avgCtr.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">평균 순위</span>
                      <span className="font-medium">{brand.avgPosition.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 차트 탭 */}
          <Card>
            <CardHeader>
              <CardTitle>브랜드 성과 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="volume" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="volume">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    검색량/클릭량
                  </TabsTrigger>
                  <TabsTrigger value="performance">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    성과 지표
                  </TabsTrigger>
                  <TabsTrigger value="radar">
                    <Users className="h-4 w-4 mr-2" />
                    종합 비교
                  </TabsTrigger>
                  <TabsTrigger value="keywords">
                    <Search className="h-4 w-4 mr-2" />
                    키워드 상세
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="volume" className="mt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={volumeComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip formatter={(value: any) => formatNumber(value)} />
                      <Legend />
                      <Bar dataKey="검색량" fill="#3B82F6" />
                      <Bar dataKey="클릭량" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="performance" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-4">평균 CTR 비교 (%)</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="CTR (%)" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-4">평균 노출 순위</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="평균 순위" fill="#F59E0B" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="radar" className="mt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      {brandsData.map((brand, index) => (
                        <Radar
                          key={brand.brand}
                          name={brand.brand}
                          dataKey={brand.brand}
                          stroke={BRAND_COLORS[index]}
                          fill={BRAND_COLORS[index]}
                          fillOpacity={0.3}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="keywords" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {brandsData.map((brand, brandIndex) => (
                      <div key={brand.brand}>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: BRAND_COLORS[brandIndex] }}
                          />
                          {brand.brand} 상위 키워드
                        </h4>
                        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                          <div className="space-y-2">
                            {brand.keywords.slice(0, 10).map((kw, index) => {
                              const pcSearchStr = String(kw.monthlyPcQcCnt || '0');
                              const mobileSearchStr = String(kw.monthlyMobileQcCnt || '0');
                              const pcSearch = parseFloat(pcSearchStr.replace('<', '').replace(/,/g, '')) || 0;
                              const mobileSearch = parseFloat(mobileSearchStr.replace('<', '').replace(/,/g, '')) || 0;
                              const totalSearch = pcSearch + mobileSearch;
                              const ctr = String(kw.monthlyAvePcCtr || '0');

                              return (
                                <div
                                  key={index}
                                  className="flex justify-between items-center p-2 rounded hover:bg-gray-50"
                                >
                                  <span className="text-sm font-medium">{kw.relKeyword}</span>
                                  <div className="flex gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {formatNumber(totalSearch)}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      CTR {ctr}%
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {brandsData.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            브랜드 키워드를 입력하고 분석 버튼을 클릭하여 비교 분석을 시작하세요.
          </CardContent>
        </Card>
      )}
    </div>
  );
}