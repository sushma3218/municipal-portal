'use client';
import { useEffect, useState, use } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [complaint, setComplaint] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [message, setMessage] = useState('');
  const [fieldStaffList, setFieldStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));

    fetch(`/api/complaints/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setComplaint(data.complaint);
      if (data.fieldStaff) {
        setFieldStaffList(data.fieldStaff);
        if (data.fieldStaff.length > 0) setSelectedStaffId(data.fieldStaff[0].id);
      }
      setLoading(false);
    });
  }, [id]);

  const handleAction = async (actionType: string) => {
    try {
      // In a real app, assigning might open a modal to select a user. 
      // For MVP, we auto-assign to a hardcoded field staff for demo if action is ASSIGN.
      const body: any = { action: actionType, remarks: actionRemarks };
      
      if (actionType === 'ASSIGN') {
        body.assigned_to = selectedStaffId;
      } else if (actionType === 'SUBMIT_EVIDENCE') {
        body.photo_url = 'https://placehold.co/400x300/png?text=Resolved+Photo'; // Dummy photo
      } else if (actionType === 'SEND_MESSAGE') {
        body.staff_visit_date = visitDate;
        body.staff_contact = contactNumber;
        body.staff_message = message;
      }

      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Reload complaint
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <Layout><div className="text-center py-8">Loading...</div></Layout>;
  if (!complaint) return <Layout><div className="text-center py-8">Complaint not found</div></Layout>;

  const isOverdue = (complaint.status === 'ASSIGNED' || complaint.status === 'IN_PROGRESS') 
    ? new Date(complaint.created_at).getTime() + (3 * 24 * 60 * 60 * 1000) < Date.now()
    : false;

  const canForward = user?.role === 'RECEIVING_OFFICER' && complaint.status === 'SUBMITTED';
  const canAssign = user?.role === 'DEPT_HEAD' && (complaint.status === 'FORWARDED' || complaint.status === 'SUBMITTED');
  const canStartWork = ['FIELD_STAFF', 'ADMIN'].includes(user?.role) && complaint.status === 'ASSIGNED';
  const canSubmitEvidence = ['FIELD_STAFF', 'ADMIN'].includes(user?.role) && complaint.status === 'IN_PROGRESS';
  const canMessage = ['FIELD_STAFF', 'ADMIN'].includes(user?.role) && (complaint.status === 'ASSIGNED' || complaint.status === 'IN_PROGRESS');
  const canVerify = user?.role === 'DEPT_HEAD' && complaint.status === 'EVIDENCE_SUBMITTED';
  const canCitizenApprove = user?.role === 'CITIZEN' && complaint.status === 'CITIZEN_VERIFICATION';

  const hasActions = canForward || canAssign || canStartWork || canSubmitEvidence || canMessage || canVerify || canCitizenApprove;

  return (
    <Layout>
      <div className="mb-4">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-[var(--primary)] flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {user?.role === 'FIELD_STAFF' && complaint.dept_warning && (
        <div className="bg-red-100 border border-red-500 text-red-800 px-4 py-4 rounded mb-6 flex items-center justify-between shadow-sm animate-pulse" role="alert">
          <div>
            <strong className="font-bold text-lg block mb-1">⚠️ Urgent Message from Department Head:</strong>
            <span className="block text-xl font-bold uppercase">{complaint.dept_warning}</span>
          </div>
        </div>
      )}

      {user?.role === 'FIELD_STAFF' && isOverdue && !complaint.dept_warning && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-6 flex items-center justify-between" role="alert">
          <div>
            <strong className="font-bold">Overdue Alert: </strong>
            <span className="block sm:inline">This complaint has been open for more than 3 days. Please meet our office immediately.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded shadow border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold">{complaint.id}</h1>
                <p className="text-sm text-gray-500">{new Date(complaint.created_at).toLocaleString()}</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                {complaint.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Category</div>
                <div className="font-medium">{complaint.category?.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Department</div>
                <div className="font-medium">{complaint.category?.department?.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Location</div>
                <div className="font-medium">{complaint.location_text}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Priority</div>
                <div className="font-medium">{complaint.priority}</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs text-gray-400 font-bold uppercase mb-2">Description</div>
              <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-100">
                {complaint.description}
              </p>
            </div>

            {/* Display Field Staff Message to Citizen/Admin */}
            {(complaint.staff_message || complaint.staff_visit_date || complaint.staff_contact || ['DEPT_HEAD', 'ADMIN'].includes(user?.role)) && (
              <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-200">
                <div className="text-xs text-blue-800 font-bold uppercase mb-2">Update from Field Staff</div>
                <div className="text-sm text-blue-900 mb-1"><strong>Expected Visit Date:</strong> {complaint.staff_visit_date ? new Date(complaint.staff_visit_date).toLocaleDateString() : 'Not provided yet'}</div>
                <div className="text-sm text-blue-900 mb-1"><strong>Staff Contact:</strong> {complaint.staff_contact ? complaint.staff_contact : 'Not provided yet'}</div>
                {complaint.staff_message ? <p className="text-sm mt-2 text-blue-900 whitespace-pre-wrap border-t border-blue-200 pt-2">{complaint.staff_message}</p> : <p className="text-sm mt-2 text-blue-900 italic border-t border-blue-200 pt-2">No message provided yet.</p>}
              </div>
            )}

            {/* Citizen Phone Number (For Staff/Admin) */}
            {(user?.role === 'FIELD_STAFF' || user?.role === 'DEPT_HEAD' || user?.role === 'ADMIN') && complaint.citizen?.phone && (
               <div className="mb-6">
                 <div className="text-xs text-gray-400 font-bold uppercase mb-1">Citizen Contact</div>
                 <div className="font-medium text-gray-800">{complaint.citizen.phone}</div>
               </div>
            )}

            {complaint.media?.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase mb-2">Photos</div>
                <div className="flex gap-4">
                  {complaint.media.map((m: any) => (
                    <div key={m.id} className="relative w-32 h-32 bg-gray-200 rounded overflow-hidden flex items-center justify-center text-xs text-gray-500 border border-gray-300">
                      <img src={m.url} alt={`${m.type} PHOTO`} className="object-cover w-full h-full" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] p-1 text-center font-bold">
                        {m.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

            {hasActions && (
              <div className="bg-white p-6 rounded shadow border border-gray-100">
                <h2 className="text-lg font-bold mb-4">Action Panel</h2>
                
                <textarea 
                  className="w-full border border-[var(--border)] rounded px-3 py-2 focus:ring-[var(--primary)] focus:outline-none mb-4" 
                  rows={2} 
                  placeholder="Remarks (optional)"
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                />

                <div className="flex flex-wrap gap-2">
                  {canForward && (
                    <>
                      <Button onClick={() => handleAction('FORWARD')}>Forward to Dept</Button>
                      <Button variant="destructive" onClick={() => handleAction('REJECT')}>Reject</Button>
                    </>
                  )}

                  {canAssign && (
                    <div className="flex flex-col gap-2 w-full max-w-sm">
                      <label className="text-sm font-bold text-gray-700">Select Field Staff</label>
                      <select 
                        className="border border-gray-300 rounded p-2 focus:ring-[var(--primary)] focus:outline-none bg-white"
                        value={selectedStaffId}
                        onChange={e => setSelectedStaffId(e.target.value)}
                      >
                        {fieldStaffList.length === 0 && <option value="">No field staff available</option>}
                        {fieldStaffList.map(staff => (
                          <option key={staff.id} value={staff.id}>{staff.name}</option>
                        ))}
                      </select>
                      <Button onClick={() => handleAction('ASSIGN')} disabled={!selectedStaffId}>Assign to Field Staff</Button>
                    </div>
                  )}

                  {canStartWork && (
                    <Button onClick={() => handleAction('START_WORK')}>Start Work</Button>
                  )}

                  {canSubmitEvidence && (
                    <>
                      <Button onClick={() => handleAction('SUBMIT_EVIDENCE')}>Submit Resolution Evidence</Button>
                      <Button variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={() => handleAction('MARK_SOLVED')}>Mark as Solved</Button>
                    </>
                  )}

                  {canMessage && (
                    <div className="w-full border-t border-gray-200 mt-6 pt-6">
                      <h3 className="font-bold text-sm mb-4">Send Message to Citizen</h3>
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-xs text-gray-500 font-bold mb-1">Expected Visit Date</label>
                          <input type="date" className="w-full border border-gray-300 p-2 rounded focus:ring-[var(--primary)] focus:outline-none" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 font-bold mb-1">Contact Number (For Queries)</label>
                          <input type="text" className="w-full border border-gray-300 p-2 rounded focus:ring-[var(--primary)] focus:outline-none" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="e.g. 123-456-7890" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 font-bold mb-1">Message</label>
                          <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-[var(--primary)] focus:outline-none" rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Any additional information..." />
                        </div>
                      </div>
                      <Button onClick={() => handleAction('SEND_MESSAGE')}>Send Message</Button>
                    </div>
                  )}

                  {canVerify && (
                    <>
                      <Button onClick={() => handleAction('VERIFY_APPROVE')}>Approve & Request Citizen Verif.</Button>
                      <Button variant="destructive" onClick={() => handleAction('VERIFY_REJECT')}>Reject & Rework</Button>
                    </>
                  )}

                  {user?.role === 'DEPT_HEAD' && isOverdue && !complaint.dept_warning && (
                    <div className="w-full mt-4 pt-4 border-t border-red-200">
                      <Button variant="destructive" className="w-full animate-pulse bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => handleAction('WARN_STAFF')}>
                        ⚠️ Send Urgent Warning ("Come and meet us urgent")
                      </Button>
                    </div>
                  )}

                  {canCitizenApprove && (
                    <>
                      <Button onClick={() => handleAction('CITIZEN_APPROVE')}>Confirm Resolution</Button>
                      <Button variant="destructive" onClick={() => handleAction('CITIZEN_REJECT')}>Reject Resolution</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        <div className="bg-white p-6 rounded shadow border border-gray-100 self-start">
          <h2 className="text-lg font-bold mb-4">Audit Trail</h2>
          <div className="space-y-4">
            {complaint.audit_logs.map((log: any) => (
              <div key={log.id} className="relative pl-4 border-l-2 border-[var(--primary)] pb-4 last:pb-0">
                <div className="absolute w-2 h-2 bg-[var(--primary)] rounded-full -left-[5px] top-1"></div>
                <div className="text-xs text-gray-500 mb-1">{new Date(log.timestamp).toLocaleString()}</div>
                <div className="font-bold text-sm">{log.action}</div>
                <div className="text-xs text-gray-600 mt-1">{log.remarks}</div>
                <div className="text-xs text-gray-400 mt-1">by {log.actor?.name} ({log.actor?.role})</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
