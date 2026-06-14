/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Office, User, Document, AccountabilityLog, Notification } from './types';

export const INITIAL_OFFICES: Office[] = [
  {
    office_id: 'OFF-REG',
    office_name: 'Registrar Office',
    department: 'Records and Enrollment Academic Services',
  },
  {
    office_id: 'OFF-ACC',
    office_name: 'Accounting and Cashiers Office',
    department: 'Finance and Operations Division',
  },
  {
    office_id: 'OFF-DEAN',
    office_name: 'Office of the Academic Dean',
    department: 'Academic Affairs Division',
  },
  {
    office_id: 'OFF-IT',
    office_name: 'IT Program Head Office',
    department: 'Information Technology Division',
  },
  {
    office_id: 'OFF-OSA',
    office_name: 'Office of Student Affairs (OSA)',
    department: 'Student Services and Welfare Division',
  },
  {
    office_id: 'OFF-GUID',
    office_name: 'Guidance Office',
    department: 'Student Guidance and Counseling',
  },
  {
    office_id: 'OFF-VPAA',
    office_name: 'Office of the VP for Academic Affairs (VPAA)',
    department: 'Academic Administration Affairs',
  },
];

export const INITIAL_USERS: User[] = [
  {
    user_id: 'USR-ADMIN1',
    full_name: 'Theo Nathan E. Anonas',
    email: 'theo.anonas303@gmail.com',
    role: 'Admin',
    office_id: 'OFF-DEAN',
  },
  {
    user_id: 'USR-STAFF1',
    full_name: 'Jessie Mar Bescayno',
    email: 'jessie.bescayno@ckcgingoog.edu.ph',
    role: 'Administrative Staff',
    office_id: 'OFF-REG',
  },
  {
    user_id: 'USR-STAFF2',
    full_name: 'Hannah Jansien Caday',
    email: 'hannah.caday@ckcgingoog.edu.ph',
    role: 'Administrative Staff',
    office_id: 'OFF-ACC',
  },
  {
    user_id: 'USR-STAFF3',
    full_name: 'Kurt Jason M. Sacupayo',
    email: 'kurt.sacupayo@ckcgingoog.edu.ph',
    role: 'Administrative Staff',
    office_id: 'OFF-OSA',
  },
  {
    user_id: 'USR-STAFF4',
    full_name: 'Carlito Cabasag',
    email: 'carlito.cabasag@ckcgingoog.edu.ph',
    role: 'Administrative Staff',
    office_id: 'OFF-IT',
  },
  {
    user_id: 'USR-STUD1',
    full_name: 'John Paul L. Gundaya',
    email: 'johnpaul.gundaya@ckcgingoog.edu.ph',
    role: 'Student',
  },
  {
    user_id: 'USR-STUD2',
    full_name: 'Lordwen M. Ramoso',
    email: 'lordwen.ramoso@ckcgingoog.edu.ph',
    role: 'Student',
  },
  {
    user_id: 'USR-STUD3',
    full_name: 'John Renzo Rubin',
    email: 'renzo.rubin@ckcgingoog.edu.ph',
    role: 'Student',
  },
];

export const INITIAL_DOCUMENTS: Document[] = [
  {
    doc_id: 'DOC-2026-0001',
    title: 'Transcript of Records (TOR) request - John Paul L. Gundaya',
    type: 'Transcript of Records (TOR)',
    current_status: 'Processing',
    date_received: '2026-06-01T08:30:00Z',
    office_id: 'OFF-REG',
    creator_id: 'USR-STUD1',
    file_name: 'gundaya_tor_request.docx',
    file_size: '42 KB',
    file_format: 'docx',
  },
  {
    doc_id: 'DOC-2026-0002',
    title: 'Academic Year Clearance clearance form',
    type: 'Clearance Form',
    current_status: 'Completed',
    date_received: '2026-06-02T10:15:05Z',
    office_id: 'OFF-REG',
    creator_id: 'USR-STUD2',
    file_name: 'ramoso_clearance_final.doc',
    file_size: '124 KB',
    file_format: 'doc',
  },
  {
    doc_id: 'DOC-2026-0003',
    title: 'Grade slip discrepancies correction - John Renzo Rubin',
    type: 'Grade Slips',
    current_status: 'Pending',
    date_received: '2026-06-05T14:22:10Z',
    office_id: 'OFF-REG',
    creator_id: 'USR-STUD3',
    file_name: 'rubin_grade_slip_discrepancy.txt',
    file_size: '12 KB',
    file_format: 'txt',
  },
  {
    doc_id: 'DOC-2026-0004',
    title: 'Capstone platform Project Proposal for Christ the King College',
    type: 'Project Proposals',
    current_status: 'Forwarded',
    date_received: '2026-06-04T09:00:00Z',
    office_id: 'OFF-DEAN',
    creator_id: 'USR-STUD1',
    file_name: 'docutrack_proposal_v2.docx',
    file_size: '2.4 MB',
    file_format: 'docx',
  },
];

