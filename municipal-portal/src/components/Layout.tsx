'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Home, List, Shield } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Please login...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-black">
      <header className="bg-[var(--primary)] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => router.push(user.role === 'CITIZEN' ? '/dashboard' : '/admin/dashboard')}>
            <Shield className="w-6 h-6" />
            NagarMitra
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="text-xs sm:text-sm hidden sm:inline">Welcome, {user.name} ({user.role})</span>
            <button onClick={handleLogout} className="flex items-center gap-1 hover:text-gray-200 transition-colors text-xs sm:text-sm bg-blue-700/50 sm:bg-transparent p-1.5 sm:p-0 rounded">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
