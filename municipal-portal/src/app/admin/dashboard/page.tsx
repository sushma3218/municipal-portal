'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(data));

    fetch('/api/complaints', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setComplaints(data.complaints || []));
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      {stats?.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-8">Failed to load statistics: {stats.error}</div>
      )}

      {stats?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded shadow border border-[var(--primary)] text-center">
            <div className="text-4xl font-bold text-[var(--primary)] mb-2">{stats.overview.new}</div>
            <div className="text-sm text-gray-500 font-bold uppercase">New Complaints</div>
          </div>
          <div className="bg-white p-6 rounded shadow border border-blue-200 text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">{stats.overview.active}</div>
            <div className="text-sm text-gray-500 font-bold uppercase">Active</div>
          </div>
          <div className="bg-white p-6 rounded shadow border border-green-200 text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">{stats.overview.resolved}</div>
            <div className="text-sm text-gray-500 font-bold uppercase">Resolved</div>
          </div>
          <div className="bg-white p-6 rounded shadow border border-red-200 text-center">
            <div className="text-4xl font-bold text-red-500 mb-2">{stats.overview.overdue}</div>
            <div className="text-sm text-gray-500 font-bold uppercase">Overdue</div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-sm font-bold border-b border-gray-200">
              <th className="p-4">ID</th>
              <th className="p-4 w-20">Photo</th>
              <th className="p-4">Category</th>
              <th className="p-4">Location</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium">{c.id}</td>
                <td className="p-4">
                  {c.media && c.media.length > 0 ? (
                    <img src={c.media[0].url} alt="Complaint" className="w-12 h-12 object-cover rounded shadow border border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded border border-gray-200">No Img</div>
                  )}
                </td>
                <td className="p-4">{c.category?.name}</td>
                <td className="p-4 text-sm text-gray-600">{c.location_text}</td>
                <td className="p-4 text-xs font-bold">
                  <span className={c.priority === 'CRITICAL' ? 'text-red-600' : 'text-gray-500'}>{c.priority}</span>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    c.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                    c.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  <Button variant="outline" onClick={() => router.push(`/complaint/${c.id}`)}>View</Button>
                </td>
              </tr>
            ))}
            {complaints.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">No complaints found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
