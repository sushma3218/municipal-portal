import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting ComplaintMedia...');
  await prisma.complaintMedia.deleteMany();
  console.log('Deleting AuditLogs...');
  await prisma.auditLog.deleteMany();
  console.log('Deleting Complaints...');
  await prisma.complaint.deleteMany();
  console.log('All complaints and related data deleted successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
