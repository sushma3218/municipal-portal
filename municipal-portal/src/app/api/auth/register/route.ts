import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    let department_id = null;
    if (role === 'DEPT_HEAD' || role === 'FIELD_STAFF') {
      const firstDept = await prisma.department.findFirst();
      if (firstDept) department_id = firstDept.id;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        phone,
        role: role || 'CITIZEN', // Use provided role or default
        department_id,
      }
    });

    const token = signToken({ id: user.id, role: user.role, name: user.name });

    return NextResponse.json({ token, user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
