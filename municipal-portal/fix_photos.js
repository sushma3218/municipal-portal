const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.complaintMedia.updateMany({
    where: { url: 'https://example.com/pothole.jpg' },
    data: { url: 'https://placehold.co/400x300/png?text=Issue+Photo' }
  });

  await prisma.complaintMedia.updateMany({
    where: { url: 'https://example.com/resolved_pothole.jpg' },
    data: { url: 'https://placehold.co/400x300/png?text=Resolved+Photo' }
  });
  
  console.log('Fixed broken image links in DB.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
