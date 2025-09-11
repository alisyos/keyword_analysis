'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, BarChart3, Sparkles, Loader2, TrendingUp, DollarSign, Globe, Megaphone, Search, Target, Users, MessageSquare, BookOpen, Activity, Mail, Share2, Monitor } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface JourneyReportProps {
  keywords: KeywordData[];
}

const BUYER_JOURNEY_STAGES = [
  '문제 인식',
  '정보 탐색',
  '대안 평가',
  '구매 결정',
  '구매 행동',
  '구매 후 행동'
];

const STAGE_COLORS = {
  '문제 인식': '#3B82F6',
  '정보 탐색': '#06B6D4',
  '대안 평가': '#8B5CF6',
  '구매 결정': '#F59E0B',
  '구매 행동': '#10B981',
  '구매 후 행동': '#6B7280',
};

type MetricType = 'count' | 'searchTotal' | 'searchPc' | 'searchMobile' | 'clickTotal' | 'clickPc' | 'clickMobile';
type DistributionType = 'search' | 'click';
type InsightType = 'marketing' | 'budget' | 'landing' | 'da' | 'sa';

interface MarketingInsight {
  stages: {
    [key: string]: {
      characteristics: string;
      customerNeeds: string;
      messageStrategy: string;
      contentStrategy: string;
      keywords?: string[];
    };
  };
  summary: string;
}

interface BudgetInsight {
  overallAllocation: {
    [key: string]: {
      percentage: number;
      description: string;
    };
  };
  stageAllocation: {
    [key: string]: {
      primaryChannels: string[];
      allocation: { [key: string]: number };
      strategy: string;
    };
  };
  channelDetails: {
    [key: string]: {
      strengths: string[];
      bestStages: string[];
      tactics: string;
    };
  };
  summary: string;
}

interface InsightData {
  marketing?: MarketingInsight | string;
  budget?: BudgetInsight | string;
  landing?: string;
  da?: string;
  sa?: string;
}

