import { prisma } from '../config/prisma';
export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

// Allergy cross-reactivity database (rule-based)
const CROSS_REACTIVITY_MAP: Record<string, { crossReacts: string[]; severity: AlertSeverity; riskPercent: string }> = {
  'ceftriaxone': {
    crossReacts: ['penicillin', 'amoxicillin', 'ampicillin', 'penicillin g', 'beta-lactam'],
    severity: 'CRITICAL',
    riskPercent: '5-8%',
  },
  'cefazolin': {
    crossReacts: ['penicillin', 'beta-lactam'],
    severity: 'HIGH',
    riskPercent: '1-2%',
  },
  'meropenem': {
    crossReacts: ['penicillin', 'beta-lactam'],
    severity: 'HIGH',
    riskPercent: '1%',
  },
  'piperacillin': {
    crossReacts: ['penicillin', 'beta-lactam', 'ampicillin'],
    severity: 'CRITICAL',
    riskPercent: '10-15%',
  },
};

const HIGH_ALERT_MEDICATIONS = [
  'insulin', 'warfarin', 'heparin', 'enoxaparin',
  'morphine', 'fentanyl', 'hydromorphone', 'methadone',
  'norepinephrine', 'epinephrine', 'vasopressin', 'dopamine',
  'potassium chloride', 'concentrated electrolytes',
  'neuromuscular blocking',
];

interface AllergyConflict {
  severity: AlertSeverity;
  message: string;
  detail: string;
}

export async function checkAllergyConflicts(
  patientId: string,
  medicationName: string,
  genericName?: string,
  medicationClass?: string,
): Promise<AllergyConflict[]> {
  const conflicts: AllergyConflict[] = [];
  const medLower = (medicationName + ' ' + (genericName || '') + ' ' + (medicationClass || '')).toLowerCase();

  const allergies = await prisma.allergy.findMany({ where: { patientId } });

  for (const allergy of allergies) {
    const allergenLower = allergy.allergen.toLowerCase();

    // Direct match
    if (medLower.includes(allergenLower)) {
      conflicts.push({
        severity: allergy.severity === 'Anaphylaxis' ? 'CRITICAL' : allergy.severity === 'Severe' ? 'HIGH' : 'WARNING',
        message: `ALLERGY CONFLICT: Patient has documented ${allergy.severity} allergy to ${allergy.allergen}`,
        detail: `Reaction: ${allergy.reaction}. Direct allergen match detected.`,
      });
      continue;
    }

    // Cross-reactivity check
    for (const [drug, crossInfo] of Object.entries(CROSS_REACTIVITY_MAP)) {
      if (medLower.includes(drug) && crossInfo.crossReacts.some(cr => allergenLower.includes(cr))) {
        conflicts.push({
          severity: crossInfo.severity,
          message: `SAFETY INTERCEPT: Cross-Reactivity Risk (${crossInfo.riskPercent}) — Patient allergic to ${allergy.allergen}`,
          detail: `${medicationName} shares structural similarity with ${allergy.allergen}. Cross-reactivity risk: ${crossInfo.riskPercent}.`,
        });
      }
    }
  }

  // High alert check
  for (const highAlert of HIGH_ALERT_MEDICATIONS) {
    if (medLower.includes(highAlert)) {
      conflicts.push({
        severity: 'WARNING',
        message: `HIGH-ALERT MEDICATION: ${medicationName} requires dual nurse verification`,
        detail: 'Independent double-check of dose, rate, and route required before administration.',
      });
      break;
    }
  }

  return conflicts;
}

export async function computeRiskScore(wardUnit: string): Promise<{
  riskIndex: number;
  adrPreventionScore: number;
  criticalEscalations: number;
  riskFactors: Array<{ description: string; impact: string }>;
}> {
  const ward = await prisma.ward.findUnique({ where: { unit: wardUnit } });
  if (!ward) return { riskIndex: 0, adrPreventionScore: 100, criticalEscalations: 0, riskFactors: [] };

  const patients = await prisma.patient.findMany({
    where: { wardId: ward.id },
    include: { allergies: true },
  });

  const now = new Date();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // Delayed schedules
  const delayed = await prisma.medicationSchedule.count({
    where: {
      patient: { wardId: ward.id },
      status: 'DELAYED',
      scheduledTime: { lte: now },
    },
  });

  // Unresolved critical alerts
  const criticalAlerts = await prisma.safetyAlert.count({
    where: {
      patient: { wardId: ward.id },
      isResolved: false,
      severity: { in: ['CRITICAL', 'HIGH'] },
    },
  });

  // Pending STAT orders
  const statOrders = await prisma.medicationSchedule.count({
    where: {
      patient: { wardId: ward.id },
      status: 'PENDING',
      prescription: { isStatOrder: true },
    },
  });

  // Recent administrations (for ADR score)
  const totalScheduled = await prisma.medicationSchedule.count({
    where: {
      patient: { wardId: ward.id },
      scheduledTime: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), lte: now },
    },
  });

  const given = await prisma.medicationSchedule.count({
    where: {
      patient: { wardId: ward.id },
      status: 'GIVEN',
      scheduledTime: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), lte: now },
    },
  });

  const riskIndex = Math.min(100, delayed * 3 + criticalAlerts * 10 + statOrders * 5);
  const adrPreventionScore = totalScheduled > 0 ? parseFloat(((given / totalScheduled) * 100).toFixed(1)) : 99.8;

  const riskFactors = [];
  if (delayed > 0) riskFactors.push({ description: `${delayed} delayed medication administrations`, impact: `+${delayed * 3}% risk` });
  if (statOrders > 0) riskFactors.push({ description: `${statOrders} pending STAT orders`, impact: '+5% per STAT' });

  return { riskIndex, adrPreventionScore, criticalEscalations: criticalAlerts, riskFactors };
}