export const INITIAL_LOGS: AccountabilityLog[] = [
  {
    log_id: 'LOG-0001',
    doc_id: 'DOC-2026-0001',
    user_id: 'USR-STUD1',
    user_name: 'John Paul L. Gundaya',
    user_role: 'Student',
    action_taken: 'Document Registered',
    remarks: 'Submitted TOR request for evaluation and job search references.',
    timestamp: '2026-06-01T08:30:00Z',
  },
  {
    log_id: 'LOG-0002',
    doc_id: 'DOC-2026-0001',
    user_id: 'USR-STAFF1',
    user_name: 'Jessie Mar Bescayno',
    user_role: 'Administrative Staff',
    action_taken: 'Status Updated to Processing',
    remarks: 'Document acknowledged. Commencing verification of major/minor subjects marks.',
    timestamp: '2026-06-01T11:45:00Z',
  },
  {
    log_id: 'LOG-0003',
    doc_id: 'DOC-2026-0002',
    user_id: 'USR-STUD2',
    user_name: 'Lordwen M. Ramoso',
    user_role: 'Student',
    action_taken: 'Document Registered',
    remarks: 'Year-end Clearance document submission for graduation eligibility.',
    timestamp: '2026-06-02T10:15:05Z',
  },
  {
    log_id: 'LOG-0004',
    doc_id: 'DOC-2026-0002',
    user_id: 'USR-STAFF1',
    user_name: 'Jessie Mar Bescayno',
    user_role: 'Administrative Staff',
    action_taken: 'Status Updated to Completed',
    remarks: 'All requirements cleared. Registered under graduate directory successfully.',
    timestamp: '2026-06-03T16:00:00Z',
  },
  {
    log_id: 'LOG-0005',
    doc_id: 'DOC-2026-0003',
    user_id: 'USR-STUD3',
    user_name: 'John Renzo Rubin',
    user_role: 'Student',
    action_taken: 'Document Registered',
    remarks: 'Missing grade for IT 312 Database Systems in second semester.',
    timestamp: '2026-06-05T14:22:10Z',
  },
  {
    log_id: 'LOG-0006',
    doc_id: 'DOC-2026-0004',
    user_id: 'USR-STUD1',
    user_name: 'John Paul L. Gundaya',
    user_role: 'Student',
    action_taken: 'Document Registered',
    remarks: 'Capstone Proposal submission for DocuTrack platform.',
    timestamp: '2026-06-04T09:00:00Z',
  },
  {
    log_id: 'LOG-0007',
    doc_id: 'DOC-2026-0004',
    user_id: 'USR-STAFF1',
    user_name: 'Jessie Mar Bescayno',
    user_role: 'Administrative Staff',
    action_taken: 'Forwarded Document to Office of the Academic Dean',
    remarks: 'Academic and administrative review checklist verified. Forwarding to Dean Cabinets.',
    timestamp: '2026-06-04T13:10:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    notification_id: 'NTF-0001',
    recipient_id: 'USR-STUD1',
    title: 'Transcript of Records Processing',
    message: 'Your request DOC-2026-0001 has been changed to "Processing" by Jessie Mar Bescayno at Registrar Office.',
    doc_id: 'DOC-2026-0001',
    is_read: false,
    timestamp: '2026-06-01T11:45:00Z',
  },
  {
    notification_id: 'NTF-0002',
    recipient_id: 'USR-STUD2',
    title: 'Document Milestone Cleared 🎉',
    message: 'Your Clearance Form DOC-2026-0002 has been successfully completed under graduate directory guidelines.',
    doc_id: 'DOC-2026-0002',
    is_read: true,
    timestamp: '2026-06-03T16:00:00Z',
  },
  {
    notification_id: 'NTF-0003',
    recipient_id: 'OFF-DEAN',
    title: 'Incoming Dispatch Pending Clearance',
    message: 'Registrar Office has forwarded a new Capstone Project Proposal (DOC-2026-0004) to the Academic Dean station.',
    doc_id: 'DOC-2026-0004',
    is_read: false,
    timestamp: '2026-06-04T13:10:00Z',
  },
  {
    notification_id: 'NTF-0004',
    recipient_id: 'OFF-REG',
    title: 'New Document Submitted',
    message: 'Student John Renzo Rubin has submitted a Grade Slips dispute (DOC-2026-0003) for Registrar review.',
    doc_id: 'DOC-2026-0003',
    is_read: false,
    timestamp: '2026-06-05T14:22:10Z',
  }
];

// Helper functions for state
export const STORAGE_KEYS = {
  OFFICES: 'docutrack_offices',
  USERS: 'docutrack_users',
  DOCUMENTS: 'docutrack_documents',
  LOGS: 'docutrack_logs',
  NOTIFICATIONS: 'docutrack_notifications',
};

export function getStoredData() {
  const officesStr = localStorage.getItem(STORAGE_KEYS.OFFICES);
  const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
  const documentsStr = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
  const logsStr = localStorage.getItem(STORAGE_KEYS.LOGS);
  const notificationsStr = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

  return {
    offices: officesStr ? JSON.parse(officesStr) : INITIAL_OFFICES,
    users: usersStr ? JSON.parse(usersStr) : INITIAL_USERS,
    documents: documentsStr ? JSON.parse(documentsStr) : INITIAL_DOCUMENTS,
    logs: logsStr ? JSON.parse(logsStr) : INITIAL_LOGS,
    notifications: notificationsStr ? JSON.parse(notificationsStr) : INITIAL_NOTIFICATIONS,
  };
}

export function saveStoredData(data: {
  offices: Office[];
  users: User[];
  documents: Document[];
  logs: AccountabilityLog[];
  notifications: Notification[];
}) {
  localStorage.setItem(STORAGE_KEYS.OFFICES, JSON.stringify(data.offices));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(data.documents));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
}

// Predefined Document Types represented within Christ the King College
export const CKC_DOCUMENT_TYPES = [
  'Transcript of Records (TOR)',
  'Grade Slips',
  'Enrollment Forms',
  'Clearance Forms',
  'Certifications',
  'Project Proposals',
  'Internal Reports',
];
