'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { FileText, BarChart3, Loader2, TrendingUp, DollarSign, Globe, Megaphone, Search, Target, Users, MessageSquare, BookOpen, Activity, Mail, Share2, Monitor, MousePointer, Layout, FileEdit, CheckCircle, Palette, RefreshCw, PenTool, Tag, Zap, Ban, Settings, X, Download } from 'lucide-react';
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

interface LandingInsight {
  stages: {
    [key: string]: {
      mainMessage: string[];
      essentialComponents: string[];
      ctaStrategy: string[];
      contentStructure: string[];
      conversionPoints: string[];
      keywords?: string[];
    };
  };
  summary: string;
}

interface DAInsight {
  stages: {
    [key: string]: {
      targeting: string[];
      messageDirection: string;
      visualConcept: string[];
      creatives: {
        headlines: string[];
        descriptions: string[];
      };
      remarketing: string;
      keywords?: string[];
    };
  };
  summary: string;
}

interface SAInsight {
  stages: {
    [key: string]: {
      keywordStrategy: string[];
      adCopy: {
        headlines: string[];
        descriptions: string[];
      };
      extensions: string[];
      biddingStrategy: string;
      negativeKeywords: string[];
      keywords?: string[];
    };
  };
  summary: string;
}

interface InsightData {
  marketing?: MarketingInsight | string;
  budget?: BudgetInsight | string;
  landing?: LandingInsight | string;
  da?: DAInsight | string;
  sa?: SAInsight | string;
}

