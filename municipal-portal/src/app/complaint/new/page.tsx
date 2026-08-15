'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button, Input, Label } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function NewComplaint() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    location_text: '',
    photo_url: '', // will be filled with base64 or left empty
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(data => {
      setCategories(data.categories || []);
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Deliberate defect: We don't check for empty description here. The API should ideally block it, 
    // but we can let it slip or block it. Actually, the prompt says:
    // "Empty complaint descriptions must be rejected. Introduce a bug that allows an empty description."
    // The API `!description` check will block it unless we introduced a bug in the API. 
    // Let's assume the API already blocks it, we will just pass it to API. Wait, I should make sure the API has the bug for the AI QA Requirement!
    // I will modify the API later to introduce the bug.

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow border border-gray-100">
        <h1 className="text-2xl font-bold mb-6">Report a Civic Issue</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Category</Label>
            <select 
              required 
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              value={formData.category_id}
              onChange={e => setFormData({...formData, category_id: e.target.value})}
            >
              <option value="">Select an issue...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.department.name})</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Location / Landmark</Label>
            <Input required placeholder="e.g. Near Central Park Gate 2" value={formData.location_text} onChange={e => setFormData({...formData, location_text: e.target.value})} />
          </div>

          <div>
            <Label>Description</Label>
            <textarea 
              className="w-full border border-[var(--border)] rounded px-3 py-2 focus:ring-[var(--primary)] focus:outline-none" 
              rows={4} 
              placeholder="Describe the issue..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <Label>Upload Photograph</Label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[var(--primary)] hover:file:bg-blue-100" 
            />
            {isUploading && <p className="text-xs text-blue-500 mt-1">Processing image...</p>}
            {formData.photo_url && !isUploading && <p className="text-xs text-green-600 mt-1">Image attached successfully!</p>}
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isUploading}>Submit Grievance</Button>
        </form>
      </div>
    </Layout>
  );
}
