import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'CITIZEN') {
      return NextResponse.json({ error: 'Unauthorized. Only citizens can create complaints.' }, { status: 403 });
    }

    const body = await req.json();
    const { category_id, description, location_text, lat, lng, ward, priority, photo_url } = body;

    // FIX: Restored `!description` check
    if (!category_id || !description || !location_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique complaint ID like CMP-2026-XXXX
    const count = await prisma.complaint.count();
    const id = `CMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const complaint = await prisma.complaint.create({
      data: {
        id,
        citizen_id: user.id,
        category_id,
        description,
        location_text,
        lat,
        lng,
        ward,
        priority: priority || 'MEDIUM',
        status: 'SUBMITTED',
      }
    });

    if (photo_url) {
      await prisma.complaintMedia.create({
        data: {
          complaint_id: complaint.id,
          type: 'BEFORE',
          url: photo_url,
          uploaded_by: user.id,
        }
      });
    }

    // Log the initial state
    await prisma.auditLog.create({
      data: {
        complaint_id: complaint.id,
        actor_id: user.id,
        new_status: 'SUBMITTED',
        action: 'CREATED',
        remarks: 'Complaint submitted by citizen',
      }
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error('Create complaint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let complaints;
    
    // RBAC filtering
    if (user.role === 'CITIZEN') {
      complaints = await prisma.complaint.findMany({
        where: { citizen_id: user.id },
        include: { category: { include: { department: true } }, media: true },
        orderBy: { created_at: 'desc' }
      });
    } else if (user.role === 'RECEIVING_OFFICER') {
      complaints = await prisma.complaint.findMany({
        where: { status: { in: ['SUBMITTED', 'RECEIVED'] } },
        include: { category: { include: { department: true } }, citizen: { select: { name: true, phone: true } }, media: true },
        orderBy: { created_at: 'desc' }
      });
    } else if (user.role === 'DEPT_HEAD' || user.role === 'FIELD_STAFF') {
      const staffInfo = await prisma.user.findUnique({ where: { id: user.id } });
      if (user.role === 'DEPT_HEAD') {
        if (!staffInfo?.department_id) {
          // Fallback: If Dept Head has no department assigned, show them all pending issues for MVP.
          complaints = await prisma.complaint.findMany({
            where: { status: { in: ['SUBMITTED', 'FORWARDED', 'EVIDENCE_SUBMITTED'] } },
            include: { category: true, assignee: { select: { name: true } }, citizen: { select: { name: true, phone: true } }, media: true },
            orderBy: { created_at: 'desc' }
          });
        } else {
          complaints = await prisma.complaint.findMany({
            where: { category: { is: { department_id: staffInfo.department_id } } },
            include: { category: true, assignee: { select: { name: true } }, citizen: { select: { name: true, phone: true } }, media: true },
            orderBy: { created_at: 'desc' }
          });
        }
      } else {
        complaints = await prisma.complaint.findMany({
          where: { assigned_to: user.id },
          include: { category: true, citizen: { select: { name: true, phone: true } }, media: true },
          orderBy: { created_at: 'desc' }
        });
      }
    } else if (user.role === 'ADMIN') {
      complaints = await prisma.complaint.findMany({
        include: { category: { include: { department: true } }, citizen: { select: { name: true, phone: true } }, assignee: { select: { name: true } }, media: true },
        orderBy: { created_at: 'desc' }
      });
    } else {
      return NextResponse.json({ error: 'Forbidden role' }, { status: 403 });
    }

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error('List complaints error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
