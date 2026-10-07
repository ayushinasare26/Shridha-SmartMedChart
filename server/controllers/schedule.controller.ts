import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

const scheduleInclude = {
  prescription: {
    include: {
      prescriber: { select: { id: true, name: true, role: true } },
      safetyAlerts: { where: { isResolved: false } },
    },
  },
  patient: { select: { id: true, name: true, mrn: true, bed: true, wardId: true } },
  administeredBy: { select: { id: true, name: true, role: true } },
  administrationRecord: true,
};

export const getSchedules = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, status, date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    let schedules = await prisma.medicationSchedule.findMany({
      where: {
        ...(patientId && {
          OR: [
            { patientId: patientId as string },
            { patient: { mrn: patientId as string } },
          ],
        }),
        ...(status && { status: status as any }),
        ...(date && { scheduledTime: { gte: startOfDay, lte: endOfDay } }),
      },
      include: scheduleInclude,
      orderBy: { scheduledTime: 'asc' },
    });

    // If looking for a patient's pending medications and none found, check active prescriptions and create pending schedules
    if (patientId && schedules.filter(s => s.status === 'PENDING').length === 0) {
      const patient = await prisma.patient.findFirst({
        where: { OR: [{ id: patientId as string }, { mrn: patientId as string }] },
        include: { prescriptions: { where: { status: { in: ['ACTIVE', 'STAT'] } } } },
      });

      if (patient && patient.prescriptions.length > 0) {
        for (const rx of patient.prescriptions) {
          const newSchedule = await prisma.medicationSchedule.create({
            data: {
              prescriptionId: rx.id,
              patientId: patient.id,
              scheduledTime: new Date(),
              status: 'PENDING',
            },
            include: scheduleInclude,
          });
          schedules.push(newSchedule as any);
        }
      }
    }

    res.json(schedules);
  } catch (error) { next(error); }
};

export const getWardSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ward, date, shift } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    const wardRecord = ward ? await prisma.ward.findUnique({ where: { unit: ward as string } }) : null;

    const schedules = await prisma.medicationSchedule.findMany({
      where: {
        scheduledTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] },
        ...(wardRecord && { patient: { wardId: wardRecord.id } }),
      },
      include: scheduleInclude,
      orderBy: { scheduledTime: 'asc' },
    });
    res.json(schedules);
  } catch (error) { next(error); }
};

export const getSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schedule = await prisma.medicationSchedule.findUnique({
      where: { id: req.params.id },
      include: scheduleInclude,
    });
    if (!schedule) { res.status(404).json({ error: 'Schedule not found' }); return; }
    res.json(schedule);
  } catch (error) { next(error); }
};

