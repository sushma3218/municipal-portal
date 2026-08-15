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
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@muni.gov',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
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
