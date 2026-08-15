const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany();
  if (depts.length === 0) return console.log('No departments');
  
  const dept = depts[0];
  await prisma.user.updateMany({ 
    where: { role: 'DEPT_HEAD' }, 
    data: { department_id: dept.id } 
  });
  
  console.log('Assigned DEPT_HEADs to ' + dept.name);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
