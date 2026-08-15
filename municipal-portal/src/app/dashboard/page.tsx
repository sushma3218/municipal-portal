'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { PlusCircle, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

export default function CitizenDashboard() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/complaints', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setComplaints(data.complaints || []);
      setLoading(false);
    });
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Complaints</h1>
        <Button onClick={() => router.push('/complaint/new')} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          New Complaint
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : complaints.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center text-gray-500 border border-gray-100">
          You haven't submitted any complaints yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {complaints.map(c => (
            <div key={c.id} onClick={() => router.push(`/complaint/${c.id}`)} className="bg-white p-5 rounded shadow border border-gray-100 hover:border-blue-300 cursor-pointer transition-colors flex justify-between items-center">
              <div className="flex gap-4">
                {c.media && c.media.length > 0 ? (
                  <img src={c.media[0].url} alt="Issue" className="w-16 h-16 object-cover rounded shadow-sm border border-gray-200 flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 rounded border border-gray-200 flex-shrink-0">No Img</div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg">{c.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      c.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                      c.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1">{c.category?.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {c.location_text}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">{new Date(c.created_at).toLocaleDateString()}</div>
                <div className={`text-xs font-bold ${c.priority === 'CRITICAL' ? 'text-red-600' : 'text-gray-500'}`}>{c.priority} PRIORITY</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
