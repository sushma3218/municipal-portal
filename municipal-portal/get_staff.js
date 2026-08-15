const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const staff = await prisma.user.findFirst({ where: { role: 'FIELD_STAFF' }, orderBy: { created_at: 'desc' } });
  console.log('Latest FIELD_STAFF:', staff);
}
main().catch(console.error).finally(() => prisma.$disconnect());
