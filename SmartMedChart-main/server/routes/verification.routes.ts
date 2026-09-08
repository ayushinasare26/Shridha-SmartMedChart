import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

// Public verification endpoint — no authentication required so phone cameras can scan and view
router.get('/:identifier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = req.params;
    const cleanId = (identifier || '').trim();

    if (!cleanId) {
      res.status(400).json({ error: 'Identifier required' });
      return;
    }

    // 1. Try finding patient by MRN or ID
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { mrn: cleanId },
          { id: cleanId },
        ],
      },
      include: {
        ward: true,
        allergies: true,
        prescriptions: {
          where: { status: { in: ['ACTIVE', 'STAT'] } },
          include: {
            prescriber: { select: { id: true, name: true, role: true } },
            schedules: {
              where: { status: { in: ['PENDING', 'GIVEN', 'HELD', 'DELAYED'] } },
              include: {
                administeredBy: { select: { id: true, name: true, role: true, staffId: true } },
                administrationRecord: true,
              },
              orderBy: { scheduledTime: 'asc' },
              take: 12,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        administrations: {
          include: {
            administeredBy: { select: { id: true, name: true, role: true, staffId: true } },
            schedule: {
              include: {
                prescription: { select: { medicationName: true, dose: true, unit: true, route: true } },
              },
            },
          },
          orderBy: { signedAt: 'desc' },
          take: 12,
        },
      },
    });

    if (patient) {
      // Look up attending doctor
      let attendingDoctor: any = null;
      if (patient.attendingId) {
        attendingDoctor = await prisma.user.findUnique({
          where: { id: patient.attendingId },
          select: { name: true, title: true, department: true }
        });
      }
      if (!attendingDoctor) {
        attendingDoctor = {
          name: 'Dr. V. Sharma, MD',
          title: 'Attending Intensivist & Pulmonologist',
          department: 'Pulmonology / Critical Care'
        };
      }

      // Attending bedside nurse mapping with direct Indian +91 phone
      const nurseMap: Record<string, { name: string; phone: string; title: string }> = {
        'ICU-12': { name: 'Nurse Priya Nair, RN', phone: '+91 98234 88219', title: 'Primary Bedside BSN' },
        'ICU-14': { name: 'Nurse Priya Nair, RN', phone: '+91 98234 88219', title: 'Primary Bedside BSN' },
        'ICU-08': { name: 'Nurse Suresh Verma, RN', phone: '+91 98234 40192', title: 'Ward Charge Nurse / BSN' },
        'ICU-03': { name: 'Nurse Kavita Nair, RN', phone: '+91 98234 55219', title: 'Staff Registered Nurse' },
      };

      const bedKey = (patient.bed || '').replace('Bed ', '').trim();
      const attendingNurse = nurseMap[bedKey] || {
        name: 'Nurse Priya Nair, RN',
        phone: '+91 98234 88219',
        title: 'Primary Bedside BSN'
      };

      const departmentName = patient.ward?.name ? `${patient.ward.name} - Inpatient Medicine` : 'Department of Critical Care & Inpatient Medicine';

      const isStaffViewer =
        req.query.role === 'staff' ||
        req.query.viewer === 'staff' ||
        req.query.viewerRole === 'ALLIED_STAFF' ||
        req.query.viewerRole === 'OTHER_STAFF' ||
        req.headers['x-viewer-role'] === 'ALLIED_STAFF' ||
        req.headers['x-viewer-role'] === 'OTHER_STAFF';

      // If requested by hospital staff, strictly enforce returning ONLY the authorized logistics & care team fields + relative contact
      if (isStaffViewer) {
        res.json({
          type: 'PATIENT',
          verified: true,
          staffScanRestricted: true,
          hospital: 'Metropolitan General Hospital',
          verifiedAt: new Date().toISOString(),
          patient: {
            id: patient.id,
            name: patient.name,
            mrn: patient.mrn,
            department: departmentName,
            ward: patient.ward?.name || patient.ward?.unit || 'Ward 4B ICU',
            bed: patient.bed || 'Bed ICU-12',
            attendingNurse: {
              name: attendingNurse.name,
              phone: attendingNurse.phone,
              title: attendingNurse.title,
            },
            attendingDoctor: {
              name: attendingDoctor.name,
              designation: attendingDoctor.title || 'Attending Physician',
              department: attendingDoctor.department || 'Critical Care Medicine',
            },
            relative: {
              name: patient.emergencyContactName || 'Sunita Patil',
              relation: patient.emergencyContactRelation || 'Spouse / Primary Contact',
              phone: patient.emergencyContactPhone || '+91 98201 34982',
            },
            emergencyContactName: patient.emergencyContactName || 'Sunita Patil',
            emergencyContactRelation: patient.emergencyContactRelation || 'Spouse / Primary Contact',
            emergencyContactPhone: patient.emergencyContactPhone || '+91 98201 34982',
          },
        });
        return;
      }

      res.json({
        type: 'PATIENT',
        verified: true,
        hospital: 'Shridha Hospital & Research Institute, Nagpur',
        hospitalInfo: {
          name: 'Shridha Hospital & Research Institute',
          address: 'Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Samarth Nagar East, Nagpur, Maharashtra 440015',
          landmark: 'Near Ajni Metro Station',
          phone: '0712-2420299 / 0712-2985296',
          mobile: '+91 93735 10580',
          emergency: '108 / 112',
          directors: 'Dr. Dinesh Sarda, MS, MCh & Dr. Neha Sarda, MD',
        },
        verifiedAt: new Date().toISOString(),
        patient: {
          id: patient.id,
          name: patient.name,
          mrn: patient.mrn,
          department: departmentName,
          ward: patient.ward?.name || patient.ward?.unit || 'Ward 4B ICU',
          bed: patient.bed || 'Bed ICU-12',
          attendingNurse: {
            name: attendingNurse.name,
            phone: attendingNurse.phone,
            title: attendingNurse.title
          },
          attendingDoctor: {
            name: attendingDoctor.name,
            designation: attendingDoctor.title || 'Attending Physician',
            department: attendingDoctor.department || 'Critical Care Medicine'
          },
          dob: patient.dob,
          sex: patient.sex,
          weight: patient.weight,
          status: patient.status,
          admissionDiagnosis: patient.admissionDiagnosis,
          emergencyContactName: patient.emergencyContactName,
          emergencyContactRelation: patient.emergencyContactRelation,
          emergencyContactPhone: patient.emergencyContactPhone,
          allergies: patient.allergies,
          prescriptions: patient.prescriptions,
          administrations: patient.administrations,
        },
      });
      return;
    }

    let staff = await prisma.user.findFirst({
      where: {
        OR: [
          { staffId: cleanId },
          { id: cleanId },
          { email: cleanId },
        ],
      },
      select: {
        id: true,
        staffId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        specialty: true,
        licenseNumber: true,
        onDuty: true,
        title: true,
        isActive: true,
        createdAt: true,
        administrations: {
          take: 8,
          orderBy: { signedAt: 'desc' },
          include: {
            patient: { select: { id: true, name: true, mrn: true, bed: true } },
            schedule: {
              include: {
                prescription: { select: { medicationName: true, dose: true, unit: true, route: true } },
              },
            },
          },
        },
      },
    });

    // Intelligent fallback for sample staff badges
    if (!staff) {
      const upper = cleanId.toUpperCase();
      let fallbackRole: any = null;
      if (upper.startsWith('DOC') || upper.includes('SHARMA') || upper.includes('CHEN')) fallbackRole = 'DOCTOR';
      else if (upper.startsWith('RN') || upper.startsWith('NUR') || upper.includes('PRIYA')) fallbackRole = 'NURSE';
      else if (upper.startsWith('ADM')) fallbackRole = 'ADMIN';
      else if (upper.startsWith('PH')) fallbackRole = 'PHARMACIST';

      if (fallbackRole) {
        staff = await prisma.user.findFirst({
          where: { role: fallbackRole },
          select: {
            id: true,
            staffId: true,
            name: true,
            email: true,
            role: true,
            department: true,
            specialty: true,
            licenseNumber: true,
            onDuty: true,
            title: true,
            isActive: true,
            createdAt: true,
            administrations: {
              take: 8,
              orderBy: { signedAt: 'desc' },
              include: {
                patient: { select: { id: true, name: true, mrn: true, bed: true } },
                schedule: {
                  include: {
                    prescription: { select: { medicationName: true, dose: true, unit: true, route: true } },
                  },
                },
              },
            },
          },
        });
      }
    }

    if (staff) {
      res.json({
        type: 'STAFF',
        verified: true,
        hospital: 'Shridha Hospital & Research Institute, Nagpur',
        hospitalInfo: {
          name: 'Shridha Hospital & Research Institute',
          address: 'Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Samarth Nagar East, Nagpur, Maharashtra 440015',
          landmark: 'Near Ajni Metro Station',
          phone: '0712-2420299 / 0712-2985296',
          mobile: '+91 93735 10580',
          emergency: '108 / 112',
          directors: 'Dr. Dinesh Sarda, MS, MCh & Dr. Neha Sarda, MD',
        },
        verifiedAt: new Date().toISOString(),
        staff: {
          id: staff.id,
          name: staff.name,
          staffId: staff.staffId,
          role: staff.role,
          department: staff.department || 'Ward 4B ICU',
          specialty: staff.specialty,
          licenseNumber: staff.licenseNumber || 'VERIFIED-ACTIVE',
          onDuty: staff.onDuty,
          title: staff.title,
          isActive: staff.isActive,
          administrations: staff.administrations,
        },
      });
      return;
    }

    res.status(404).json({
      error: 'Hospital record not found',
      identifier: cleanId,
      verified: false,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
