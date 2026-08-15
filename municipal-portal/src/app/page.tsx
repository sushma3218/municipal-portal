'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@/components/ui';
import { Shield, User, Building } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [userType, setUserType] = useState<'NONE' | 'CUSTOMER' | 'CORPORATION'>('NONE');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('FIELD_STAFF');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const finalRole = userType === 'CUSTOMER' ? 'CITIZEN' : role;
    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password, role: finalRole } 
      : { email, password, name, phone, role: finalRole };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'CITIZEN') {
        router.push('/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (userType === 'NONE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 text-[var(--primary)] mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">NagarMitra</h1>
            <p className="text-lg text-gray-500">Public Grievance Management System</p>
          </div>
          
          <h2 className="text-2xl font-semibold text-center mb-8">Select your account type to continue</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setUserType('CUSTOMER')}
              className="bg-white p-8 rounded-xl shadow-md border-2 border-transparent hover:border-[var(--primary)] transition-all flex flex-col items-center text-center group"
            >
              <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
                <User className="w-12 h-12 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Customer / Citizen</h3>
              <p className="text-gray-500">I want to submit or track a grievance</p>
            </button>

            <button 
              onClick={() => setUserType('CORPORATION')}
              className="bg-white p-8 rounded-xl shadow-md border-2 border-transparent hover:border-[var(--primary)] transition-all flex flex-col items-center text-center group"
            >
              <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
                <Building className="w-12 h-12 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Corporation / Faculty</h3>
              <p className="text-gray-500">I am a staff member managing grievances</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-[var(--primary)] mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">
            {userType === 'CUSTOMER' ? 'Citizen Portal' : 'Faculty Portal'}
          </h1>
          <p className="text-sm text-gray-500">
            {isLogin ? 'Sign in to your account' : 'Register for a new account'}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label>Full Name</Label>
                <Input required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <Label>Email Address</Label>
            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          {userType === 'CORPORATION' && (
            <div>
              <Label>Position / Role</Label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-[var(--primary)] focus:ring focus:ring-[var(--primary)] focus:ring-opacity-50 h-10 px-3 border bg-white"
              >
                <option value="FIELD_STAFF">Field Staff</option>
                <option value="DEPT_HEAD">Department Head</option>
                <option value="RECEIVING_OFFICER">Receiving Officer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          )}
          
          <Button type="submit" className="w-full mt-6">
            {isLogin ? 'Sign In' : 'Register Account'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[var(--primary)] hover:underline font-medium">
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </button>
          <button onClick={() => setUserType('NONE')} className="text-gray-500 hover:text-gray-700 hover:underline">
            ← Back to account type selection
          </button>
        </div>
      </div>
    </div>
  );
}
