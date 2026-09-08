const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purge() {
  console.log('Purging test/dummy patients from database...');
  await prisma.$transaction([
    prisma.administrationRecord.deleteMany(),
    prisma.medicationSchedule.deleteMany(),
    prisma.safetyAlert.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.allergy.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.updateMany({ data: { patientId: null } }),
    prisma.patient.deleteMany(),
    prisma.ward.updateMany({ data: { occupancy: 0 } })
  ]);
  const patientCount = await prisma.patient.count();
  const staffCount = await prisma.user.count();
  console.log(`✅ Success! Patient count: ${patientCount}, Staff count: ${staffCount}`);
  process.exit(0);
}

purge().catch(err => {
  console.error('Purge error:', err);
  process.exit(1);
});
