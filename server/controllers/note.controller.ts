import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

export const getNotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, type, category } = req.query;

    const notes = await (prisma as any).clinicalNote.findMany({
      where: {
        ...(patientId && { patientId: patientId as string }),
        ...(type && { type: type as string }),
        ...(category && { category: category as string }),
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, staffId: true, specialty: true, title: true },
        },
        acknowledgedBy: {
          select: { id: true, name: true, role: true, staffId: true },
        },
        patient: {
          select: { id: true, name: true, mrn: true, bed: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notes);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      patientId,
      type = 'DOCTOR_PROGRESS_NOTE',
      title,
      content,
      category = 'SOAP',
      subjective,
      objective,
      assessment,
      plan,
      vitalsData,
    } = req.body;

    if (!patientId || !content) {
      res.status(400).json({ error: 'patientId and content are required' });
      return;
    }

    const note = await (prisma as any).clinicalNote.create({
      data: {
        patientId,
        authorId: req.user!.id,
        type,
        title: title || (type === 'DOCTOR_PROGRESS_NOTE' ? 'Clinical Progress Note' : 'Nurse Bedside Update'),
        content,
        category,
        subjective,
        objective,
        assessment,
        plan,
        vitalsData: typeof vitalsData === 'object' ? JSON.stringify(vitalsData) : vitalsData,
        isAcknowledged: req.user!.role === 'DOCTOR', // Doctor authored notes are pre-approved
        acknowledgedById: req.user!.role === 'DOCTOR' ? req.user!.id : null,
        acknowledgedAt: req.user!.role === 'DOCTOR' ? new Date() : null,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, staffId: true, specialty: true, title: true },
        },
        patient: {
          select: { id: true, name: true, mrn: true, bed: true },
        },
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      patientId,
      action: 'CLINICAL_NOTE_CREATED',
      resource: 'ClinicalNote',
      resourceId: note.id,
      detail: `${req.user?.role} note created for patient: ${title || type}`,
      req: req as any,
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const acknowledgeNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const note = await (prisma as any).clinicalNote.update({
      where: { id },
      data: {
        isAcknowledged: true,
        acknowledgedById: req.user!.id,
        acknowledgedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, staffId: true },
        },
        acknowledgedBy: {
          select: { id: true, name: true, role: true, staffId: true },
        },
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      patientId: note.patientId,
      action: 'CLINICAL_NOTE_ACKNOWLEDGED',
      resource: 'ClinicalNote',
      resourceId: note.id,
      detail: `Doctor ${req.user?.name} acknowledged nurse note "${note.title}"`,
      req: req as any,
    });

    res.json(note);
  } catch (error) {
    next(error);
  }
};
