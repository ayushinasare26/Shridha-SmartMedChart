import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';
import { generateSchedules } from '../services/scheduling.service';
import { checkAllergyConflicts } from '../services/safety.service';

export const getPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, status, isStatOrder } = req.query;
    const prescriptions = await prisma.prescription.findMany({
      where: {
        ...(patientId && { patientId: patientId as string }),
        ...(status && { status: status as any }),
        ...(isStatOrder !== undefined && { isStatOrder: isStatOrder === 'true' }),
      },
      include: {
        prescriber: { select: { id: true, name: true, role: true } },
        patient: { select: { id: true, name: true, mrn: true, bed: true } },
        safetyAlerts: { where: { isResolved: false } },
        schedules: { orderBy: { scheduledTime: 'asc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(prescriptions);
  } catch (error) { next(error); }
};

export const getPrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: {
        prescriber: { select: { id: true, name: true, role: true } },
        patient: { include: { allergies: true } },
        safetyAlerts: true,
        schedules: { include: { administrationRecord: true }, orderBy: { scheduledTime: 'asc' } },
      },
    });
    if (!prescription) { res.status(404).json({ error: 'Prescription not found' }); return; }
    res.json(prescription);
  } catch (error) { next(error); }
};

export const createPrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      patientId, medicationName, genericName, medicationClass,
      dose, unit, route, frequency, startDate, stopDate,
      indication, isStatOrder, isContinuous, infusionRate,
      requiresCoSign, formularyRef, overrideReason,
    } = req.body;

    // Check allergy conflicts
    const allergyAlerts = await checkAllergyConflicts(patientId, medicationName, genericName, medicationClass);

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        prescriberId: req.user!.id,
        medicationName,
        genericName,
        medicationClass,
        dose: parseFloat(dose),
        unit,
        route,
        frequency,
        startDate: new Date(startDate),
        stopDate: stopDate ? new Date(stopDate) : null,
        status: isStatOrder ? 'STAT' : 'ACTIVE',
        indication,
        isStatOrder: Boolean(isStatOrder),
        isContinuous: Boolean(isContinuous),
        infusionRate,
        requiresCoSign: Boolean(requiresCoSign),
        overrideReason,
        formularyRef,
        rxNumber: `RX-${Date.now()}`,
      },
    });

    // Generate medication schedules
    const schedules = await generateSchedules(prescription.id, patientId, frequency, new Date(startDate), stopDate ? new Date(stopDate) : null, isStatOrder);

    // Create safety alerts for allergy conflicts
    for (const alert of allergyAlerts) {
      await prisma.safetyAlert.create({
        data: {
          patientId,
          prescriptionId: prescription.id,
          alertType: 'ALLERGY_CONFLICT',
          severity: alert.severity,
          message: alert.message,
          detail: alert.detail,
        },
      });
    }

    // Notify pharmacist
    const pharmacists = await prisma.user.findMany({ where: { role: 'PHARMACIST', isActive: true } });
    for (const pharmacist of pharmacists) {
      await prisma.notification.create({
        data: {
          userId: pharmacist.id,
          patientId,
          type: isStatOrder ? 'STAT_ORDER' : 'NEW_PRESCRIPTION',
          message: `New ${isStatOrder ? 'STAT ' : ''}order: ${medicationName} for patient`,
          priority: isStatOrder ? 'URGENT' : 'NORMAL',
        },
      });
    }

    await createAuditLog({
      userId: req.user?.id,
      patientId,
      action: isStatOrder ? 'STAT_ORDER_CREATED' : 'PRESCRIPTION_CREATED',
      resource: 'Prescription',
      resourceId: prescription.id,
      detail: `${isStatOrder ? 'STAT ' : ''}${medicationName} ${dose}${unit} ordered`,
      req: req as any,
      severity: isStatOrder ? 'High' : 'Normal',
    });

    res.status(201).json({ prescription, schedules, allergyAlerts });
  } catch (error) { next(error); }
};

export const updatePrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(prescription);
  } catch (error) { next(error); }
};

export const signPrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { signingPin } = req.body;
    const prescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: prescription.patientId,
      action: 'PRESCRIPTION_SIGNED',
      resource: 'Prescription',
      resourceId: prescription.id,
      detail: `${prescription.medicationName} digitally signed`,
      req: req as any,
    });
    res.json(prescription);
  } catch (error) { next(error); }
};

export const overridePrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { overrideReason, alertId } = req.body;
    const prescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: { overrideReason },
    });
    if (alertId) {
      await prisma.safetyAlert.update({
        where: { id: alertId },
        data: {
          isOverridden: true,
          overrideById: req.user?.id,
          overrideReason,
          overriddenAt: new Date(),
        },
      });
    }
    await createAuditLog({
      userId: req.user?.id,
      patientId: prescription.patientId,
      action: 'SAFETY_OVERRIDE',
      resource: 'Prescription',
      resourceId: prescription.id,
      detail: `Safety alert overridden: ${overrideReason}`,
      req: req as any,
      severity: 'STAT',
    });
    res.json(prescription);
  } catch (error) { next(error); }
};

export const holdPrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { holdReason } = req.body;
    const prescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: { status: 'HELD' },
    });
    await prisma.medicationSchedule.updateMany({
      where: { prescriptionId: req.params.id, status: 'PENDING' },
      data: { status: 'HELD', holdReason },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: prescription.patientId,
      action: 'PRESCRIPTION_HELD',
      resource: 'Prescription',
      resourceId: prescription.id,
      detail: holdReason,
      req: req as any,
      severity: 'Warning',
    });
    res.json(prescription);
  } catch (error) { next(error); }
};

export const discontinuePrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: { status: 'DISCONTINUED', stopDate: new Date() },
    });
    await prisma.medicationSchedule.updateMany({
      where: { prescriptionId: req.params.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: prescription.patientId,
      action: 'PRESCRIPTION_DISCONTINUED',
      resource: 'Prescription',
      resourceId: prescription.id,
      req: req as any,
    });
    res.json(prescription);
  } catch (error) { next(error); }
};

export const pharmacyVerify = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        pharmacyVerified: true,
        pharmacyVerifiedAt: new Date(),
        pharmacyVerifiedBy: req.user?.id,
      },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: prescription.patientId,
      action: 'PHARMACY_VERIFIED',
      resource: 'Prescription',
      resourceId: prescription.id,
      detail: `${prescription.medicationName} verified by pharmacy`,
      req: req as any,
    });
    res.json(prescription);
  } catch (error) { next(error); }
};
