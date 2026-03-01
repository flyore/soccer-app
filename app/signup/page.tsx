'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Role = 'player' | 'parent' | 'coach';

export default function SignupPage() {
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null);
    setMessage(null);
    if (!role) { setError('역할을 선택해 주세요.'); return; }
    if (!name) { setError('이름을 입력해 주세요.'); return; }
    if (!email || !password) { setError('이메일과 비밀번호를 입력해 주세요.'); return; }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }

    try {
      setLoading(true);
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } }
      });
      if (signupError) { setError(signupError.message); return; }
      setMessage('가입 완료! 이메일을 확인해 주세요.');
      setTimeout(() => { window.location.href = '/login'; }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-extrabold text-green-900 text-center mb-6">⚽ 회원가입</h1>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {(['player', 'parent', 'coach'] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`py-2 rounded-xl border font-semibold text-sm ${role === r ? 'bg-green-600 text-white' : 'text-green-900 border-green-200'}`}>
              {r === 'player' ? '선수' : r === 'parent' ? '부모' : '코치'}
            </button>
          ))}
        </div>

        <input type="text" placeholder="이름" value={name} onChange={e => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}

        <button onClick={handleSignup} disabled={loading}
          className="w-full py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 mb-3">
          {loading ? '가입 중...' : '회원가입'}
        </button>

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-green-600 font-semibold">로그인</a>
        </p>
      </div>
    </div>
  );
}
