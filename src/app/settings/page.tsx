'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>API 설정</CardTitle>
          <CardDescription>
            네이버 Search Ad API 인증 정보를 설정합니다.
            Vercel 환경 변수로 설정하는 것을 권장합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <Input type="password" placeholder="NAVER_API_KEY" disabled />
            <p className="text-xs text-gray-500 mt-1">환경 변수로 설정됨</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Secret Key</label>
            <Input type="password" placeholder="NAVER_SECRET_KEY" disabled />
            <p className="text-xs text-gray-500 mt-1">환경 변수로 설정됨</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Customer ID</label>
            <Input type="text" placeholder="NAVER_CUSTOMER_ID" disabled />
            <p className="text-xs text-gray-500 mt-1">환경 변수로 설정됨</p>
          </div>
          <div className="pt-4">
            <Button disabled>설정 저장</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>사용 방법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">1. 네이버 광고 관리 시스템 가입</h3>
            <p className="text-gray-600">
              <a href="http://searchad.naver.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                http://searchad.naver.com
              </a>
              에서 가입하세요.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. API 라이선스 발급</h3>
            <p className="text-gray-600">
              <a href="http://manage.searchad.naver.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                http://manage.searchad.naver.com
              </a>
              에서 도구 → API 관리자로 이동하여 API 라이선스를 생성하세요.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. 환경 변수 설정</h3>
            <p className="text-gray-600">
              Vercel 대시보드에서 다음 환경 변수를 설정하세요:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-600">
              <li>NAVER_API_KEY: API 라이선스 키</li>
              <li>NAVER_SECRET_KEY: 시크릿 키</li>
              <li>NAVER_CUSTOMER_ID: 고객 ID</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}