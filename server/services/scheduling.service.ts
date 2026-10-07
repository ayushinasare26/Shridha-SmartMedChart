import { prisma } from '../config/prisma';

type FrequencyCode = string;

interface FrequencyConfig {
  hoursInterval: number;
  timesPerDay: number;
  startHours: number[];
}

const FREQUENCY_MAP: Record<string, FrequencyConfig> = {
  'Q24H': { hoursInterval: 24, timesPerDay: 1, startHours: [8] },
  'QD': { hoursInterval: 24, timesPerDay: 1, startHours: [8] },
  'DAILY': { hoursInterval: 24, timesPerDay: 1, startHours: [8] },
  'Q12H': { hoursInterval: 12, timesPerDay: 2, startHours: [8, 20] },
  'BID': { hoursInterval: 12, timesPerDay: 2, startHours: [8, 20] },
  'Q8H': { hoursInterval: 8, timesPerDay: 3, startHours: [8, 16, 24] },
  'TID': { hoursInterval: 8, timesPerDay: 3, startHours: [8, 16, 24] },
  'Q6H': { hoursInterval: 6, timesPerDay: 4, startHours: [6, 12, 18, 24] },
  'QID': { hoursInterval: 6, timesPerDay: 4, startHours: [6, 12, 18, 24] },
  'Q4H': { hoursInterval: 4, timesPerDay: 6, startHours: [6, 10, 14, 18, 22, 2] },
  'Q2H': { hoursInterval: 2, timesPerDay: 12, startHours: [] },
  'STAT': { hoursInterval: 0, timesPerDay: 1, startHours: [] },
  'PRN': { hoursInterval: 0, timesPerDay: 0, startHours: [] },
  'CONTINUOUS': { hoursInterval: 0, timesPerDay: 0, startHours: [] },
  'BEDTIME': { hoursInterval: 24, timesPerDay: 1, startHours: [20] },
};

export async function generateSchedules(
  prescriptionId: string,
  patientId: string,
  frequency: string,
  startDate: Date,
  stopDate: Date | null,
  isStatOrder: boolean,
): Promise<any[]> {
  const freqUpper = frequency.toUpperCase().trim();

  // STAT or PRN — single schedule or none
  if (freqUpper === 'STAT' || isStatOrder) {
    const schedule = await prisma.medicationSchedule.create({
      data: {
        prescriptionId,
        patientId,
        scheduledTime: new Date(),
        status: 'PENDING',
      },
    });
    return [schedule];
  }

  if (freqUpper === 'PRN' || freqUpper === 'CONTINUOUS') {
    return []; // PRN/Continuous managed differently
  }

  const config = FREQUENCY_MAP[freqUpper] || FREQUENCY_MAP['Q24H'];
  const schedules = [];
  const endDate = stopDate || new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000); // default 3 days

  const scheduleTimes: Date[] = [];

  if (config.startHours.length > 0) {
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      for (const hour of config.startHours) {
        const scheduledTime = new Date(current);
        scheduledTime.setHours(hour, 0, 0, 0);
        if (scheduledTime >= startDate && scheduledTime <= endDate) {
          scheduleTimes.push(new Date(scheduledTime));
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  // Create in batch
  for (const scheduledTime of scheduleTimes.slice(0, 30)) { // limit to 30
    const schedule = await prisma.medicationSchedule.create({
      data: { prescriptionId, patientId, scheduledTime, status: 'PENDING' },
    });
    schedules.push(schedule);
  }

  return schedules;
}
