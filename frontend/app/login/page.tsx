'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [registered, setRegistered] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [msgKind, setMsgKind] = useState<'error' | 'success'>('error');

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [simCode, setSimCode] = useState<string>('');

  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password]);
  const canForgotSend = useMemo(() => forgotEmail.trim(), [forgotEmail]);
  const canForgotSubmit = useMemo(
    () => forgotEmail.trim() && forgotCode.trim() && forgotNewPassword.trim(),
    [forgotEmail, forgotCode, forgotNewPassword],
  );

  useEffect(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('registered') === '1';
      setRegistered(v);
    } catch {
      setRegistered(false);
    }
  }, []);

  const openForgot = () => {
    setForgotOpen(true);
    setForgotMsg('');
    setForgotEmail(email.trim());
    setForgotCode('');
    setForgotNewPassword('');
    setSimCode('');
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotMsg('');
    setForgotCode('');
    setForgotNewPassword('');
    setSimCode('');
  };

  const sendForgotCode = () => {
    setForgotMsg('');
    const target = forgotEmail.trim();
    if (!target) {
      setForgotMsg('Email wajib diisi.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSimCode(code);
    setForgotMsg('Kode verifikasi telah dikirim (simulasi).');
  };

  const submitForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg('');
    if (!canForgotSubmit) return;
    if (!simCode) {
      setForgotMsg('Silakan kirim kode terlebih dahulu.');
      return;
    }
    if (forgotCode.trim() !== simCode) {
      setForgotMsg('Kode verifikasi tidak sesuai.');
      return;
    }
    // Simulasi sukses (tanpa backend/email sungguhan).
    closeForgot();
    setMsg('Password berhasil diubah (simulasi). Silakan login kembali.');
    setMsgKind('success');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMsg('');
    setMsgKind('error');
    try {
      const res = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.detail || 'Login gagal.');
        return;
      }
      try {
        window.localStorage.setItem('mixindo_auth_email', email.trim());
        // Reuse actor username for audit headers.
        window.localStorage.setItem('mixindo_actor_username', (data.actor_username || email.trim()) as string);
      } catch {
        // ignore
      }
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-white rounded-xl p-2 ring-1 ring-gray-200 shadow-sm">
              <Image src="/mixindo-logo.jpeg" alt="Mixindo" width={44} height={44} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-gray-900">PT Mixindo Abadi Karya</div>
              <div className="text-xs text-gray-500">Sistem Informasi Proyek Terintegrasi</div>
            </div>
          </div>

          <div className="mb-5">
            <div className="text-xl font-bold text-gray-900">Login</div>
            <div className="text-sm text-gray-500">Masuk menggunakan akun yang sudah didaftarkan</div>
            {registered ? <div className="mt-2 text-xs text-green-700">Registrasi berhasil. Silakan login.</div> : null}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoComplete="current-password"
              />
            </div>

            {msg ? (
              <div className={`text-xs ${msgKind === 'success' ? 'text-green-700' : 'text-red-700'}`}>{msg}</div>
            ) : null}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={openForgot}
                className="text-xs text-blue-700 hover:underline font-medium"
              >
                Lupa kata sandi?
              </button>
              <span className="text-[11px] text-gray-400">Masuk untuk melanjutkan</span>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || busy}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300"
            >
              {busy ? 'Memproses...' : 'Login'}
            </button>

            <div className="text-xs text-gray-500 text-center">
              Belum punya akun?{' '}
              <Link href="/register" className="text-blue-700 hover:underline">
                Hubungi admin
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center text-[11px] text-gray-400">© {new Date().getFullYear()} PT Mixindo Abadi Karya</div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl text-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Lupa Kata Sandi</h2>
              <button onClick={closeForgot} className="text-gray-400 hover:text-gray-700 text-xl font-bold" aria-label="Tutup">
                ✕
              </button>
            </div>

            <form onSubmit={submitForgot} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email"
                  className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoComplete="email"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Kode</label>
                  <input
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="Kode"
                    className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    inputMode="numeric"
                  />
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={sendForgotCode}
                    disabled={!canForgotSend}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50"
                  >
                    Kirim kode
                  </button>
                </div>
              </div>

              {simCode ? (
                <div className="text-[11px] text-gray-500">
                  Kode (simulasi): <span className="font-semibold text-gray-700">{simCode}</span>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-gray-700">Password baru</label>
                <input
                  type="password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Password baru"
                  className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoComplete="new-password"
                />
              </div>

              {forgotMsg ? <div className="text-xs text-gray-600">{forgotMsg}</div> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForgot} className="px-4 py-2 text-gray-500">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!canForgotSubmit}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