export default function JourneyReport({ keywords }: JourneyReportProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('count');
  const [distributionType, setDistributionType] = useState<DistributionType>('search');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [insights, setInsights] = useState<InsightData>({});
  const [loadingInsight, setLoadingInsight] = useState<InsightType | null>(null);
  const [activeTab, setActiveTab] = useState('charts');

  const hasJourneyData = keywords.some(kw => kw.buyerJourney);

  if (!hasJourneyData) {
    return null;
  }

  const parseNumber = (value: string | number): number => {
    if (value === '<10') return 5;
    const stringValue = String(value);
    const num = parseFloat(stringValue.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const calculateStageData = () => {
    const stageData: Record<string, {
      name: string;
      count: number;
      searchTotal: number;
      searchPc: number;
      searchMobile: number;
      clickTotal: number;
      clickPc: number;
      clickMobile: number;
    }> = {};
    
    BUYER_JOURNEY_STAGES.forEach(stage => {
      const keywordsInStage = keywords.filter(kw => kw.buyerJourney === stage);
      
      stageData[stage] = {
        name: stage,
        count: keywordsInStage.length,
        searchTotal: keywordsInStage.reduce((sum, kw) => 
          sum + parseNumber(kw.monthlyPcQcCnt) + parseNumber(kw.monthlyMobileQcCnt), 0),
        searchPc: keywordsInStage.reduce((sum, kw) => 
          sum + parseNumber(kw.monthlyPcQcCnt), 0),
        searchMobile: keywordsInStage.reduce((sum, kw) => 
          sum + parseNumber(kw.monthlyMobileQcCnt), 0),
        clickTotal: keywordsInStage.reduce((sum, kw) => 
          sum + parseNumber(kw.monthlyAvePcClkCnt) + parseNumber(kw.monthlyAveMobileClkCnt), 0),
        clickPc: keywordsInStage.reduce((sum, kw) => 
          sum + parseNumber(kw.monthlyAvePcClkCnt), 0),
        clickMobile: keywordsInStage.reduce((sum, kw) => 
          sum + parseNumber(kw.monthlyAveMobileClkCnt), 0),
      };
    });
    
    return Object.values(stageData).filter(stage => stage.count > 0);
  };

  const getScatterData = () => {
    return keywords
      .filter(kw => kw.buyerJourney && (selectedStage === 'all' || kw.buyerJourney === selectedStage))
      .map(kw => ({
        keyword: kw.relKeyword,
        stage: kw.buyerJourney,
        pc: distributionType === 'search' 
          ? parseNumber(kw.monthlyPcQcCnt)
          : parseNumber(kw.monthlyAvePcClkCnt),
        mobile: distributionType === 'search'
          ? parseNumber(kw.monthlyMobileQcCnt)
          : parseNumber(kw.monthlyAveMobileClkCnt),
        total: (distributionType === 'search' 
          ? parseNumber(kw.monthlyPcQcCnt) + parseNumber(kw.monthlyMobileQcCnt)
          : parseNumber(kw.monthlyAvePcClkCnt) + parseNumber(kw.monthlyAveMobileClkCnt)),
      }));
  };

  const getTop5Keywords = () => {
    return getScatterData()
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const generateInsight = async (type: InsightType) => {
    setLoadingInsight(type);
    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords,
          insightType: type,
          stageData: calculateStageData(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      const data = await response.json();
      setInsights(prev => ({
        ...prev,
        [type]: data.insight,
      }));
    } catch (error) {
      console.error('Error generating insight:', error);
      setInsights(prev => ({
        ...prev,
        [type]: '인사이트 생성 중 오류가 발생했습니다. API 키를 확인해주세요.',
      }));
    } finally {
      setLoadingInsight(null);
    }
  };

  const stageData = calculateStageData();
  const scatterData = getScatterData();
  const top5Keywords = getTop5Keywords();

  const pieData = stageData.map(stage => ({
    ...stage,
    value: stage[selectedMetric],
    fill: STAGE_COLORS[stage.name as keyof typeof STAGE_COLORS],
  }));

  const getMetricLabel = (metric: MetricType) => {
    const labels = {
      count: '키워드 개수',
      searchTotal: '검색수 합계',
      searchPc: 'PC 검색수',
      searchMobile: '모바일 검색수',
      clickTotal: '클릭수 합계',
      clickPc: 'PC 클릭수',
      clickMobile: '모바일 클릭수',
    };
    return labels[metric];
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const renderMarketingInsights = () => {
    const marketingData = insights.marketing;
    
    if (!marketingData) {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              마케팅 인사이트 요약
            </CardTitle>
            <CardDescription>
              구매여정 단계별 주요 특징과 마케팅 전략을 제안합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Button
                onClick={() => generateInsight('marketing')}
                disabled={loadingInsight === 'marketing'}
                className="flex items-center gap-2"
              >
                {loadingInsight === 'marketing' ? (
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
              <p className="text-xs text-gray-500 mt-2">
                GPT-4.1을 활용하여 인사이트를 생성합니다
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (typeof marketingData === 'string') {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              마케팅 인사이트 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {marketingData}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {/* Summary Card */}
        {marketingData.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                전체 마케팅 인사이트 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {marketingData.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stage-by-stage insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(marketingData.stages || {}).map(([stage, data]) => (
            <Card key={stage} className="overflow-hidden">
              <div 
                className="h-2" 
                style={{ backgroundColor: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] }}
              />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] }}
                  />
                  {stage}
                </CardTitle>
                {data.keywords && data.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.keywords.map((keyword, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Target className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">주요 특징</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{data.characteristics}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Users className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">고객 니즈</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{data.customerNeeds}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <MessageSquare className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">메시지 전략</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{data.messageStrategy}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <BookOpen className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">콘텐츠 전략</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{data.contentStrategy}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SA': return <Search className="h-4 w-4" />;
      case 'DA': return <Monitor className="h-4 w-4" />;
      case 'Social': return <Share2 className="h-4 w-4" />;
      case 'Content': return <BookOpen className="h-4 w-4" />;
      case 'Email': return <Mail className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    const colors = {
      SA: 'bg-blue-500',
      DA: 'bg-orange-500', 
      Social: 'bg-pink-500',
      Content: 'bg-green-500',
      Email: 'bg-purple-500',
    };
    return colors[channel as keyof typeof colors] || 'bg-gray-500';
  };

  const getChannelName = (channel: string) => {
    const names = {
      SA: '검색광고',
      DA: '디스플레이 광고',
      Social: '소셜미디어 광고',
      Content: '콘텐츠 마케팅',
      Email: '이메일 마케팅',
    };
    return names[channel as keyof typeof names] || channel;
  };

  const renderBudgetInsights = () => {
    const budgetData = insights.budget;
    
    if (!budgetData) {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-4 w-4 text-green-600" />
              매체별 예산 배분
            </CardTitle>
            <CardDescription>
              효율적인 매체별 예산 배분 전략을 제시합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Button
                onClick={() => generateInsight('budget')}
                disabled={loadingInsight === 'budget'}
                className="flex items-center gap-2"
              >
                {loadingInsight === 'budget' ? (
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
              <p className="text-xs text-gray-500 mt-2">
                GPT-4.1을 활용하여 인사이트를 생성합니다
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (typeof budgetData === 'string') {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-4 w-4 text-green-600" />
              매체별 예산 배분
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {budgetData}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      );
    }

    const overallData = Object.entries(budgetData.overallAllocation || {}).sort(
      ([, a], [, b]) => b.percentage - a.percentage
    );

    return (
      <div className="space-y-6">
        {/* Summary */}
        {budgetData.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
                예산 배분 전략 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {budgetData.summary}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Budget Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>전체 예산 배분</CardTitle>
              <CardDescription>매체별 추천 예산 비율</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overallData.map(([channel, data]) => (
                  <div key={channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getChannelColor(channel)}`} />
                        <span className="font-medium">{getChannelName(channel)}</span>
                      </div>
                      <span className="font-bold text-lg">{data.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getChannelColor(channel)}`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 ml-5">{data.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Channel Details */}
          <Card>
            <CardHeader>
              <CardTitle>매체별 상세 정보</CardTitle>
              <CardDescription>각 매체의 특징과 활용 전략</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-4">
                  {Object.entries(budgetData.channelDetails || {}).map(([channel, details]) => (
                    <div key={channel} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {getChannelIcon(channel)}
                        <h4 className="font-medium">{getChannelName(channel)}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">강점:</span>
                          <ul className="list-disc list-inside ml-2 text-gray-600">
                            {details.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">효과적인 단계:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {details.bestStages.map((stage, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {stage}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">전술:</span>
                          <p className="text-gray-600 ml-2">{details.tactics}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Stage-wise Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>구매여정 단계별 매체 전략</CardTitle>
            <CardDescription>각 단계별 우선순위 매체와 예산 배분</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(budgetData.stageAllocation || {}).map(([stage, allocation]) => (
                <Card key={stage} className="overflow-hidden">
                  <div 
                    className="h-2" 
                    style={{ backgroundColor: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] }}
                  />
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] }}
                      />
                      {stage}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {allocation.primaryChannels.map((channel, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {getChannelName(channel)}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">예산 배분</h5>
                        <div className="flex justify-center mb-3">
                          <div style={{ width: '150px', height: '150px' }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie
                                  data={Object.entries(allocation.allocation).map(([channel, percent]) => ({
                                    name: getChannelName(channel),
                                    value: percent,
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={25}
                                  outerRadius={60}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {Object.entries(allocation.allocation).map(([channel], index) => {
                                    const colorMap = {
                                      SA: '#3b82f6',
                                      DA: '#f97316',
                                      Social: '#ec4899',
                                      Content: '#10b981',
                                      Email: '#8b5cf6',
                                    };
                                    return (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={colorMap[channel as keyof typeof colorMap] || '#6b7280'} 
                                      />
                                    );
                                  })}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: number, name: string) => [`${value}%`, name]}
                                  contentStyle={{ fontSize: '11px' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(allocation.allocation).map(([channel, percent]) => (
                            <div key={channel} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getChannelColor(channel)}`} />
                                <span>{getChannelName(channel)}</span>
                              </div>
                              <span className="font-medium">{percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-1">전략</h5>
                        <p className="text-xs text-gray-600">{allocation.strategy}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInsightCard = (
    type: InsightType,
    icon: React.ReactNode,
    title: string,
    description: string
  ) => {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {insights[type] ? (
            <ScrollArea className="h-[400px] w-full">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {typeof insights[type] === 'string' ? insights[type] : JSON.stringify(insights[type], null, 2)}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Button
                onClick={() => generateInsight(type)}
                disabled={loadingInsight === type}
                className="flex items-center gap-2"
              >
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
              <p className="text-xs text-gray-500 mt-2">
                GPT-4.1을 활용하여 인사이트를 생성합니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          리포트 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            구매여정 분석 리포트
          </DialogTitle>
          <DialogDescription>
            키워드별 구매여정 단계 분석 결과와 AI 기반 인사이트를 확인하세요.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="charts" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              차트 분석
            </TabsTrigger>
            <TabsTrigger value="marketing" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              마케팅 인사이트
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              예산 배분
            </TabsTrigger>
            <TabsTrigger value="landing" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              랜딩 전략
            </TabsTrigger>
            <TabsTrigger value="da" className="text-xs">
              <Megaphone className="h-3 w-3 mr-1" />
              DA 광고
            </TabsTrigger>
            <TabsTrigger value="sa" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              SA 광고
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            {/* 구매여정별 비율 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>구매여정 단계별 비율</CardTitle>
                <CardDescription>
                  각 구매여정 단계별 비율을 확인할 수 있습니다.
                </CardDescription>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">지표 선택:</span>
                  <Select value={selectedMetric} onValueChange={(value: MetricType) => setSelectedMetric(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">키워드 개수</SelectItem>
                      <SelectItem value="searchTotal">검색수 합계</SelectItem>
                      <SelectItem value="searchPc">PC 검색수</SelectItem>
                      <SelectItem value="searchMobile">모바일 검색수</SelectItem>
                      <SelectItem value="clickTotal">클릭수 합계</SelectItem>
                      <SelectItem value="clickPc">PC 클릭수</SelectItem>
                      <SelectItem value="clickMobile">모바일 클릭수</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props) => {
                          const name = props.name || '';
                          const value = Number(props.value) || 0;
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const percent = (props as any).percent || 0;
                          return `${name}: ${formatNumber(value)} (${(Number(percent) * 100).toFixed(1)}%)`;
                        }}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        style={{ fontSize: '14px' }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatNumber(value), getMetricLabel(selectedMetric)]}
                        contentStyle={{ fontSize: '14px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '14px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 키워드 분포도 */}
            <Card>
              <CardHeader>
                <CardTitle>키워드 분포도 (PC vs 모바일)</CardTitle>
                <CardDescription>
                  PC와 모바일 데이터 기준으로 키워드 분포를 확인할 수 있습니다.
                </CardDescription>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">데이터 유형:</span>
                    <Select value={distributionType} onValueChange={(value: DistributionType) => setDistributionType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="search">검색수</SelectItem>
                        <SelectItem value="click">클릭수</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">구매여정:</span>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="문제 인식">문제 인식</SelectItem>
                        <SelectItem value="정보 탐색">정보 탐색</SelectItem>
                        <SelectItem value="대안 평가">대안 평가</SelectItem>
                        <SelectItem value="구매 결정">구매 결정</SelectItem>
                        <SelectItem value="구매 행동">구매 행동</SelectItem>
                        <SelectItem value="구매 후 행동">구매 후 행동</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6" style={{ height: '550px' }}>
                  {/* 스캐터 차트 */}
                  <div style={{ flex: '1', height: '100%' }}>
                    <ResponsiveContainer>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 100, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          dataKey="pc" 
                          name="PC"
                          label={{ value: `PC ${distributionType === 'search' ? '검색수' : '클릭수'}`, position: 'insideBottom', offset: -10, fontSize: 14 }}
                          tickFormatter={formatNumber}
                          style={{ fontSize: '14px' }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="mobile" 
                          name="Mobile"
                          label={{ value: `모바일 ${distributionType === 'search' ? '검색수' : '클릭수'}`, angle: -90, position: 'insideLeft', fontSize: 14 }}
                          tickFormatter={formatNumber}
                          style={{ fontSize: '14px' }}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow-lg text-xs">
                                  <p className="font-medium text-xs">{data.keyword}</p>
                                  <p className="text-xs text-gray-600">구매여정: {data.stage}</p>
                                  <p className="text-xs">PC: {formatNumber(data.pc)}</p>
                                  <p className="text-xs">모바일: {formatNumber(data.mobile)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {(selectedStage === 'all' ? BUYER_JOURNEY_STAGES : [selectedStage]).map(stage => {
                          const stageData = scatterData.filter(item => item.stage === stage);
                          return (
                            <Scatter
                              key={stage}
                              name={stage}
                              data={stageData}
                              fill={STAGE_COLORS[stage as keyof typeof STAGE_COLORS]}
                            />
                          );
                        })}
                        <Legend 
                          wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                          verticalAlign="bottom"
                          height={36}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Top 5 키워드 리스트 */}
                  <div className="w-80 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">
                      Top 5 키워드 ({distributionType === 'search' ? '검색수' : '클릭수'} 기준)
                    </h4>
                    <div className="space-y-3">
                      {top5Keywords.map((item, index) => (
                        <div key={item.keyword} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600 text-lg w-6 text-center">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-sm text-gray-800 truncate max-w-40" title={item.keyword}>
                                {item.keyword}
                              </p>
                              <span 
                                className="inline-block px-2 py-1 rounded text-xs font-medium mt-1"
                                style={{ 
                                  backgroundColor: STAGE_COLORS[item.stage as keyof typeof STAGE_COLORS] + '20',
                                  color: STAGE_COLORS[item.stage as keyof typeof STAGE_COLORS]
                                }}
                              >
                                {item.stage}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-600">
                            <p className="font-medium text-gray-800">
                              {formatNumber(item.total)}
                            </p>
                            <p>PC: {formatNumber(item.pc)}</p>
                            <p>MB: {formatNumber(item.mobile)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 요약 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>요약 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {keywords.filter(kw => kw.buyerJourney).length}
                    </div>
                    <div className="text-sm text-gray-600">분석된 키워드</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {BUYER_JOURNEY_STAGES.filter(stage => 
                        keywords.some(kw => kw.buyerJourney === stage)
                      ).length}
                    </div>
                    <div className="text-sm text-gray-600">활성 구매여정 단계</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(
                        keywords
                          .filter(kw => kw.buyerJourney)
                          .reduce((sum, kw) => 
                            sum + parseNumber(kw.monthlyPcQcCnt) + parseNumber(kw.monthlyMobileQcCnt), 0
                          )
                      )}
                    </div>
                    <div className="text-sm text-gray-600">총 검색량</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6">
            <ScrollArea className="h-[600px] w-full pr-4">
              {renderMarketingInsights()}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <ScrollArea className="h-[600px] w-full pr-4">
              {renderBudgetInsights()}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="landing" className="space-y-6">
            {renderInsightCard(
              'landing',
              <Globe className="h-4 w-4 text-purple-600" />,
              '랜딩 페이지 전략',
              '구매여정 단계별 최적화된 랜딩 페이지 전략을 제안합니다'
            )}
          </TabsContent>

          <TabsContent value="da" className="space-y-6">
            {renderInsightCard(
              'da',
              <Megaphone className="h-4 w-4 text-orange-600" />,
              'DA 광고 전략',
              '디스플레이 광고 전략과 광고 소재를 제안합니다'
            )}
          </TabsContent>

          <TabsContent value="sa" className="space-y-6">
            {renderInsightCard(
              'sa',
              <Search className="h-4 w-4 text-cyan-600" />,
              'SA 광고 전략',
              '검색 광고 전략과 광고 문구를 제안합니다'
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}