export default function JourneyReport({ keywords }: JourneyReportProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('count');
  const [distributionType, setDistributionType] = useState<DistributionType>('search');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [insights, setInsights] = useState<InsightData>({});
  const [activeTab, setActiveTab] = useState('charts');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [regeneratingInsights, setRegeneratingInsights] = useState<Set<InsightType>>(new Set());

  const hasJourneyData = keywords.some(kw => kw.buyerJourney);

  const parseNumber = (value: string | number): number => {
    if (value === '<10') return 5;
    const stringValue = String(value);
    const num = parseFloat(stringValue.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const calculateStageData = useCallback(() => {
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
    
    return BUYER_JOURNEY_STAGES
      .map(stage => stageData[stage])
      .filter(stage => stage && stage.count > 0);
  }, [keywords]);

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

  const generateInsight = useCallback(async (type: InsightType, isRegeneration = false) => {
    if (isRegeneration) {
      setRegeneratingInsights(prev => new Set(prev).add(type));
    }
    
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
      if (isRegeneration) {
        setRegeneratingInsights(prev => {
          const newSet = new Set(prev);
          newSet.delete(type);
          return newSet;
        });
      }
    }
  }, [keywords, calculateStageData]);

  // keywords가 변경되면 인사이트 데이터 초기화
  useEffect(() => {
    setInsights({});
  }, [keywords]);

  // 팝업 열림 시 모든 인사이트를 병렬로 생성
  useEffect(() => {
    if (isDialogOpen && hasJourneyData) {
      const insightTypes: InsightType[] = ['marketing', 'budget', 'landing', 'da', 'sa'];
      
      // 병렬로 모든 인사이트 생성
      insightTypes.forEach(type => {
        generateInsight(type);
      });
    }
  }, [isDialogOpen, hasJourneyData, generateInsight]);

  const stageData = calculateStageData();
  const scatterData = getScatterData();
  const top5Keywords = getTop5Keywords();

  const pieData = stageData.map(stage => ({
    ...stage,
    value: stage[selectedMetric],
    fill: STAGE_COLORS[stage.name as keyof typeof STAGE_COLORS],
  }));

  if (!hasJourneyData) {
    return null;
  }

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

  // 커스텀 Legend 컴포넌트 - 구매여정 단계 순서대로 표시
  const CustomLegend = (props: { payload?: Array<{ value: string; color: string }> }) => {
    const { payload } = props;
    
    // BUYER_JOURNEY_STAGES 순서대로 정렬
    const sortedPayload = BUYER_JOURNEY_STAGES
      .map(stage => payload?.find((item) => item.value === stage))
      .filter(Boolean);
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {sortedPayload.map((entry, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-1">
            <span 
              className="inline-block w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry?.color }}
            />
            <span className="text-sm">{entry?.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  // HTML 리포트 다운로드 함수
  const downloadReport = () => {
    const htmlContent = generateHTMLReport();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `구매여정_분석_리포트_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // HTML 리포트 생성 함수
  const generateHTMLReport = () => {
    const stageDataHTML = stageData.map(stage => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; background-color: ${STAGE_COLORS[stage.name as keyof typeof STAGE_COLORS]}20;">
          ${stage.name}
        </td>
        <td style="border: 1px solid #ddd; padding: 8px;">${stage.count}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${formatNumber(stage.searchTotal)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${formatNumber(stage.clickTotal)}</td>
      </tr>
    `).join('');

    const top5KeywordsHTML = top5Keywords.map((item, index) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: #3b82f6;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.keyword}</td>
        <td style="border: 1px solid #ddd; padding: 8px; background-color: ${STAGE_COLORS[item.stage as keyof typeof STAGE_COLORS]}20;">${item.stage}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatNumber(item.total)}</td>
      </tr>
    `).join('');

    const generateInsightHTML = (insightData: unknown, type: string) => {
      if (!insightData) return '<p>인사이트가 아직 생성되지 않았습니다.</p>';

      if (type === 'marketing' && typeof insightData === 'object' && insightData !== null && 'stages' in insightData) {
        const marketingData = insightData as MarketingInsight;
        return Object.entries(marketingData.stages).map(([stageName, stageData]) => `
          <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: ${STAGE_COLORS[stageName as keyof typeof STAGE_COLORS]}; margin-bottom: 12px; display: flex; align-items: center;">
              <span style="width: 12px; height: 12px; background-color: ${STAGE_COLORS[stageName as keyof typeof STAGE_COLORS]}; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
              ${stageName}
            </h3>
            ${stageData.keywords ? `
              <div style="margin-bottom: 12px;">
                ${stageData.keywords.map((keyword: string) => `<span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 16px; font-size: 12px; margin-right: 4px; display: inline-block; margin-bottom: 4px;">${keyword}</span>`).join('')}
              </div>
            ` : ''}
            <div style="margin-bottom: 12px;">
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 4px;">🎯 주요 특징</h4>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">${stageData.characteristics}</p>
            </div>
            <div style="margin-bottom: 12px;">
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 4px;">👥 고객 니즈</h4>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">${stageData.customerNeeds}</p>
            </div>
            <div style="margin-bottom: 12px;">
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 4px;">💬 메시지 전략</h4>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">${stageData.messageStrategy}</p>
            </div>
            <div>
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 4px;">📖 콘텐츠 전략</h4>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">${stageData.contentStrategy}</p>
            </div>
          </div>
        `).join('');
      }

      if (type === 'budget') {
        const budgetData = tryParseJSON(insightData) as BudgetInsight;
        if (!budgetData) return '<p>예산 배분 데이터를 파싱할 수 없습니다.</p>';

        const overallHTML = Object.entries(budgetData.overallAllocation || {}).map(([channel, data]) => `
          <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px;">
            <h4 style="color: #374151; font-weight: 600; margin-bottom: 8px;">${channel}: ${data.percentage}%</h4>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">${data.description}</p>
          </div>
        `).join('');

        const stageHTML = Object.entries(budgetData.stageAllocation || {}).map(([stageName, stageData]) => `
          <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: ${STAGE_COLORS[stageName as keyof typeof STAGE_COLORS]}; margin-bottom: 12px;">
              <span style="width: 12px; height: 12px; background-color: ${STAGE_COLORS[stageName as keyof typeof STAGE_COLORS]}; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
              ${stageName}
            </h3>
            <div style="margin-bottom: 12px;">
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 8px;">주요 채널</h4>
              ${stageData.primaryChannels?.map((channel: string) => `<span style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px;">${channel}</span>`).join('') || ''}
            </div>
            <div style="margin-bottom: 12px;">
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 8px;">예산 배분</h4>
              ${Object.entries(stageData.allocation || {}).map(([channel, percent]) => `
                <div style="margin-bottom: 4px;">
                  <span style="color: #6b7280; font-size: 14px;">${channel}: ${percent}%</span>
                </div>
              `).join('')}
            </div>
            <div>
              <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 4px;">전략</h4>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">${stageData.strategy}</p>
            </div>
          </div>
        `).join('');

        return `
          <div style="margin-bottom: 32px;">
            <h3 style="color: #1f2937; margin-bottom: 16px;">💰 전체 예산 배분</h3>
            ${overallHTML}
          </div>
          <div>
            <h3 style="color: #1f2937; margin-bottom: 16px;">📊 단계별 예산 배분</h3>
            ${stageHTML}
          </div>
        `;
      }

      // 기타 인사이트 타입들도 비슷하게 처리
      return '<div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; color: #6b7280;"><p>해당 인사이트 내용을 표시할 수 없습니다.</p></div>';
    };

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>구매여정 분석 리포트</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section {
            background: white;
            margin-bottom: 24px;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #1f2937;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .tab-sections {
            display: flex;
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 24px;
            overflow-x: auto;
        }
        .tab-section {
            padding: 12px 16px;
            margin-right: 4px;
            background-color: #f3f4f6;
            border-radius: 6px 6px 0 0;
            font-weight: 600;
            color: #6b7280;
            font-size: 14px;
            white-space: nowrap;
        }
        .tab-section.active {
            background-color: #3b82f6;
            color: white;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        th {
            background-color: #f3f4f6;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border: 1px solid #d1d5db;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
        .tab-content {
            margin-bottom: 48px;
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .tab-section {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .tab-section:hover {
            background-color: #e5e7eb;
        }
        .two-column-table {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        @media (max-width: 768px) {
            .two-column-table {
                grid-template-columns: 1fr;
            }
        }
    </style>
    <script>
        function showTab(tabId) {
            // 모든 탭 콘텐츠 숨기기
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // 모든 탭 버튼 비활성화
            const tabButtons = document.querySelectorAll('.tab-section');
            tabButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            // 선택된 탭 콘텐츠 보이기
            document.getElementById(tabId).classList.add('active');
            
            // 선택된 탭 버튼 활성화
            event.target.classList.add('active');
        }
        
        // 페이지 로드 시 첫 번째 탭 활성화
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('charts-tab').classList.add('active');
        });
    </script>
</head>
<body>
    <div class="header">
        <h1>🔍 구매여정 분석 리포트</h1>
        <p>키워드별 구매여정 단계 분석 결과와 AI 기반 인사이트</p>
        <p><strong>생성일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tab-sections">
        <div class="tab-section active" onclick="showTab('charts-tab')">📊 차트 분석</div>
        <div class="tab-section" onclick="showTab('marketing-tab')">🎯 마케팅 인사이트</div>
        <div class="tab-section" onclick="showTab('budget-tab')">💰 예산 배분</div>
        <div class="tab-section" onclick="showTab('landing-tab')">🌐 랜딩 전략</div>
        <div class="tab-section" onclick="showTab('da-tab')">📢 DA 광고</div>
        <div class="tab-section" onclick="showTab('sa-tab')">🔍 SA 광고</div>
    </div>

    <!-- 차트 분석 탭 -->
    <div id="charts-tab" class="tab-content">
        <div class="section">
            <h2>📊 구매여정 단계별 통계</h2>
            <table>
                <thead>
                    <tr>
                        <th>구매여정 단계</th>
                        <th>키워드 개수</th>
                        <th>총 검색수</th>
                        <th>총 클릭수</th>
                    </tr>
                </thead>
                <tbody>
                    ${stageDataHTML}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🏆 Top 5 키워드</h2>
            <table>
                <thead>
                    <tr>
                        <th>순위</th>
                        <th>키워드</th>
                        <th>구매여정 단계</th>
                        <th>총 ${distributionType === 'search' ? '검색수' : '클릭수'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${top5KeywordsHTML}
                </tbody>
            </table>
        </div>
    </div>

    <!-- 마케팅 인사이트 탭 -->
    <div id="marketing-tab" class="tab-content">
        <div class="section">
            <h2>🎯 마케팅 인사이트</h2>
            ${generateInsightHTML(insights.marketing, 'marketing')}
            ${insights.marketing && typeof insights.marketing === 'object' && 'summary' in insights.marketing && insights.marketing.summary ? `
              <div style="margin-top: 24px; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <h3 style="color: #1e40af; margin-bottom: 8px;">💡 종합 인사이트</h3>
                <p style="color: #1e40af; margin: 0;">${insights.marketing.summary}</p>
              </div>
            ` : ''}
        </div>
    </div>

    <!-- 예산 배분 탭 -->
    <div id="budget-tab" class="tab-content">
        <div class="section">
            <h2>💰 예산 배분</h2>
            ${generateInsightHTML(insights.budget, 'budget')}
            ${insights.budget && tryParseJSON(insights.budget)?.summary ? `
              <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <h3 style="color: #047857; margin-bottom: 8px;">💡 예산 배분 종합 의견</h3>
                <p style="color: #047857; margin: 0;">${tryParseJSON(insights.budget).summary}</p>
              </div>
            ` : ''}
        </div>
    </div>

    <!-- 랜딩 전략 탭 -->
    <div id="landing-tab" class="tab-content">
        <div class="section">
            <h2>🌐 랜딩 전략</h2>
            ${generateInsightHTML(insights.landing, 'landing')}
        </div>
    </div>

    <!-- DA 광고 탭 -->
    <div id="da-tab" class="tab-content">
        <div class="section">
            <h2>📢 DA 광고</h2>
            ${generateInsightHTML(insights.da, 'da')}
        </div>
    </div>

    <!-- SA 광고 탭 -->
    <div id="sa-tab" class="tab-content">
        <div class="section">
            <h2>🔍 SA 광고</h2>
            ${generateInsightHTML(insights.sa, 'sa')}
        </div>
    </div>

    <div class="footer">
        <p>이 리포트는 AI 기반 키워드 분석 도구에서 생성되었습니다.</p>
    </div>
</body>
</html>`;
  };

  // JSON string을 파싱하여 객체로 변환하는 헬퍼 함수
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tryParseJSON = (data: any): any => {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch {
        // 파싱 실패 시 원본 string 반환
        return data;
      }
    }
    return data;
  };

  const renderMarketingInsights = () => {
    let marketingData = insights.marketing;
    
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
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">AI 인사이트 생성 중...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                GPT-4.1을 활용하여 마케팅 인사이트를 분석하고 있습니다
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // JSON 파싱 시도
    marketingData = tryParseJSON(marketingData);

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

    // 타입 가드: 이 시점에서 marketingData는 MarketingInsight 타입
    const typedMarketingData = marketingData as MarketingInsight;

    return (
      <div className="space-y-4">
        {/* Regenerate Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => generateInsight('marketing', true)}
            disabled={regeneratingInsights.has('marketing')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {regeneratingInsights.has('marketing') ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                인사이트 재생성
              </>
            )}
          </Button>
        </div>

        {/* Summary Card */}
        {typedMarketingData.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                전체 마케팅 인사이트 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {typedMarketingData.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stage-by-stage insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(typedMarketingData.stages || {}).map(([stage, data]) => (
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
    let budgetData = insights.budget;
    
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
              <div className="flex items-center gap-2 text-green-600">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">AI 인사이트 생성 중...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                GPT-4.1을 활용하여 예산 배분 전략을 분석하고 있습니다
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // JSON 파싱 시도
    budgetData = tryParseJSON(budgetData);

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

    // 타입 가드: 이 시점에서 budgetData는 BudgetInsight 타입
    const typedBudgetData = budgetData as BudgetInsight;

    const overallData = Object.entries(typedBudgetData.overallAllocation || {}).sort(
      ([, a], [, b]) => b.percentage - a.percentage
    );

    return (
      <div className="space-y-6">
        {/* Regenerate Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => generateInsight('budget', true)}
            disabled={regeneratingInsights.has('budget')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {regeneratingInsights.has('budget') ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                인사이트 재생성
              </>
            )}
          </Button>
        </div>

        {/* Summary */}
        {typedBudgetData.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
                예산 배분 전략 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {typedBudgetData.summary}
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
                  {Object.entries(typedBudgetData.channelDetails || {}).map(([channel, details]) => (
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
              {Object.entries(typedBudgetData.stageAllocation || {}).map(([stage, allocation]) => (
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

  const renderLandingInsights = () => {
    let landingData = insights.landing;
    
    if (!landingData) {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-4 w-4 text-purple-600" />
              랜딩 페이지 전략
            </CardTitle>
            <CardDescription>
              구매여정 단계별 최적화된 랜딩 페이지 전략을 제안합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[400px]">
              <div className="flex items-center gap-2 text-purple-600">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">AI 인사이트 생성 중...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                GPT-4.1을 활용하여 랜딩 페이지 전략을 분석하고 있습니다
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // JSON 파싱 시도
    landingData = tryParseJSON(landingData);

    if (typeof landingData === 'string') {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-4 w-4 text-purple-600" />
              랜딩 페이지 전략
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {landingData}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      );
    }

    // 타입 가드: 이 시점에서 landingData는 LandingInsight 타입
    const typedLandingData = landingData as LandingInsight;

    return (
      <div className="space-y-4">
        {/* Regenerate Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => generateInsight('landing', true)}
            disabled={regeneratingInsights.has('landing')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {regeneratingInsights.has('landing') ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                인사이트 재생성
              </>
            )}
          </Button>
        </div>

        {/* Summary Card */}
        {typedLandingData.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-4 w-4 text-purple-600" />
                랜딩 페이지 전략 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {typedLandingData.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>구매여정 단계별 랜딩 전략 요약</CardTitle>
            <CardDescription>각 단계별 핵심 전략을 한눈에 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-900">구매여정 단계</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">주요 메시지</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">필수 구성 요소</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">CTA 전략</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">전환 최적화 포인트</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(typedLandingData.stages || {}).map(([stage, data]) => (
                    <tr key={stage} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] }}
                          />
                          <span className="font-medium">{stage}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs">
                          {data.mainMessage[0] || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs">
                          {data.essentialComponents.slice(0, 2).join(', ') || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs">
                          <span className="inline-block px-2 py-1 bg-orange-50 text-orange-800 rounded text-xs">
                            {data.ctaStrategy[0] || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs">
                          {data.conversionPoints[0] || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stage-by-stage landing insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(typedLandingData.stages || {}).map(([stage, data]) => (
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
                  {/* 주요 메시지 */}
                  <div className="border-l-2 border-purple-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      주요 메시지
                    </h4>
                    <div className="space-y-2">
                      {data.mainMessage.map((msg, idx) => {
                        const stageColor = STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || '#3B82F6';
                        return (
                          <div 
                            key={idx} 
                            className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-r from-white to-gray-50 border-l-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                            style={{ borderLeftColor: stageColor }}
                          >
                            <div className="flex items-start gap-2">
                              <span 
                                className="text-lg font-bold leading-none mt-0.5"
                                style={{ color: stageColor }}
                              >
                                &ldquo;
                              </span>
                              <p className="text-sm font-medium text-gray-800 italic leading-relaxed flex-1">
                                {msg}
                              </p>
                              <span 
                                className="text-lg font-bold leading-none mt-auto"
                                style={{ color: stageColor }}
                              >
                                &rdquo;
                              </span>
                            </div>
                            <div 
                              className="absolute inset-0 opacity-5"
                              style={{ 
                                background: `linear-gradient(135deg, ${stageColor}20 0%, transparent 100%)` 
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 필수 구성 요소 */}
                  <div className="border-l-2 border-blue-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Layout className="h-4 w-4 text-blue-500" />
                      필수 구성 요소
                    </h4>
                    <ul className="space-y-1">
                      {data.essentialComponents.map((comp, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{comp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* CTA 전략 */}
                  <div className="border-l-2 border-orange-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-orange-500" />
                      CTA 전략
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.ctaStrategy.map((cta, idx) => {
                        const stageColor = STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || '#3B82F6';
                        return (
                          <button
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-white font-medium text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
                            style={{
                              background: `linear-gradient(135deg, ${stageColor} 0%, ${stageColor}dd 100%)`,
                            }}
                            disabled
                          >
                            <MousePointer className="h-3.5 w-3.5" />
                            {cta}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 콘텐츠 구성 */}
                  <div className="border-l-2 border-green-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <FileEdit className="h-4 w-4 text-green-500" />
                      콘텐츠 구성
                    </h4>
                    <ul className="space-y-1">
                      {data.contentStructure.map((content, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 전환 최적화 포인트 */}
                  <div className="border-l-2 border-indigo-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                      전환 최적화 포인트
                    </h4>
                    <ul className="space-y-1">
                      {data.conversionPoints.map((point, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-indigo-500 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderDAInsights = () => {
    const daData = insights.da;
    
    if (!daData) {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-4 w-4 text-orange-600" />
              DA 광고 전략
            </CardTitle>
            <CardDescription>
              디스플레이 광고 전략과 광고 소재를 제안합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[400px]">
              <div className="flex items-center gap-2 text-orange-600">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">AI 인사이트 생성 중...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                GPT-4.1을 활용하여 DA 광고 전략을 분석하고 있습니다
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // JSON 파싱 시도
    const parsedData = tryParseJSON(daData);
    
    // 파싱 실패 시 (여전히 문자열인 경우) 에러 상태 표시
    if (typeof parsedData === 'string') {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-4 w-4 text-orange-600" />
              DA 광고 전략
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <Ban className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 파싱 오류</h3>
                <p className="text-sm text-gray-500 mb-4">
                  AI 응답을 처리하는 중 문제가 발생했습니다.<br />
                  인사이트를 다시 생성해보세요.
                </p>
              </div>
              <Button
                onClick={() => generateInsight('da', true)}
                disabled={regeneratingInsights.has('da')}
                className="flex items-center gap-2"
              >
                {regeneratingInsights.has('da') ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    재생성 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    인사이트 재생성
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 성공적으로 파싱된 경우
    // 타입 가드: 이 시점에서 parsedData는 DAInsight 타입
    const typedDAData = parsedData as DAInsight;

    return (
      <div className="space-y-4">
        {/* Regenerate Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => generateInsight('da', true)}
            disabled={regeneratingInsights.has('da')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {regeneratingInsights.has('da') ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                인사이트 재생성
              </>
            )}
          </Button>
        </div>

        {/* Summary Card */}
        {typedDAData.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-4 w-4 text-orange-600" />
                DA 광고 전략 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {typedDAData.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>구매여정 단계별 DA 광고 전략 요약</CardTitle>
            <CardDescription>각 단계별 핵심 전략을 한눈에 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-900">구매여정 단계</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">타겟팅</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">메시지</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">헤드라인</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">리마케팅</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(typedDAData.stages || {}).map(([stage, data]) => (
                    <tr key={stage} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] }}
                          />
                          <span className="font-medium">{stage}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs text-xs">
                          {data.targeting[0] || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs text-xs">
                          {data.messageDirection.split('.')[0] || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs">
                          <span className="inline-block px-2 py-1 bg-orange-50 text-orange-800 rounded text-xs">
                            {data.creatives.headlines[0] || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs text-xs">
                          {data.remarketing.split('.')[0] || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stage-by-stage DA insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(typedDAData.stages || {}).map(([stage, data]) => (
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
                  {/* 타겟팅 전략 */}
                  <div className="border-l-2 border-blue-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      타겟팅 전략
                    </h4>
                    <ul className="space-y-1">
                      {data.targeting.map((target, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{target}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 메시지 방향 */}
                  <div className="border-l-2 border-purple-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      메시지 방향
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{data.messageDirection}</p>
                  </div>
                  
                  {/* 비주얼 컨셉 */}
                  <div className="border-l-2 border-green-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Palette className="h-4 w-4 text-green-500" />
                      비주얼 컨셉
                    </h4>
                    <ul className="space-y-1">
                      {data.visualConcept.map((concept, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{concept}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 광고 소재 */}
                  <div className="border-l-2 border-orange-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-orange-500" />
                      광고 소재 예시
                    </h4>
                    <div className="space-y-3">
                      {data.creatives.headlines.map((headline, idx) => {
                        const description = data.creatives.descriptions[idx] || '';
                        const stageColor = STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || '#3B82F6';
                        return (
                          <div 
                            key={idx} 
                            className="relative overflow-hidden border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            {/* 광고 배너 상단 색상 바 */}
                            <div 
                              className="h-1" 
                              style={{ backgroundColor: stageColor }}
                            />
                            
                            {/* 광고 콘텐츠 */}
                            <div className="p-4">
                              {/* 광고주 이름 (가상) */}
                              <div className="flex items-center gap-2 mb-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                  style={{ backgroundColor: stageColor }}
                                >
                                  AD
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Sponsored</p>
                                  <p className="text-xs font-medium text-gray-700">광고주명</p>
                                </div>
                              </div>
                              
                              {/* 헤드라인 */}
                              <h5 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">
                                {headline}
                              </h5>
                              
                              {/* 설명문구 */}
                              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                {description}
                              </p>
                              
                              {/* CTA 버튼 */}
                              <button 
                                className="w-full py-2 px-4 text-xs font-medium text-white rounded-md transition-colors duration-200"
                                style={{ 
                                  backgroundColor: stageColor,
                                  opacity: 0.9
                                }}
                                disabled
                              >
                                자세히 보기
                              </button>
                            </div>
                            
                            {/* 광고 표시 */}
                            <div className="absolute top-2 right-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
                              광고
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 리마케팅 전략 */}
                  <div className="border-l-2 border-red-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-red-500" />
                      리마케팅 전략
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{data.remarketing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSAInsights = () => {
    let saData = insights.sa;
    
    if (!saData) {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-4 w-4 text-cyan-600" />
              SA 광고 전략
            </CardTitle>
            <CardDescription>
              검색 광고 전략과 광고 문구를 제안합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[400px]">
              <div className="flex items-center gap-2 text-cyan-600">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">AI 인사이트 생성 중...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                GPT-4.1을 활용하여 SA 광고 전략을 분석하고 있습니다
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-cyan-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // JSON 파싱 시도
    saData = tryParseJSON(saData);

    if (typeof saData === 'string') {
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-4 w-4 text-cyan-600" />
              SA 광고 전략
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {saData}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      );
    }

    // 타입 가드: 이 시점에서 saData는 SAInsight 타입
    const typedSAData = saData as SAInsight;

    return (
      <div className="space-y-4">
        {/* Regenerate Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => generateInsight('sa', true)}
            disabled={regeneratingInsights.has('sa')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {regeneratingInsights.has('sa') ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                인사이트 재생성
              </>
            )}
          </Button>
        </div>

        {/* Summary Card */}
        {typedSAData.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-4 w-4 text-cyan-600" />
                SA 광고 전략 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {typedSAData.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>구매여정 단계별 SA 광고 전략 요약</CardTitle>
            <CardDescription>각 단계별 핵심 전략을 한눈에 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-900">구매여정 단계</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">키워드 전략</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">광고 제목</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">확장 전략</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">입찰 전략</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(typedSAData.stages || {}).map(([stage, data]) => (
                    <tr key={stage} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] }}
                          />
                          <span className="font-medium">{stage}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs text-xs">
                          {data.keywordStrategy[0] || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs">
                          <span className="inline-block px-2 py-1 bg-cyan-50 text-cyan-800 rounded text-xs">
                            {data.adCopy.headlines[0] || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs text-xs">
                          {data.extensions[0] || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-xs text-xs">
                          {data.biddingStrategy.split('.')[0] || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stage-by-stage SA insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(typedSAData.stages || {}).map(([stage, data]) => (
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
                  {/* 키워드 전략 */}
                  <div className="border-l-2 border-blue-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-500" />
                      키워드 그룹 전략
                    </h4>
                    <ul className="space-y-1">
                      {data.keywordStrategy.map((strategy, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 광고 문구 */}
                  <div className="border-l-2 border-cyan-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-cyan-500" />
                      광고 문구 예시
                    </h4>
                    <div className="space-y-2">
                      {/* Google Ads 스타일 광고 미리보기 */}
                      <div className="border rounded-lg p-3 bg-white shadow-sm">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">광고</span>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">www.example.com</p>
                          </div>
                        </div>
                        {data.adCopy.headlines.map((headline, idx) => (
                          <h5 key={idx} className="text-blue-700 font-medium text-sm hover:underline cursor-pointer mb-1">
                            {headline}
                          </h5>
                        ))}
                        {data.adCopy.descriptions.map((desc, idx) => (
                          <p key={idx} className="text-xs text-gray-700 leading-relaxed">
                            {desc}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* 광고 확장 */}
                  <div className="border-l-2 border-purple-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-purple-500" />
                      광고 확장 전략
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {data.extensions.map((ext, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                          {ext}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* 입찰 전략 */}
                  <div className="border-l-2 border-green-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      입찰 전략
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{data.biddingStrategy}</p>
                  </div>
                  
                  {/* 부정 키워드 */}
                  <div className="border-l-2 border-red-500 pl-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-500" />
                      부정 키워드
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {data.negativeKeywords.map((keyword, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded text-xs line-through">
                          {keyword}
                        </span>
                      ))}
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


  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          리포트 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            구매여정 분석 리포트
          </DialogTitle>
          <DialogDescription>
            키워드별 구매여정 단계 분석 결과와 AI 기반 인사이트를 확인하세요.
          </DialogDescription>
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={downloadReport}
              disabled={Object.keys(insights).length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              다운로드
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger 
              value="charts" 
              className={`text-xs ${activeTab === 'charts' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              차트 분석
            </TabsTrigger>
            <TabsTrigger 
              value="marketing" 
              className={`text-xs ${activeTab === 'marketing' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              마케팅 인사이트
            </TabsTrigger>
            <TabsTrigger 
              value="budget" 
              className={`text-xs ${activeTab === 'budget' ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              예산 배분
            </TabsTrigger>
            <TabsTrigger 
              value="landing" 
              className={`text-xs ${activeTab === 'landing' ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}`}
            >
              <Globe className="h-3 w-3 mr-1" />
              랜딩 전략
            </TabsTrigger>
            <TabsTrigger 
              value="da" 
              className={`text-xs ${activeTab === 'da' ? 'bg-orange-100 text-orange-700 border-orange-300' : ''}`}
            >
              <Megaphone className="h-3 w-3 mr-1" />
              DA 광고
            </TabsTrigger>
            <TabsTrigger 
              value="sa" 
              className={`text-xs ${activeTab === 'sa' ? 'bg-cyan-100 text-cyan-700 border-cyan-300' : ''}`}
            >
              <Search className="h-3 w-3 mr-1" />
              SA 광고
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            <ScrollArea className="h-[600px] w-full pr-4">
              <div className="space-y-6">
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
                      <Legend content={<CustomLegend />} />
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
                          content={<CustomLegend />}
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
              </div>
            </ScrollArea>
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
            <ScrollArea className="h-[600px] w-full pr-4">
              {renderLandingInsights()}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="da" className="space-y-6">
            <ScrollArea className="h-[600px] w-full pr-4">
              {renderDAInsights()}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sa" className="space-y-6">
            <ScrollArea className="h-[600px] w-full pr-4">
              {renderSAInsights()}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}