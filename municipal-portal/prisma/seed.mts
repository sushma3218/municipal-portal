import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create Departments
  const roadsDept = await prisma.department.create({
    data: { name: 'Roads' }
  });
  const waterDept = await prisma.department.create({
    data: { name: 'Water' }
  });
  const sanitationDept = await prisma.department.create({
    data: { name: 'Sanitation' }
  });

  // Create Categories
  await prisma.category.createMany({
    data: [
      { name: 'Pothole', department_id: roadsDept.id, sla_hours: 24 },
      { name: 'Road Damage', department_id: roadsDept.id, sla_hours: 48 },
      { name: 'Water Leak', department_id: waterDept.id, sla_hours: 12 },
      { name: 'No Water Supply', department_id: waterDept.id, sla_hours: 4 },
      { name: 'Garbage Dump', department_id: sanitationDept.id, sla_hours: 24 },
      { name: 'Drainage Issue', department_id: sanitationDept.id, sla_hours: 24 },
    ]
  });

  // Create Admin
  const defaultPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@muni.gov',
      password_hash: defaultPassword,
      role: 'ADMIN',
    }
  });

  // Create Receiving Officer
  await prisma.user.create({
    data: {
      name: 'Receiving Officer 1',
      email: 'ro@muni.gov',
      password_hash: defaultPassword,
      role: 'RECEIVING_OFFICER',
    }
  });

  // Create Dept Head (Roads)
  await prisma.user.create({
    data: {
      name: 'Roads Dept Head',
      email: 'head.roads@muni.gov',
      password_hash: defaultPassword,
      role: 'DEPT_HEAD',
      department_id: roadsDept.id,
    }
  });

  // Create Field Staff (Roads)
  await prisma.user.create({
    data: {
      id: 'cm73y3v4y0001000000000000', // Hardcoded ID so the hardcoded assignment works
      name: 'Roads Field Staff',
      email: 'staff.roads@muni.gov',
      password_hash: defaultPassword,
      role: 'FIELD_STAFF',
      department_id: roadsDept.id,
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
