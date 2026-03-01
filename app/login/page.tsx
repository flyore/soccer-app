'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    try {
      setLoading(true);

      // 1. 로그인
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      // 2. DB에서 role 조회
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single();

      if (profileError || !profile) {
        setError('프로필 정보를 불러올 수 없습니다.');
        return;
      }

      // 3. role에 따라 대시보드 이동
      const roleMap: Record<string, string> = {
        player: '/player',
        parent: '/parent',
        coach: '/coach',
      };
      window.location.href = roleMap[profile.role] ?? '/login';

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-extrabold text-green-900 text-center mb-2">🦁 GROWL</h1>
        <p className="text-center text-green-700 text-sm mb-6">유소년 축구 습관 앱</p>

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50 mb-3"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <p className="text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <a href="/signup" className="text-green-600 font-semibold">회원가입</a>
        </p>
      </div>
    </div>
  );
}