export const administerMedication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      scheduleId, patientId, dose, unit, route, notes,
      barcodeScanned, fiveRights, witnessId,
    } = req.body;

    const { rightPatient, rightDrug, rightDose, rightRoute, rightTime } = fiveRights || {};
    const fiveRightsVerified = !!(rightPatient && rightDrug && rightDose && rightRoute && rightTime);

    let finalSchedule = null;

    if (scheduleId && !scheduleId.startsWith('rx-auto-')) {
      finalSchedule = await prisma.medicationSchedule.findUnique({
        where: { id: scheduleId },
        include: { prescription: true },
      });
    }

    if (!finalSchedule && patientId) {
      finalSchedule = await prisma.medicationSchedule.findFirst({
        where: {
          OR: [
            { patientId: patientId },
            { patient: { mrn: patientId } },
          ],
          status: 'PENDING',
        },
        include: { prescription: true },
      });

      if (!finalSchedule) {
        const patient = await prisma.patient.findFirst({
          where: { OR: [{ id: patientId }, { mrn: patientId }] },
          include: { prescriptions: { where: { status: { in: ['ACTIVE', 'STAT'] } } } },
        });

        if (patient && patient.prescriptions.length > 0) {
          const rx = patient.prescriptions[0];
          finalSchedule = await prisma.medicationSchedule.create({
            data: {
              prescriptionId: rx.id,
              patientId: patient.id,
              scheduledTime: new Date(),
              status: 'PENDING',
            },
            include: { prescription: true },
          });
        }
      }
    }

    if (!finalSchedule) {
      res.status(404).json({ error: 'No schedule or prescription found for administration' });
      return;
    }

    // If this schedule was already administered, create a new schedule instance for this administration to avoid unique constraint conflict
    const existingAdmin = await prisma.administrationRecord.findUnique({
      where: { scheduleId: finalSchedule.id },
    });
    if (existingAdmin) {
      finalSchedule = await prisma.medicationSchedule.create({
        data: {
          prescriptionId: finalSchedule.prescriptionId,
          patientId: finalSchedule.patientId,
          scheduledTime: new Date(),
          status: 'PENDING',
        },
        include: { prescription: true },
      });
    }

    const finalPatientId = finalSchedule.patientId;
    const finalDose = !isNaN(parseFloat(dose)) ? parseFloat(dose) : (finalSchedule.prescription?.dose || 1);
    const finalUnit = unit || finalSchedule.prescription?.unit || 'mg';
    const finalRoute = route || finalSchedule.prescription?.route || 'IV';

    // Update schedule
    const schedule = await prisma.medicationSchedule.update({
      where: { id: finalSchedule.id },
      data: {
        status: 'GIVEN',
        administeredById: req.user!.id,
        administeredAt: new Date(),
        verificationMethod: barcodeScanned ? 'BARCODE_SCAN' : 'MANUAL_ENTRY',
      },
    });

    // Create administration record
    const adminRecord = await prisma.administrationRecord.create({
      data: {
        scheduleId: finalSchedule.id,
        patientId: finalPatientId,
        administeredById: req.user!.id,
        dose: finalDose,
        unit: finalUnit,
        route: finalRoute,
        notes: notes || 'Administered via Bedside Scanner',
        fiveRightsVerified,
        rightPatient: !!rightPatient,
        rightDrug: !!rightDrug,
        rightDose: !!rightDose,
        rightRoute: !!rightRoute,
        rightTime: !!rightTime,
        barcodeScanned: !!barcodeScanned,
        witnessId: witnessId || null,
        safetyScore: fiveRightsVerified ? (barcodeScanned ? 100 : 95) : 70,
        signedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      patientId: finalPatientId,
      action: 'MEDICATION_ADMINISTERED',
      resource: 'Administration',
      resourceId: adminRecord.id,
      detail: `${finalDose}${finalUnit} ${finalRoute} administered. 5-Rights: ${fiveRightsVerified ? 'VERIFIED' : 'INCOMPLETE'}. Admin ID: ${adminRecord.adminId}`,
      req: req as any,
    });

    const [fullSchedule, fullAdminRecord] = await Promise.all([
      prisma.medicationSchedule.findUnique({
        where: { id: finalSchedule.id },
        include: scheduleInclude,
      }),
      prisma.administrationRecord.findUnique({
        where: { id: adminRecord.id },
        include: {
          administeredBy: { select: { id: true, name: true, role: true, staffId: true } },
          patient: { select: { id: true, name: true, mrn: true, bed: true } },
        },
      }),
    ]);

    res.status(201).json({ schedule: fullSchedule || schedule, adminRecord: fullAdminRecord || adminRecord });
  } catch (error) { next(error); }
};

export const holdSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { holdReason } = req.body;
    const schedule = await prisma.medicationSchedule.update({
      where: { id: req.params.id },
      data: { status: 'HELD', holdReason },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: schedule.patientId,
      action: 'SCHEDULE_HELD',
      resource: 'Schedule',
      resourceId: schedule.id,
      detail: holdReason,
      req: req as any,
      severity: 'Warning',
    });
    res.json(schedule);
  } catch (error) { next(error); }
};

export const delaySchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { delayReason, delayMinutes } = req.body;
    const schedule = await prisma.medicationSchedule.update({
      where: { id: req.params.id },
      data: { status: 'DELAYED', delayReason, delayMinutes: parseInt(delayMinutes || '0') },
    });
    res.json(schedule);
  } catch (error) { next(error); }
};
