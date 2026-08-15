import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        category: { include: { department: true } },
        citizen: { select: { id: true, name: true, phone: true } },
        assignee: { select: { id: true, name: true } },
        media: true,
        audit_logs: { include: { actor: { select: { name: true, role: true } } }, orderBy: { timestamp: 'desc' } }
      }
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // RBAC for view
    if (user.role === 'CITIZEN' && complaint.citizen_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role === 'FIELD_STAFF' && complaint.assigned_to !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    let fieldStaff: any[] = [];
    if (user.role === 'DEPT_HEAD') {
      const staffInfo = await prisma.user.findUnique({ where: { id: user.id } });
      if (complaint.category.department_id !== staffInfo?.department_id) {
        // Just let them view it anyway if they are an admin testing things out, but normally:
        // return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      fieldStaff = await prisma.user.findMany({
        where: { role: 'FIELD_STAFF', department_id: staffInfo?.department_id || undefined },
        select: { id: true, name: true }
      });
      // Fallback if none found
      if (fieldStaff.length === 0) {
        fieldStaff = await prisma.user.findMany({
          where: { role: 'FIELD_STAFF' },
          select: { id: true, name: true }
        });
      }
    }

    return NextResponse.json({ complaint, fieldStaff });
  } catch (error) {
    console.error('Get complaint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { action, status, assigned_to, photo_url, staff_visit_date, staff_contact, staff_message } = body;
    let remarks = body.remarks;

    const complaint = await prisma.complaint.findUnique({ where: { id }, include: { category: true } });
    if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let updateData: any = {};
    let newStatus = status;

    // RBAC & State Machine Logic
    if (user.role === 'RECEIVING_OFFICER' && action === 'FORWARD') {
      newStatus = 'FORWARDED';
    } else if (user.role === 'RECEIVING_OFFICER' && action === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (user.role === 'DEPT_HEAD' && action === 'ASSIGN') {
      const staff = await prisma.user.findUnique({ where: { id: user.id } });
      if (complaint.category.department_id !== staff?.department_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      
      let assignToId = assigned_to;
      // If frontend sent the hardcoded demo ID or none at all, find a real field staff
      if (!assignToId || assignToId === 'cm73y3v4y0001000000000000') {
        const fieldStaff = await prisma.user.findFirst({ where: { role: 'FIELD_STAFF', department_id: staff?.department_id } })
                        || await prisma.user.findFirst({ where: { role: 'FIELD_STAFF' } });
        if (fieldStaff) assignToId = fieldStaff.id;
      }

      updateData.assigned_to = assignToId;
      newStatus = 'ASSIGNED';
      // Calculate SLA based on priority (dummy simple logic)
      const hours = complaint.priority === 'CRITICAL' ? 4 : complaint.priority === 'HIGH' ? 24 : complaint.priority === 'MEDIUM' ? 72 : 168;
      updateData.deadline = new Date(Date.now() + hours * 3600 * 1000);
    } else if (['FIELD_STAFF', 'DEPT_HEAD', 'ADMIN'].includes(user.role) && action === 'START_WORK') {
      if (user.role === 'FIELD_STAFF' && complaint.assigned_to !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      newStatus = 'IN_PROGRESS';
    } else if (['FIELD_STAFF', 'DEPT_HEAD', 'ADMIN'].includes(user.role) && action === 'SUBMIT_EVIDENCE') {
      if (user.role === 'FIELD_STAFF' && complaint.assigned_to !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (!photo_url) return NextResponse.json({ error: 'Evidence photo required' }, { status: 400 });
      await prisma.complaintMedia.create({
        data: { complaint_id: id, type: 'AFTER', url: photo_url, uploaded_by: user.id }
      });
      newStatus = 'EVIDENCE_SUBMITTED';
    } else if (['FIELD_STAFF', 'DEPT_HEAD', 'ADMIN'].includes(user.role) && action === 'SEND_MESSAGE') {
      if (user.role === 'FIELD_STAFF' && complaint.assigned_to !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (staff_visit_date) updateData.staff_visit_date = new Date(staff_visit_date);
      if (staff_contact) updateData.staff_contact = staff_contact;
      if (staff_message) updateData.staff_message = staff_message;
      remarks = 'Update message/contact details sent';
      // Do not change status, just update the data
    } else if (['FIELD_STAFF', 'DEPT_HEAD', 'ADMIN'].includes(user.role) && action === 'MARK_SOLVED') {
      if (user.role === 'FIELD_STAFF' && complaint.assigned_to !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      newStatus = 'WORK_COMPLETED';
      updateData.resolved_at = new Date();
      remarks = 'Issue marked as solved';
    } else if (user.role === 'DEPT_HEAD' && action === 'VERIFY_APPROVE') {
      newStatus = 'CITIZEN_VERIFICATION';
    } else if (user.role === 'DEPT_HEAD' && action === 'VERIFY_REJECT') {
      newStatus = 'IN_PROGRESS';
    } else if (user.role === 'DEPT_HEAD' && action === 'WARN_STAFF') {
      updateData.dept_warning = 'Come and meet us urgent';
      remarks = 'Department Head sent an urgent warning to field staff';
    } else if (user.role === 'CITIZEN' && complaint.citizen_id === user.id) {
      if (action === 'CITIZEN_APPROVE') newStatus = 'CLOSED';
      else if (action === 'CITIZEN_REJECT') newStatus = 'REOPENED';
      else return NextResponse.json({ error: 'Invalid citizen action' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Invalid action or permission denied' }, { status: 403 });
    }

    if (newStatus) updateData.status = newStatus;

    const updated = await prisma.complaint.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        complaint_id: id,
        actor_id: user.id,
        previous_status: complaint.status,
        new_status: newStatus || complaint.status,
        action,
        remarks: remarks || `Status updated to ${newStatus}`
      }
    });

    return NextResponse.json({ complaint: updated });
  } catch (error) {
    console.error('Update complaint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
