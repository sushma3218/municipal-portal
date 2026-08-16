import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let whereClause: any = {};
    if (user.role === 'DEPT_HEAD') {
      const staffInfo = await prisma.user.findUnique({ where: { id: user.id } });
      if (!staffInfo?.department_id) {
        whereClause = {}; // MVP Fallback: if no dept assigned, show all stats
      } else {
        whereClause = { category: { is: { department_id: staffInfo.department_id } } };
      }
    } else if (user.role === 'FIELD_STAFF') {
      whereClause = { assigned_to: user.id };
    }

    const total = await prisma.complaint.count({ where: whereClause });
    const newComplaints = await prisma.complaint.count({ where: { ...whereClause, status: { in: ['SUBMITTED', 'RECEIVED', 'FORWARDED'] } } });
    const active = await prisma.complaint.count({ where: { ...whereClause, status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'] } } });
    const resolved = await prisma.complaint.count({ where: { ...whereClause, status: { in: ['WORK_COMPLETED', 'EVIDENCE_SUBMITTED', 'VERIFICATION', 'CITIZEN_VERIFICATION', 'CLOSED', 'REJECTED'] } } });
    const overdue = await prisma.complaint.count({ where: { ...whereClause, deadline: { lt: new Date() }, status: { notIn: ['CLOSED', 'REJECTED'] } } });

    // Dept stats
    const depts = await prisma.department.findMany();
    const deptStats = await Promise.all(depts.map(async (dept) => {
      const deptWhere = { category: { is: { department_id: dept.id } } };
      return {
        name: dept.name,
        received: await prisma.complaint.count({ where: deptWhere }),
        resolved: await prisma.complaint.count({ where: { ...deptWhere, status: 'CLOSED' } }),
        pending: await prisma.complaint.count({ where: { ...deptWhere, status: { notIn: ['CLOSED', 'REJECTED'] } } }),
        overdue: await prisma.complaint.count({ where: { ...deptWhere, deadline: { lt: new Date() }, status: { notIn: ['CLOSED', 'REJECTED'] } } })
      };
    }));

    return NextResponse.json({
      overview: { total, new: newComplaints, active, resolved, overdue },
      deptStats
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
