import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-xl font-bold text-gray-900">
            GPT코리아 키워드 분석 도구
          </Link>
        </div>

        <nav className="flex items-center space-x-6">
          <Link 
            href="/" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            키워드 분석
          </Link>
          <Link 
            href="/history" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            검색 기록
          </Link>
          <Link 
            href="/settings" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            설정
          </Link>
        </nav>
      </div>
    </header>
  )
}