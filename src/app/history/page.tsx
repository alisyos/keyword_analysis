'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>검색 기록</CardTitle>
          <CardDescription>
            이전에 검색한 키워드 기록을 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-16 text-center text-gray-500">
          검색 기록이 없습니다.
        </CardContent>
      </Card>
    </div>
  );
}