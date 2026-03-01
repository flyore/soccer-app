'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Condition = '피곤함' | '보통' | '좋음' | '부상' | null;

type Mission = {
  id: string;
  title: string;
  description: string;
  type: string;
  reward_points: number;
};

type UserMission = {
  id: string;
  mission_id: string;
  status: string;
};

export default function PlayerDashboard() {
  const [userName, setUserName] = useState('선수');
  const [userId, setUserId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition>(null);
  const [attendanceDone, setAttendanceDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const saveMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 퀘스트 상태
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());
  const [questLoading, setQuestLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // 퀘스트 아이콘/색상 매핑 (title 키워드 기반)
  const getQuestStyle = (title: string) => {
    if (title.includes('훈련')) return { icon: '⚽', color: 'border-purple-400', tag: '기술 훈련' };
    if (title.includes('컨디션')) return { icon: '💚', color: 'border-green-400', tag: '컨디션' };
    if (title.includes('출석')) return { icon: '📍', color: 'border-blue-400', tag: '출석' };
    if (title.includes('스트레칭') || title.includes('피지컬')) return { icon: '🏃', color: 'border-blue-400', tag: '피지컬' };
    if (title.includes('영상') || title.includes('전술')) return { icon: '📺', color: 'border-yellow-400', tag: '전술 공부' };
    return { icon: '⚡', color: 'border-gray-400', tag: '미션' };
  };

  // 1. 유저 정보 + 오늘 데이터 불러오기
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setUserId(user.id);

      // 프로필 이름
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile) setUserName(profile.full_name);

      // players 테이블에서 player id 조회
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (player) {
        setPlayerId(player.id);

        // 오늘 출석 확인
        const { data: att } = await supabase
          .from('attendance')
          .select('id')
          .eq('player_id', player.id)
          .eq('date', today)
          .single();
        if (att) setAttendanceDone(true);

        // 오늘 컨디션 확인
        const { data: checkin } = await supabase
          .from('daily_checkins')
          .select('condition_score')
          .eq('player_id', player.id)
          .eq('date', today)
          .single();
        if (checkin) {
          const map: Record<number, Condition> = { 1: '피곤함', 2: '보통', 3: '좋음', 0: '부상' };
          setCondition(map[checkin.condition_score]);
        }

        // 퀘스트 불러오기
        await loadMissions(user.id);
      }

      setLoading(false);
    };
    init();
  }, []);

  // 미션 + 완료 상태 불러오기
  const loadMissions = async (uid: string) => {
    setQuestLoading(true);

    // daily 미션 전체
    const { data: missionData } = await supabase
      .from('missions')
      .select('*')
      .eq('type', 'daily');

    if (missionData) setMissions(missionData);

    // 오늘 완료된 미션 (completed_at 기준 오늘 날짜)
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;

    const { data: userMissionData } = await supabase
      .from('user_missions')
      .select('mission_id, status')
      .eq('user_id', uid)
      .eq('status', 'completed')
      .gte('completed_at', todayStart)
      .lte('completed_at', todayEnd);

    if (userMissionData) {
      setCompletedMissionIds(new Set(userMissionData.map((um) => um.mission_id)));
    }

    setQuestLoading(false);
  };

  // 2. 출석 체크
  const handleAttendance = async () => {
    if (attendanceDone || !playerId) return;
    const { error } = await supabase
      .from('attendance')
      .insert({ player_id: playerId, date: today, status: 'present' });
    if (!error) {
      setAttendanceDone(true);
      showMsg('✅ 출석 완료!');
    }
  };

  // 3. 컨디션 저장 (버그 수정: condition이 이미 있으면 return)
  const handleCondition = async (selected: Condition) => {
    if (!playerId || condition !== null) return; // ← 버그 수정
    const scoreMap: Record<string, number> = { '피곤함': 1, '보통': 2, '좋음': 3, '부상': 0 };
    const { error } = await supabase
      .from('daily_checkins')
      .upsert({
        player_id: playerId,
        date: today,
        condition_score: scoreMap[selected!],
      }, { onConflict: 'player_id,date' });
    if (!error) {
      setCondition(selected);
      showMsg('💚 컨디션 저장됨!');
    }
  };

  // 4. 퀘스트 완료 처리
  const handleQuestComplete = async (missionId: string) => {
    if (!userId || completedMissionIds.has(missionId)) return;

    const { error } = await supabase
      .from('user_missions')
      .insert({
        user_id: userId,
        mission_id: missionId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

    if (!error) {
      setCompletedMissionIds((prev) => new Set([...prev, missionId]));
      showMsg('⚡ 퀘스트 완료!');
    }
  };

  const showMsg = useCallback((msg: string) => {
    if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current);
    setSaveMsg(msg);
    saveMsgTimer.current = setTimeout(() => setSaveMsg(null), 2000);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">불러오는 중...</p>
    </div>
  );

  const completedCount = completedMissionIds.size;
  const totalCount = missions.length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-green-50 to-gray-50 pt-12 px-6 pb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider">GROWL 🦁</p>
        <h1 className="text-2xl font-bold text-gray-900">{userName}</h1>
      </div>

      {/* 출석 체크 */}
      <div className="px-6 mt-4">
        <button
          onClick={handleAttendance}
          disabled={attendanceDone}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-sm transition-all ${
            attendanceDone
              ? 'bg-green-100 text-green-600 border border-green-200'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {attendanceDone ? '✅ 오늘 출석 완료!' : '📍 출석 체크하기'}
        </button>
      </div>

      {/* 컨디션 체크 */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3">💚 오늘 컨디션</h2>
          {condition ? (
            <p className="text-center text-green-600 font-bold py-2">
              {condition === '피곤함' ? '😫' : condition === '보통' ? '😐' : condition === '좋음' ? '🔥' : '🤕'} {condition} 저장됨
            </p>
          ) : (
            <div className="flex justify-between px-2">
              {[
                { emoji: '😫', label: '피곤함' },
                { emoji: '😐', label: '보통' },
                { emoji: '🔥', label: '좋음' },
                { emoji: '🤕', label: '부상' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleCondition(item.label as Condition)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl hover:bg-green-100 transition-colors border-2 border-transparent hover:border-green-400">
                    {item.emoji}
                  </div>
                  <span className="text-xs text-gray-400">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 오늘의 퀘스트 */}
      <div className="px-6 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-gray-800">⚡ 오늘의 퀘스트</h2>
          {!questLoading && totalCount > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {completedCount}/{totalCount} 완료
            </span>
          )}
        </div>

        {questLoading ? (
          <p className="text-center text-gray-400 text-sm py-4">퀘스트 불러오는 중...</p>
        ) : missions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">오늘의 퀘스트가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {missions.map((mission) => {
              const isDone = completedMissionIds.has(mission.id);
              const style = getQuestStyle(mission.title);
              return (
                <div
                  key={mission.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${style.color} flex items-center justify-between transition-opacity ${isDone ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                      {isDone ? '✅' : style.icon}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isDone ? 'line-through text-gray-400' : ''}`}>
                        {mission.title}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{style.tag}</span>
                        <span className="text-xs font-bold text-green-600">+{mission.reward_points} XP</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuestComplete(mission.id)}
                    disabled={isDone}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-gray-100 hover:bg-green-500 hover:text-white text-gray-400'
                    }`}
                  >
                    ✓
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 저장 메시지 */}
      {saveMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm z-50">
          {saveMsg}
        </div>
      )}

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