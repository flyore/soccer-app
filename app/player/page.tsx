'use client';

export default function PlayerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-green-50 to-gray-50 pt-12 px-6 pb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider">선수 ID: #KR-001</p>
        <h1 className="text-2xl font-bold text-gray-900">김선수</h1>
      </div>

      {/* 레벨 카드 */}
      <div className="px-6 mt-2">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center text-3xl">⚽</div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-green-600">레벨 1</span>
                <span className="text-xs text-gray-400">0 / 500 XP</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-green-500 rounded-full" style={{width: '0%'}}></div>
              </div>
              <div className="flex gap-4 mt-3 text-center">
                <div><p className="text-xs text-gray-400">속도</p><p className="font-bold">-</p></div>
                <div><p className="text-xs text-gray-400">기술</p><p className="font-bold">-</p></div>
                <div><p className="text-xs text-gray-400">파워</p><p className="font-bold">-</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 컨디션 체크 */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3">💚 오늘 컨디션</h2>
          <p className="text-sm text-gray-500 text-center mb-4">오늘 기분은 어때?</p>
          <div className="flex justify-between px-2">
            {[
              { emoji: '😫', label: '피곤함' },
              { emoji: '😐', label: '보통' },
              { emoji: '🔥', label: '좋음' },
              { emoji: '🤕', label: '부상' },
            ].map((item) => (
              <button key={item.label} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl hover:bg-green-100 transition-colors border-2 border-transparent hover:border-green-400">
                  {item.emoji}
                </div>
                <span className="text-xs text-gray-400">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 오늘의 퀘스트 */}
      <div className="px-6 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-gray-800">⚡ 오늘의 퀘스트</h2>
          <span className="text-xs text-green-600 font-medium">전체보기</span>
        </div>
        <div className="space-y-3">
          {[
            { icon: '⚽', title: '100회 리프팅 도전', tag: '기술 훈련', xp: 50, color: 'border-purple-400' },
            { icon: '🏃', title: '아침 스트레칭 10분', tag: '피지컬', xp: 20, color: 'border-blue-400' },
            { icon: '📺', title: '전술 영상 시청', tag: '전술 공부', xp: 30, color: 'border-yellow-400' },
          ].map((quest) => (
            <div key={quest.title} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${quest.color} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">{quest.icon}</div>
                <div>
                  <p className="font-bold text-sm">{quest.title}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{quest.tag}</span>
                    <span className="text-xs font-bold text-green-600">+{quest.xp} XP</span>
                  </div>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-green-500 hover:text-white flex items-center justify-center transition-colors text-gray-400">
                ✓
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {[
            { icon: '🏠', label: '홈', active: true },
            { icon: '💪', label: '훈련' },
            { icon: '🏆', label: '랭킹' },
            { icon: '👤', label: '프로필' },
          ].map((tab) => (
            <button key={tab.label} className={`flex flex-col items-center gap-1 ${tab.active ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}