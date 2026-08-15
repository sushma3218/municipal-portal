const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany();
  if (depts.length === 0) return console.log('No departments');
  
  const dept = depts[0];
  await prisma.user.updateMany({ 
    where: { role: { in: ['DEPT_HEAD', 'FIELD_STAFF'] } }, 
    data: { department_id: null } 
  });
  
  console.log('Unassigned DEPT_HEADs and FIELD_STAFFs for global view');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
