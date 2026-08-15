const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const staffList = await prisma.user.findMany({ where: { role: 'FIELD_STAFF' } });
  console.log('Available FIELD_STAFF:', staffList.map(s => s.name + ' - ' + s.id).join(', '));
  
  if (staffList.length > 1) {
     // User probably created one. Get the last one (most recent)
     const staff = staffList[staffList.length - 1];
     console.log('Assigning to newest field staff:', staff.name, staff.id);
     
     // update all complaints currently assigned to the old staff id
     await prisma.complaint.updateMany({
       where: { assigned_to: staffList[0].id },
       data: { assigned_to: staff.id }
     });
     
     // also assign them to the same department as Dept Head
     const deptHead = await prisma.user.findFirst({ where: { role: 'DEPT_HEAD' } });
     if (deptHead && deptHead.department_id) {
       await prisma.user.update({
         where: { id: staff.id },
         data: { department_id: deptHead.department_id }
       });
       console.log('Also assigned the new field staff to dept:', deptHead.department_id);
     }
  }
}

main().catch(console.error).finally(() => {
    prisma['$disconnect']();
});
