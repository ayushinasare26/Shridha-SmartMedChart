import { prisma } from '../config/prisma';

async function test() {
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      name: true,
      mrn: true,
      prescriptions: {
        select: {
          id: true,
          medicationName: true,
          status: true,
          schedules: {
            select: {
              id: true,
              status: true,
              scheduledTime: true,
              administeredAt: true,
              administeredBy: { select: { name: true, role: true } }
            }
          }
        }
      }
    }
  });

  for (const p of patients) {
    console.log(`\nPatient: ${p.name} (MRN: ${p.mrn})`);
    for (const rx of p.prescriptions) {
      console.log(`  Rx: ${rx.medicationName} [${rx.status}] (schedules: ${rx.schedules.length})`);
      for (const s of rx.schedules) {
        console.log(`    - Schedule ${s.id}: ${s.status} at ${s.scheduledTime}, administered: ${s.administeredAt ? s.administeredAt : 'No'} by ${s.administeredBy?.name || 'N/A'}`);
      }
    }
  }
}

test().finally(() => prisma.$disconnect());
