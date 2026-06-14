/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Network, Database, UserPlus, Trash2, ShieldCheck, BarChart3, HelpCircle, FileClock, Users, Compass, Search, PlusCircle, CheckCircle, AlertCircle, FileText, ShieldAlert, Edit3, Archive, Download, ClipboardList, CheckCircle2, Lock, Zap, Sparkles, Eye, ClipboardCheck, ArrowRight, Upload } from 'lucide-react';
import { Document, AccountabilityLog, Office, User, Role, ALLOWED_DOCUMENT_EXTENSIONS, GET_CANNED_REMARKS_BY_TYPE } from '../types';
import { CKC_DOCUMENT_TYPES } from '../initialData';

interface AdminWorkspaceProps {
  offices: Office[];
  users: User[];
  documents: Document[];
  logs: AccountabilityLog[];
  onAddUser: (newUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddOffice: (newOffice: Office) => void;
  onUpdateDocument: (updatedDoc: Document, newLog: AccountabilityLog) => void;
  onAddDocument: (newDoc: Document, initialLog: AccountabilityLog) => void;
}

const DEAN_CANNED_REMARKS_TEMPLATES = [
  { label: "-- Select Dean Resolution Template --", value: "" },
  { label: "✅ Dean Academic Approval (All criteria met)", value: "Academic Dean Clearance Approved: Reviewed graduation records and physical academic logs thoroughly. Student satisfies all credit distributions and institutional benchmarks." },
  { label: "⚠️ Dean Curricular Deficiency Notice (On Hold)", value: "Academic Dean Curricular Deficiency: Course credit discrepancy identified in program checklists. Document processing held pending elective prerequisite alignments." },
  { label: "➡️ Escalated to VPAA for Executive Clearance", value: "Escalated to VP for Academic Affairs: File has been pre-evaluated under department guidelines and is hereby routed to VPAA office for executive authorization." },
  { label: "❌ Academic Rejection / Retract Request", value: "Dean Academic Rejection: Document filing does not conform to standardized school formatting parameters or demonstrates grade slip inaccuracies. Student must re-apply." }
];

export default function AdminWorkspace({
  offices,
  users,
  documents,
  logs,
  onAddUser,
  onDeleteUser,
  onAddOffice,
  onUpdateDocument,
  onAddDocument,
}: AdminWorkspaceProps) {
  // Navigation Tabs inside Admin workspace
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'offices' | 'logs' | 'override' | 'archive' | 'dean_desk' | 'send_doc'>('analytics');

  // Academic Dean's Desk specific state variables
  const [deanSelectedDocId, setDeanSelectedDocId] = useState<string | null>(null);
  const [deanSearchQuery, setDeanSearchQuery] = useState('');
  const [deanStatusFilter, setDeanStatusFilter] = useState('All');
  const [deanNewStatus, setDeanNewStatus] = useState<Document['current_status']>('Processing');
  const [deanForwardOfficeId, setDeanForwardOfficeId] = useState('');
  const [deanRemarks, setDeanRemarks] = useState('');
  const [deanForwardDescription, setDeanForwardDescription] = useState('');
  const [deanUpdateError, setDeanUpdateError] = useState<string | null>(null);
  const [deanUpdateSuccess, setDeanUpdateSuccess] = useState<string | null>(null);

  // User Registration State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('Student');
  const [newUserOfficeId, setNewUserOfficeId] = useState('');
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // Office Management State
  const [newOfficeId, setNewOfficeId] = useState('');
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeDept, setNewOfficeDept] = useState('');
  const [officeError, setOfficeError] = useState<string | null>(null);
  const [officeSuccess, setOfficeSuccess] = useState<string | null>(null);

  // Search/Filters inside tabs
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Executive Overrides State
  const [overrideSelectedDocId, setOverrideSelectedDocId] = useState<string | null>(null);
  const [overrideSearchQuery, setOverrideSearchQuery] = useState('');
  const [overrideOfficeFilter, setOverrideOfficeFilter] = useState<string>('All');
  const [overrideStatus, setOverrideStatus] = useState<Document['current_status']>('Pending');
  const [overrideOfficeId, setOverrideOfficeId] = useState('');
  const [overrideRemarks, setOverrideRemarks] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  // Admin Send Document State
  const [sendTitle, setSendTitle] = useState('');
  const [sendDescription, setSendDescription] = useState('');
  const [sendType, setSendType] = useState(CKC_DOCUMENT_TYPES[0]);
  const [sendTargetOfficeId, setSendTargetOfficeId] = useState('');
  const [sendFileName, setSendFileName] = useState('');
  const [sendFileSize, setFileSize] = useState('');
  const [sendFileFormat, setFileFormat] = useState('');
  const [sendFileError, setSendFileError] = useState<string | null>(null);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendDragActive, setSendDragActive] = useState(false);
  const [sendStudentId, setSendStudentId] = useState('');

  // Extract student users in simulator for student owner assignment
  const students = (users || []).filter(u => u.role === 'Student');

  // Auto initialize target recipient office and default student owner
  React.useEffect(() => {
    if (offices.length > 0 && !sendTargetOfficeId) {
      setSendTargetOfficeId(offices[0].office_id);
    }
  }, [offices, sendTargetOfficeId]);

  React.useEffect(() => {
    if (students.length > 0 && !sendStudentId) {
      setSendStudentId(students[0].user_id);
    }
  }, [students, sendStudentId]);

  // File validator for Admin - Strict standard formats ONLY, unlimited sizes
  const validateAndSetSendFile = (fileNameOriginal: string, bytesSize: number) => {
    setSendFileError(null);
    setSendSuccessMessage(null);
    
    const fileExt = '.' + fileNameOriginal.split('.').pop()?.toLowerCase();
    const isFormatOk = ALLOWED_DOCUMENT_EXTENSIONS.includes(fileExt);
    if (!isFormatOk) {
      setSendFileError(`Validation Error: Format "${fileExt}" is restricted. Only standard document files are permitted (.doc, .docx, .pdf, .txt, .wps, .wpd).`);
      setSendFileName('');
      return;
    }

    let formattedSize = '';
    if (bytesSize >= 1024 * 1024) {
      formattedSize = (bytesSize / (1024 * 1024)).toFixed(1) + ' MB (Premium Asset Link)';
    } else if (bytesSize >= 1024) {
      formattedSize = (bytesSize / 1024).toFixed(1) + ' KB';
    } else {
      formattedSize = bytesSize + ' Bytes';
    }

    setSendFileName(fileNameOriginal);
    setFileSize(formattedSize);
    setFileFormat(fileExt);
  };

  const handleAdminSubmitDocument = (e: React.FormEvent) => {
    e.preventDefault();
    setSendFileError(null);
    setSendSuccessMessage(null);

    if (!sendTitle.trim()) {
      setSendFileError('Validation Error: Document title is mandatory.');
      return;
    }
    if (!sendFileName) {
      setSendFileError('Validation Error: You must pick a valid document log attachment.');
      return;
    }

    const docId = `DOC-${Date.now()}`;
    const newDoc: Document = {
      doc_id: docId,
      title: sendTitle.trim(),
      type: sendType,
      description: sendDescription.trim(),
      current_status: 'Pending',
      office_id: sendTargetOfficeId,
      file_name: sendFileName,
      file_size: sendFileSize,
      file_format: sendFileFormat,
      creator_id: sendStudentId || 'USR-ADMIN-1',
      date_received: new Date().toISOString(),
      viewed_by_staff: false,
      is_archived: false,
    };

    const initialLog: AccountabilityLog = {
      log_id: `LOG-${Date.now()}`,
      doc_id: docId,
      user_id: 'USR-ADMIN-1',
      user_name: 'System Administrator [Admin Desk]',
      user_role: 'Admin',
      action_taken: 'Document Dispatched',
      remarks: `Official system clearance track dispatched on authority of System Administrator. Student Owner: ${students.find(s => s.user_id === sendStudentId)?.full_name || 'N/A'}. Description: ${sendDescription.trim() || 'None provided.'}`,
      timestamp: new Date().toISOString(),
    };

    onAddDocument(newDoc, initialLog);

    setSendSuccessMessage(`Document successfully logged and routed! Assigned tracker ID: ${docId}. Assigned recipient: ${sendTargetOfficeId}.`);
    
    // Clear state
    setSendTitle('');
    setSendDescription('');
    setSendFileName('');
    setFileSize('');
    setFileFormat('');
  };

  // Helper virtual download blob constructor for tracking records
  const handleDownloadDocFile = (doc: Document) => {
    const docLogs = logs.filter(l => l.doc_id === doc.doc_id);
    const originOfficeObj = offices.find((o) => o.office_id === doc.office_id);
    const contentLines = [
      `======================================================`,
      ` CHRIST THE KING COLLEGE - DOCUMENT DIRECT EXPORT`,
      `======================================================`,
      `Document Reference ID : ${doc.doc_id}`,
      `Subject / Title       : ${doc.title}`,
      `Service Classification: ${doc.type}`,
      `Detailed Description  : ${doc.description || 'No description populated.'}`,
      `Current Station Status: ${doc.current_status}`,
      `Current Office Desk   : ${originOfficeObj ? originOfficeObj.office_name : doc.office_id}`,
      `Asset Filename        : ${doc.file_name}`,
      `Asset Capacity Size   : ${doc.file_size}`,
      `Format Type Extension : ${doc.file_format}`,
      `Date Registered       : ${new Date(doc.date_received).toLocaleString()}`,
      `Registrant Account ID : ${doc.creator_id}`,
      ``,
      `------------------------------------------------------`,
      ` WORKFLOW AND COMPLIANCE AUDIT HISTORY LOGS`,
      `------------------------------------------------------`,
      ...docLogs.map((log, idx) => {
        return `[LOG #${idx + 1}] Timestamp: ${new Date(log.timestamp).toLocaleString()}\n        Actioned By : ${log.user_name} (${log.user_role})\n        Operational : ${log.action_taken}\n        Justification: "${log.remarks}"\n`;
      }),
      `------------------------------------------------------`,
      `[REGISTRY MANUAL REDIRECT & RE-EDIT POLICY]`,
      `This export satisfies university compliance. The active department desk officer or university administrator who owns the document's custody is permitted legally to alter elements inside the live digital tracking hub.`,
    ].join('\n');
    
    // Choose mime type based on extension
    let mimeType = 'text/plain;charset=utf-8';
    const ext = (doc.file_format || '').toLowerCase().replace(/^\./, '');
    if (ext === 'pdf') {
      mimeType = 'application/pdf';
    } else if (ext === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === 'doc') {
      mimeType = 'application/msword';
    } else if (ext === 'wps') {
      mimeType = 'application/vnd.ms-works';
    } else if (ext === 'wpd') {
      mimeType = 'application/wordperfect';
    }

    const blob = new Blob([contentLines], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name; // Use original file name including extension
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Dean's Workspace Operational Handlers
  const handleDeanSelectDoc = (doc: Document) => {
    setDeanSelectedDocId(doc.doc_id);
    setDeanNewStatus(doc.current_status === 'Pending' ? 'Processing' : doc.current_status);
    setDeanRemarks('');
    setDeanForwardDescription('');
    setDeanUpdateError(null);
    setDeanUpdateSuccess(null);

    const availableOffices = offices.filter(o => o.office_id !== 'OFF-DEAN');
    if (availableOffices.length > 0) {
      setDeanForwardOfficeId(availableOffices[0].office_id);
    }

    // Auto mark viewed / unread lock removal
    if (!doc.viewed_by_staff) {
      const updatedDoc: Document = { ...doc, viewed_by_staff: true };
      const logMsg: AccountabilityLog = {
        log_id: `LOG-${Date.now()}`,
        doc_id: doc.doc_id,
        user_id: 'USR-ADMIN1',
        user_name: 'Theo Nathan E. Anonas (Dean)',
        user_role: 'Admin',
        action_taken: 'Unread Lock Cleared',
        remarks: 'Cleared incoming queue unread lock. Document opened, verified physically, and contents evaluated.',
        timestamp: new Date().toISOString(),
      };
      onUpdateDocument(updatedDoc, logMsg);
    }
  };

  const handleDeanStatusTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeanUpdateError(null);
    setDeanUpdateSuccess(null);

    const activeDoc = documents.find((d) => d.doc_id === deanSelectedDocId);
    if (!activeDoc) return;

    if (deanNewStatus !== 'Forwarded') {
      if (!deanRemarks.trim()) {
        setDeanUpdateError('Academic Dean regulations mandate professional remarks before routing/approving.');
        return;
      }
    } else {
      if (!deanForwardDescription.trim()) {
        setDeanUpdateError('Academic Dean regulations require a forwarding description / dispatch notes before routing.');
        return;
      }
      if (deanForwardDescription.trim().length < 8) {
        setDeanUpdateError('Validation Check Failed! Forwarding instructions/description must be at least 8 characters.');
        return;
      }
    }

    const updatedDoc: Document = {
      ...activeDoc,
      current_status: deanNewStatus,
      office_id: deanNewStatus === 'Forwarded' ? deanForwardOfficeId : activeDoc.office_id,
      viewed_by_staff: deanNewStatus === 'Forwarded' ? false : true,
    };

    const targetOfficeObj = offices.find((o) => o.office_id === deanForwardOfficeId);
    const originOfficeObj = offices.find((o) => o.office_id === activeDoc.office_id);
    const originName = originOfficeObj ? originOfficeObj.office_name : activeDoc.office_id;
    const destName = targetOfficeObj ? targetOfficeObj.office_name : deanForwardOfficeId;

    const finalDeanRemarks = deanNewStatus === 'Forwarded'
      ? `Dean Academic Routing Dispatch: Forwarded from ${originName} to ${destName}. Dispatch Notes: ${deanForwardDescription.trim()}`
      : deanRemarks.trim();

    const newLog: AccountabilityLog = {
      log_id: `LOG-${Date.now()}`,
      doc_id: activeDoc.doc_id,
      user_id: 'USR-ADMIN1',
      user_name: 'Theo Nathan E. Anonas (Dean)',
      user_role: 'Admin',
      action_taken: deanNewStatus === 'Forwarded' 
        ? `Forwarded from ${originName} to ${destName}` 
        : `Marked as ${deanNewStatus}`,
      remarks: finalDeanRemarks,
      timestamp: new Date().toISOString(),
    };

    onUpdateDocument(updatedDoc, newLog);
    setDeanUpdateSuccess(`Document updated successfully to ${deanNewStatus}!`);
    setDeanRemarks('');
    setDeanForwardDescription('');

    setTimeout(() => {
      setDeanSelectedDocId(null);
      setDeanUpdateSuccess(null);
    }, 1500);
  };

  const handleDeanQuickStamp = (doc: Document, status: Document['current_status'], comment: string) => {
    const updatedDoc: Document = {
      ...doc,
      current_status: status,
      viewed_by_staff: true,
    };
    const newLog: AccountabilityLog = {
      log_id: `LOG-${Date.now()}`,
      doc_id: doc.doc_id,
      user_id: 'USR-ADMIN1',
      user_name: 'Theo Nathan E. Anonas (Dean)',
      user_role: 'Admin',
      action_taken: `Marked ${status} (Quick)`,
      remarks: comment,
      timestamp: new Date().toISOString(),
    };
    onUpdateDocument(updatedDoc, newLog);
  };

  const handleSelectDocForOverride = (doc: Document) => {
    setOverrideSelectedDocId(doc.doc_id);
    setOverrideStatus(doc.current_status);
    setOverrideOfficeId(doc.office_id);
    setOverrideRemarks('');
    setOverrideError(null);
    setOverrideSuccess(null);
  };

  // ----------------------------------------------------
  // Quantitative Reporting & Analytics Calculation
  // ----------------------------------------------------
  
  // 1. Bottleneck Finder: Documents stationed per office
  const docsPerOffice = offices.map((office) => {
    const count = documents.filter((doc) => doc.office_id === office.office_id).length;
    const activeStates = documents.filter(
      (doc) => doc.office_id === office.office_id && (doc.current_status === 'Pending' || doc.current_status === 'Processing')
    ).length;
    
    return {
      id: office.office_id,
      name: office.office_name,
      totalCount: count,
      cloggedCount: activeStates, // Clogged represent pending or processing documents
    };
  });

  const maxTotalDocs = Math.max(...docsPerOffice.map((o) => o.totalCount), 1);

  // 2. Document Status Breakdown stats
  const statusStats = {
    pending: documents.filter((d) => d.current_status === 'Pending').length,
    processing: documents.filter((d) => d.current_status === 'Processing').length,
    forwarded: documents.filter((d) => d.current_status === 'Forwarded').length,
    completed: documents.filter((d) => d.current_status === 'Completed').length,
    rejected: documents.filter((d) => d.current_status === 'Rejected').length,
    total: documents.length,
  };

  // 3. Document types statistical volume
  const typeVolume = CKC_DOCUMENT_TYPES.map((type) => {
    const count = documents.filter((d) => d.type === type).length;
    return { type, count };
  }).sort((a, b) => b.count - a.count);

  const maxTypeCount = Math.max(...typeVolume.map((t) => t.count), 1);

  // Handle User Registration
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(null);

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setUserError('Registrant full name and email are mandatory parameters.');
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      setUserError(`An institutional account with email "${newUserEmail}" is already registered.`);
      return;
    }

    const assignedOffice = newUserRole !== 'Student' ? newUserOfficeId || offices[0]?.office_id : undefined;

    const newUser: User = {
      user_id: `USR-${Date.now()}`,
      full_name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      office_id: assignedOffice,
    };

    onAddUser(newUser);

    setUserSuccess(`Registered ${newUserName}! Institutional credentials enabled for role "${newUserRole}".`);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Student');
    setNewUserOfficeId('');
  };

  // Handle Office creation
  const handleCreateOffice = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficeError(null);
    setOfficeSuccess(null);

    const cleanId = newOfficeId.trim().toUpperCase();

    if (!cleanId || !newOfficeName.trim() || !newOfficeDept.trim()) {
      setOfficeError('Please provide all parameters: Office code, descriptive name, and academic program.');
      return;
    }

    if (offices.some((o) => o.office_id === cleanId)) {
      setOfficeError(`Station code "${cleanId}" already registered to another office.`);
      return;
    }

    const newOffice: Office = {
      office_id: cleanId,
      office_name: newOfficeName.trim(),
      department: newOfficeDept.trim(),
    };

    onAddOffice(newOffice);

    setOfficeSuccess(`School Location Office "${cleanId} - ${newOfficeName}" added to directory successfully!`);
    setNewOfficeId('');
    setNewOfficeName('');
    setNewOfficeDept('');
  };

  // Handle Quantitative Exporting (CSV Spreadsheet Backup) - Admin Suggestion 1
  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Document ID', 'Signer Name', 'Role', 'Action Executed', 'Remarks'];
    
    // Map log fields, escaping quotes and stripping newlines for clean tabular rendering
    const rows = logs.map(log => [
      log.log_id,
      new Date(log.timestamp).toISOString(),
      log.doc_id,
      log.user_name,
      log.user_role,
      log.action_taken,
      log.remarks.replace(/"/g, '""').replace(/\n/g, ' ')
    ]);

    // Format rows into standard CSV string lines of standard spreadsheets
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CKC_DocuTrack_Spreadsheet_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs for log search and display reverse chronological
  const filteredLogs = logs
    .filter((log) => {
      const q = logSearchQuery.toLowerCase();
      return (
        log.doc_id.toLowerCase().includes(q) ||
        log.user_name.toLowerCase().includes(q) ||
        log.action_taken.toLowerCase().includes(q) ||
        log.remarks.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter users directory list
  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6" id="admin-workspace">
      
      {/* Upper Navigation menu for Governor Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="font-sans font-bold text-slate-900 text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Administrative Console
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Control center for school systems governance, reporting, and registry maintenance</p>
        </div>

        {/* Console Nav buttons */}
        <div className="flex flex-wrap gap-1.5" id="admin-console-tab-list">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-indigo-600 font-semibold text-white border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
            id="tab-analytics-btn"
          >
            <BarChart3 className="inline-block w-3.5 h-3.5 mr-1 align-text-bottom" />
            Analytics
          </button>

          {/* Academic Dean Desk Workspace Tab Button with Live Counter Badge */}
          {(() => {
            const deanPendingCount = documents.filter(d => d.office_id === 'OFF-DEAN' && d.current_status !== 'Completed' && d.current_status !== 'Rejected' && !d.is_archived).length;
            return (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('dean_desk');
                  setDeanSelectedDocId(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dean_desk' 
                    ? 'bg-indigo-600 font-semibold text-white border-indigo-600 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                id="tab-dean-desk-btn"
              >
                <ClipboardList className="inline-block w-3.5 h-3.5" />
                <span>Dean's Desk</span>
                {deanPendingCount > 0 && (
                  <span className="inline-flex items-center justify-center bg-rose-500 text-white font-sans text-[10px] font-extrabold w-4.5 h-4.5 rounded-full shrink-0">
                    {deanPendingCount}
                  </span>
                )}
              </button>
            );
          })()}
          
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-indigo-600 font-semibold text-white border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
            id="tab-users-btn"
          >
            <Users className="inline-block w-3.5 h-3.5 mr-1 align-text-bottom" />
            Users
          </button>

          <button
            onClick={() => setActiveTab('offices')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              activeTab === 'offices' ? 'bg-indigo-600 font-semibold text-white border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
            id="tab-offices-btn"
          >
            <Compass className="inline-block w-3.5 h-3.5 mr-1 align-text-bottom" />
            Offices
          </button>

          {/* Logs button removed for Admin - authorization moved to Super Admin */}

          <button
            onClick={() => setActiveTab('override')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              activeTab === 'override' ? 'bg-rose-600 font-semibold text-white border-rose-600 shadow-sm' : 'bg-white hover:bg-rose-50/50 text-rose-700 border-rose-200/80 hover:border-rose-300'
            }`}
            id="tab-override-btn"
          >
            <ShieldAlert className="inline-block w-3.5 h-3.5 mr-1 align-text-bottom text-rose-500" />
            Overrides
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              activeTab === 'archive' ? 'bg-emerald-600 font-semibold text-white border-emerald-600 shadow-sm' : 'bg-white hover:bg-emerald-50/50 text-emerald-700 border-emerald-200/80 hover:border-emerald-300'
            }`}
            id="tab-archive-btn"
          >
            <Archive className="inline-block w-3.5 h-3.5 mr-1 align-text-bottom text-emerald-600" />
            Archives
          </button>

          <button
            onClick={() => setActiveTab('send_doc')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'send_doc' ? 'bg-teal-600 font-semibold text-white border-teal-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            id="tab-send-doc-btn"
          >
            <PlusCircle className="inline-block w-3.5 h-3.5 text-teal-600" />
            <span>Send Doc</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          TAB SYSTEM CONSOLE DOCUMENT SEND / DISPATCH (UNLIMITED)
          ---------------------------------------------------- */}
      {activeTab === 'send_doc' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 animate-fadeIn" id="panel-admin-send-doc">
          <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-700 text-white rounded-xl p-5 shadow-xs">
            <h3 className="font-sans font-bold text-base leading-tight flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-yellow-300" />
              Administrative Dispatch &amp; Logging Terminal
            </h3>
            <p className="text-xs text-white/95 mt-1 leading-relaxed">
              As System Administrator, you possess **unlimited file size dispatch privileges**. Track files requested on this console route automatically into the University Document Workflow Engine.
            </p>
          </div>

          {sendFileError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex items-center gap-2.5" id="adm-send-error">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{sendFileError}</span>
            </div>
          )}

          {sendSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-850 text-xs flex items-center gap-2.5 font-bold" id="adm-send-success">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{sendSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleAdminSubmitDocument} className="space-y-5 max-w-3xl">
            <div className="space-y-1">
              <label htmlFor="adm-doc-title" className="text-xs font-bold text-slate-705">
                Official Document Title / Subject *
              </label>
              <input
                id="adm-doc-title"
                type="text"
                placeholder="e.g. Executive Board Prerequisite Adjustments Log"
                className="w-full rounded-xl border border-slate-250 bg-slate-50/20 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                value={sendTitle}
                onChange={(e) => {
                  setSendFileError(null);
                  setSendTitle(e.target.value);
                }}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="adm-doc-desc" className="text-xs font-bold text-slate-705">
                Detailed Purpose &amp; Processing Mandate
              </label>
              <textarea
                id="adm-doc-desc"
                rows={3}
                placeholder="Explain what evaluations, steps, or clearance validations this tracked document requires from target offices."
                className="w-full rounded-xl border border-slate-250 bg-slate-50/20 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                value={sendDescription}
                onChange={(e) => setSendDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Beneficiary Selection */}
              <div className="space-y-1 sm:col-span-2">
                 <label htmlFor="adm-send-student" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                   <span>Student Beneficiary / Document Owner *</span>
                   <span className="text-[10px] text-indigo-650 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">MAPPED TO SYSTEM STUDENT</span>
                 </label>
                 <select
                   id="adm-send-student"
                   className="w-full rounded-xl border border-slate-250 bg-indigo-50/40 px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer"
                   value={sendStudentId}
                   onChange={(e) => setSendStudentId(e.target.value)}
                   required
                 >
                   {students.map((student) => (
                     <option key={student.user_id} value={student.user_id}>
                       {student.full_name} ({student.email} • ID: {student.user_id})
                     </option>
                   ))}
                 </select>
                 <p className="text-[10px] text-slate-400 font-sans">
                   The selected student will immediately see this newly registered filing inside their dynamic tracking hub!
                 </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="adm-doc-type" className="text-xs font-bold text-slate-750">
                  Document Classification Category
                </label>
                <select
                  id="adm-doc-type"
                  className="w-full rounded-xl border border-slate-250 bg-white px-3 py-2.5 text-sm text-slate-800 cursor-pointer"
                  value={sendType}
                  onChange={(e) => setSendType(e.target.value)}
                  required
                >
                  {CKC_DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="adm-doc-office" className="text-xs font-bold text-slate-750">
                  Initial Destination Office Station
                </label>
                <select
                  id="adm-doc-office"
                  className="w-full rounded-xl border border-slate-250 bg-white px-3 py-2.5 text-sm text-slate-800 cursor-pointer"
                  value={sendTargetOfficeId}
                  onChange={(e) => setSendTargetOfficeId(e.target.value)}
                  required
                >
                  {offices.map((off) => (
                    <option key={off.office_id} value={off.office_id}>
                      {off.office_name} ({off.office_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drag & Drop File Block */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Tracked Asset Upload <span className="font-medium text-slate-400 font-mono">(Admin Privilege: Unlimited Size)</span>
              </span>

              <div
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setSendDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setSendDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setSendDragActive(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSendDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    validateAndSetSendFile(file.name, file.size);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  sendDragActive
                    ? 'border-teal-600 bg-teal-50/15'
                    : sendFileName
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                }`}
                onClick={() => document.getElementById('admin-file-uploader')?.click()}
              >
                <input
                  type="file"
                  id="admin-file-uploader"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      validateAndSetSendFile(file.name, file.size);
                    }
                  }}
                />

                {!sendFileName ? (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                    <div className="text-sm font-semibold text-slate-700">
                      Drag &amp; drop document or <span className="text-teal-650 underline">browse files</span>
                    </div>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      All standard document formats are accepted (.doc, .docx, .pdf, .txt, .wps, .wpd). File size limits are overridden for Admin roles first class.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <span className="font-bold text-slate-800 text-sm max-w-sm truncate">{sendFileName}</span>
                    <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-800 font-mono px-2.5 py-0.5 rounded">
                      {sendFileSize} • {sendFileFormat.toUpperCase()} valid.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-sans font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              <PlusCircle className="w-4 h-4" />
              Register, Dispatch &amp; Log Global Document
            </button>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB DEAN'S OFFICE DESK: OPERATIONAL BACKLOG DESK
          ---------------------------------------------------- */}
      {activeTab === 'dean_desk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="panel-dean-desk">
          {/* Main Registry Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-base">Office of the Academic Dean Desk</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Incoming educational and clearance registries routed for Dean evaluation</p>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  Active Station Desk: OFF-DEAN
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Dean's Inbox (ID, title, student)..."
                    value={deanSearchQuery}
                    onChange={(e) => setDeanSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all text-slate-800"
                    id="dean-search-input"
                  />
                </div>

                <div className="sm:col-span-4 select-wrapper">
                  <select
                    value={deanStatusFilter}
                    onChange={(e) => setDeanStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-705 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                    id="dean-status-select"
                  >
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Forwarded">Forwarded</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* List Cards */}
              {(() => {
                const deanDocs = documents.filter((doc) => {
                  const matchesOffice = doc.office_id === 'OFF-DEAN' && !doc.is_archived;
                  const matchesStatus = deanStatusFilter === 'All' ? true : doc.current_status === deanStatusFilter;
                  const q = deanSearchQuery.toLowerCase();
                  
                  // Find student/creator name
                  const creatorObj = users.find(u => u.user_id === doc.creator_id);
                  const creatorName = creatorObj ? creatorObj.full_name : '';

                  const matchesSearch =
                    doc.title.toLowerCase().includes(q) ||
                    doc.doc_id.toLowerCase().includes(q) ||
                    doc.type.toLowerCase().includes(q) ||
                    creatorName.toLowerCase().includes(q) ||
                    doc.file_name.toLowerCase().includes(q);

                  return matchesOffice && matchesStatus && matchesSearch;
                });

                if (deanDocs.length === 0) {
                  return (
                    <div className="text-center py-16 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      <HelpCircle className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                      <p className="text-slate-500 font-semibold font-sans mb-1 text-sm">No incoming files for Academic Dean</p>
                      <p className="text-slate-450 text-xs">
                        There are no student documents currently stationed at the &ldquo;Office of the Academic Dean&rdquo; matching your filter scope.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                    {deanDocs.map((doc) => {
                      const isSelected = doc.doc_id === deanSelectedDocId;
                      const creatorUser = users.find(u => u.user_id === doc.creator_id);

                      // Helper function to get status badge styling
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case 'Pending': return 'bg-amber-100 text-amber-805 border-amber-200';
                          case 'Processing': return 'bg-blue-100 text-blue-805 border-blue-200';
                          case 'Forwarded': return 'bg-purple-100 text-purple-805 border-purple-200';
                          case 'Completed': return 'bg-emerald-100 text-emerald-805 border-emerald-200';
                          case 'Rejected': return 'bg-rose-105 text-rose-805 border-rose-200';
                          default: return 'bg-slate-100 text-slate-850 border-slate-200';
                        }
                      };

                      return (
                        <div
                          key={doc.doc_id}
                          className={`border rounded-xl p-4 transition-all flex flex-col justify-between gap-4 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                          id={`dean-doc-${doc.doc_id}`}
                        >
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-extrabold text-indigo-950 bg-indigo-50 px-2 rounded border border-indigo-200">
                                  {doc.doc_id}
                                </span>
                                <span className={`inline-flex px-2 py-0.5 text-[9px] uppercase font-bold tracking-wide rounded-full border ${getStatusBadge(doc.current_status)}`}>
                                  {doc.current_status}
                                </span>
                                {doc.viewed_by_staff ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-sans font-extrabold bg-emerald-50 text-emerald-850 border border-emerald-150 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    VERIFIED BY DEAN
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-sans font-extrabold bg-amber-50 text-amber-850 border border-amber-150 px-1.5 py-0.5 rounded animate-pulse">
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    UNREAD AT STATION
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 font-mono">
                                {new Date(doc.date_received).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                              </span>
                            </div>

                            <h4 className="font-sans font-bold text-slate-800 text-sm leading-tight">{doc.title}</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 font-sans">
                              <div>
                                <span className="font-semibold text-slate-400">Request Type:</span> {doc.type}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-400">Student Creator:</span> <span className="font-medium text-slate-800">{creatorUser ? `${creatorUser.full_name} (${creatorUser.user_id})` : doc.creator_id}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="inline-flex items-center gap-1 bg-slate-100 rounded px-2 py-0.5 text-xs text-slate-655 font-mono max-w-full truncate">
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate text-slate-650">{doc.file_name}</span>
                                <span className="text-slate-400">({doc.file_size})</span>
                              </span>
                            </div>

                            {/* Dean Quick Stamps */}
                            {doc.viewed_by_staff && (
                              <div className="pt-3 border-t border-dashed border-slate-100 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-0.5 font-sans uppercase">
                                  <Zap className="w-3 h-3 text-amber-500 animate-pulse" /> Fast Approval:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDeanQuickStamp(doc, 'Processing', 'Dean evaluation in progress: Academic checks currently being cleared against checklists.')}
                                    className="px-2.5 py-1 text-[10px] font-sans font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Processing Stamp
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeanQuickStamp(doc, 'Completed', 'Approved & Cleared by Academic Dean: Requirements successfully satisfied under campus guidelines.')}
                                    className="px-2.5 py-1 text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Completed Stamp
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
                            {doc.viewed_by_staff ? (
                              <button
                                type="button"
                                onClick={() => handleDeanSelectDoc(doc)}
                                className="flex-1 py-1.5 rounded-xl text-xs font-semibold border border-indigo-200 text-indigo-805 bg-indigo-50/50 hover:bg-indigo-55/65 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                Interactive Backlog Panel
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeanSelectDoc(doc)}
                                className="flex-1 py-1.5 rounded-xl text-xs font-semibold border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5 text-indigo-100" />
                                Open &amp; Verify Desk File
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Work Pane Column (5 cols) */}
          <div className="lg:col-span-5">
            {(() => {
              const activeDoc = documents.find(d => d.doc_id === deanSelectedDocId);
              
              if (!activeDoc) {
                return (
                  <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center text-slate-400 flex flex-col items-center justify-center min-h-[320px] sticky top-6">
                    <ClipboardCheck className="w-12 h-12 text-slate-350 mb-3" />
                    <p className="text-sm font-semibold text-slate-700 font-sans mb-1">State Transition Engine</p>
                    <p className="text-xs max-w-xs leading-relaxed text-slate-400">
                      Select any document in the incoming Academic Dean list to verify criteria, formulate status updates, or authorize forward dispatches.
                    </p>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                  <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white px-6 py-4.5">
                    <h3 className="font-sans font-bold text-sm leading-tight flex items-center gap-2">
                      <ClipboardCheck className="w-4.5 h-4.5 text-amber-300" />
                      Dean Authorized Clearance Workflow
                    </h3>
                    <p className="text-[10px] text-indigo-150 mt-1">Authorized digital stamp controls for {activeDoc.doc_id}</p>
                  </div>

                  <form onSubmit={handleDeanStatusTransitionSubmit} className="p-5 space-y-4">
                    {/* Selected Document Info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 font-sans space-y-2">
                      <span className="text-[9px] font-mono font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">
                        Evaluating Subject
                      </span>
                      <div className="font-bold text-slate-800 text-xs leading-snug mt-1 break-words">
                        {activeDoc.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Current Status of Registry: <span className="font-bold text-indigo-900">{activeDoc.current_status}</span>
                      </div>
                      {activeDoc.description && (
                        <div className="text-[10px] text-slate-600 italic bg-white p-2 rounded border border-slate-100 mt-1">
                          &ldquo;{activeDoc.description}&rdquo;
                        </div>
                      )}
                      
                      {/* Download Action */}
                      <div className="pt-2 border-t border-slate-200 mt-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadDocFile(activeDoc)}
                          className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 hover:text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-colors"
                          title="Download received file with original file extension"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          Download Document ({activeDoc.file_format ? activeDoc.file_format.toUpperCase() : 'DOC'})
                        </button>
                      </div>
                    </div>

                    {/* Workflow status selection dropdown */}
                    <div className="space-y-1.5">
                      <label htmlFor="dean-workflow-status" className="text-xs font-bold text-slate-700">
                        Institutional State Set
                      </label>
                      <select
                        id="dean-workflow-status"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white focus:border-indigo-600 focus:outline-none cursor-pointer"
                        value={deanNewStatus}
                        onChange={(e) => setDeanNewStatus(e.target.value as Document['current_status'])}
                      >
                        <option value="Pending">Pending (Lock Hold / Re-checks)</option>
                        <option value="Processing">Processing (Under Dean verification)</option>
                        <option value="Forwarded">Forwarded (Dispatch-route to other office)</option>
                        <option value="Completed">Completed (Resolution Clearance OK)</option>
                        <option value="Rejected">Rejected (Incomplete criteria / Return)</option>
                      </select>
                    </div>

                    {/* Display conditional dispatch receiver list */}
                    {deanNewStatus === 'Forwarded' && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label htmlFor="dean-forward-office" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-indigo-600" />
                          Destination Campus Office Station
                        </label>
                        <select
                          id="dean-forward-office"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white focus:border-indigo-600 focus:outline-none cursor-pointer"
                          value={deanForwardOfficeId}
                          onChange={(e) => setDeanForwardOfficeId(e.target.value)}
                        >
                          {offices
                            .filter(o => o.office_id !== 'OFF-DEAN')
                            .map(off => (
                              <option key={off.office_id} value={off.office_id}>
                                {off.office_name} ({off.office_id})
                              </option>
                            ))
                          }
                        </select>
                        <p className="text-[10px] text-slate-400">
                          Dispatches modify the physical workspace location in the student routing logs.
                        </p>

                        <div className="space-y-1 mt-2">
                          <label htmlFor="dean-forward-description-text" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Forwarding Reason / Dispatch Notes *</span>
                            <span className="text-[10px] font-semibold text-indigo-650 bg-indigo-50 rounded px-1.5 py-0.5">MANDATORY</span>
                          </label>
                          <textarea
                            id="dean-forward-description-text"
                            rows={3}
                            placeholder="Provide details or routing instructions for the destination office (e.g., Forwarding for academic level screening or checkpoint verification.)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs shadow-xs focus:border-indigo-600 focus:outline-none text-slate-800 placeholder-slate-400 font-sans"
                            value={deanForwardDescription}
                            onChange={(e) => setDeanForwardDescription(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Professional Remarks (Mandatory) */}
                    {deanNewStatus === 'Forwarded' ? (
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center font-sans">
                        <p className="text-xs font-bold text-slate-500 font-sans">Action Audit Remarks Disabled</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Route updates automatically log standardized dispatch notices for system reliability.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label htmlFor="dean-remarks-area" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>Authorized Academic Remarks *</span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 rounded px-1">MANDATORY</span>
                        </label>
                        
                        {/* Dean templates list */}
                        <select
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] bg-indigo-50/50 hover:bg-indigo-50/80 text-indigo-900 focus:outline-none cursor-pointer"
                          onChange={(e) => {
                            if (e.target.value) {
                              setDeanRemarks(e.target.value);
                            }
                          }}
                        >
                          {GET_CANNED_REMARKS_BY_TYPE(activeDoc.type, 'Dean').map((tmpl, index) => (
                            <option key={index} value={tmpl.value}>{tmpl.label}</option>
                          ))}
                        </select>

                        <textarea
                          id="dean-remarks-area"
                          rows={4}
                          placeholder={`Provide official justifications, checklist approvals, or redirection specifications for ${activeDoc.type}...`}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none text-slate-800"
                          value={deanRemarks}
                          onChange={(e) => setDeanRemarks(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    {deanUpdateError && (
                      <div className="rounded-xl bg-rose-50 text-rose-800 px-3.5 py-2.5 text-xs font-semibold border border-rose-100 flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>{deanUpdateError}</div>
                      </div>
                    )}

                    {deanUpdateSuccess && (
                      <div className="rounded-xl bg-emerald-50 text-emerald-800 px-3.5 py-2.5 text-xs font-bold border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>{deanUpdateSuccess}</div>
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="submit"
                        className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4 text-amber-300" />
                        Commit Authorized Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeanSelectedDocId(null)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 1: QUANTITATIVE REPORTING AND Bottleneck ANALYTICS
          ---------------------------------------------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn" id="panel-analytics">
          {/* Core Metrics Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">TOTAL REGISTRY</span>
              <span className="text-2xl font-sans font-extrabold text-slate-800 mt-1">{documents.length}</span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Live Synchronized</span>
            </div>
            
            <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">UNDER EVALUATION</span>
              <span className="text-2xl font-sans font-extrabold text-amber-600 mt-1">
                {documents.filter((d) => d.current_status === 'Pending' || d.current_status === 'Processing').length}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Pending and Processing</span>
            </div>

            <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">FORWARDED STATIONS</span>
              <span className="text-2xl font-sans font-extrabold text-purple-600 mt-1">
                {documents.filter((d) => d.current_status === 'Forwarded').length}
              </span>
              <span className="text-[10px] text-purple-500 font-semibold mt-1">In Routing Motion</span>
            </div>

            <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">COMPLETED REQUESTS</span>
              <span className="text-2xl font-sans font-extrabold text-emerald-600 mt-1">
                {documents.filter((d) => d.current_status === 'Completed').length}
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold mt-1">
                Resolution Rate: {documents.length > 0 ? ((documents.filter((d) => d.current_status === 'Completed').length / documents.length) * 100).toFixed(0) : 0}%
              </span>
            </div>

            <div className="bg-white border rounded-2xl col-span-2 lg:col-span-1 p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">SYSTEM LOGS ARCHIVED</span>
              <span className="text-2xl font-sans font-extrabold text-indigo-950 mt-1">{logs.length}</span>
              <span className="text-[10px] text-blue-600 font-semibold mt-1">Accountability Log entries</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* BOTTLENECK DETECTOR (Station statistics) */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-md">Station Bottleneck Analyzer</h3>
                <p className="text-xs text-slate-500">Number of tracking documents waiting at each office station right now</p>
              </div>

              <div className="space-y-4">
                {docsPerOffice.map((office) => {
                  const pct = Math.max((office.totalCount / maxTotalDocs) * 100, 4);
                  return (
                    <div key={office.id} className="space-y-1.5" id={`office-stat-bar-${office.id}`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">
                          {office.name} <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 rounded">{office.id}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">
                            {office.totalCount} Document{office.totalCount !== 1 && 's'}
                          </span>
                          {office.cloggedCount > 0 && (
                            <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold font-mono">
                              {office.cloggedCount} Urgent
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Interactive visual state bar */}
                      <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-lg transition-all duration-500 ${
                            office.cloggedCount > 1
                              ? 'bg-rose-600'
                              : office.totalCount > 1
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 text-xs text-blue-900 leading-relaxed font-sans">
                <strong>Oversight Alert:</strong> Stations displaying <span className="text-rose-700 font-bold">Red Bars</span> indicate high active file clogs where students are waiting on immediate evaluations. Staff must audit pending credentials.
              </div>
            </div>

            {/* DOCUMENT CLASS DISTRIBUTION */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-md">Document Class Category Volume</h3>
                <p className="text-xs text-slate-500">Distribution of registered digital assets by content class</p>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {typeVolume.map((item) => {
                  const pct = Math.max((item.count / maxTypeCount) * 100, 3);
                  return (
                    <div key={item.type} className="space-y-1" id={`type-volume-${item.type.replace(/\s+/g, '-')}`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-600 truncate max-w-[240px]">{item.type}</span>
                        <span className="font-mono font-bold text-slate-800">{item.count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 rounded-md overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full rounded-md bg-indigo-600 transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: USER GOVERNANCE (RBAC assignment)
          ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="panel-users">
          {/* Form wrapper */}
          <div className="lg:col-span-5">
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5">
                <h3 className="font-sans font-bold text-md leading-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-300" />
                  Register Core Participant
                </h3>
                <p className="text-xs text-blue-200 mt-1">Enforce role permissions based on campus credentials</p>
              </div>

              <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reg-name" className="text-xs font-bold text-slate-700">
                    Full Legal Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="e.g. Kurt Jason Sacupayo"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:outline-blue-600 text-slate-800 bg-white"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="text-xs font-bold text-slate-700">
                    Institutional Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="e.g. kurt.sacupayo@ckcgingoog.edu.ph"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:outline-blue-600 text-slate-800 bg-white"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-role" className="text-xs font-bold text-slate-700 block">
                    Campus Level Role Authorization
                  </label>
                  <select
                    id="reg-role"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm cursor-pointer text-slate-800 bg-white"
                    value={newUserRole}
                    onChange={(e) => {
                      setNewUserRole(e.target.value as Role);
                      if (e.target.value === 'Student') setNewUserOfficeId('');
                    }}
                  >
                    <option value="Student">Student (Initiate & Track requests)</option>
                    <option value="Administrative Staff">Administrative Staff (Update states & audit entries)</option>
                    <option value="Admin">Admin (Oversight and permissions control)</option>
                  </select>
                </div>

                {/* Office assign selection displays ONLY for Staff and Admin */}
                {newUserRole !== 'Student' && (
                  <div className="space-y-1.5 p-3.5 bg-slate-50 border rounded-lg animate-fadeIn">
                    <label htmlFor="reg-office" className="text-xs font-bold text-slate-700">
                      Primary Designated Work Station Office
                    </label>
                    <select
                      id="reg-office"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm cursor-pointer text-slate-800"
                      value={newUserOfficeId}
                      onChange={(e) => setNewUserOfficeId(e.target.value)}
                    >
                      <option value="">Choose designated desk...</option>
                      {offices.map((off) => (
                        <option key={off.office_id} value={off.office_id}>
                          {off.office_name} ({off.office_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {userError && (
                  <div className="rounded-xl bg-rose-50 text-rose-800 p-3 text-xs font-medium border border-rose-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div>{userError}</div>
                  </div>
                )}

                {userSuccess && (
                  <div className="rounded-xl bg-emerald-50 text-emerald-800 p-3 text-xs font-semibold border border-emerald-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <div>{userSuccess}</div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  id="admin-submit-user-btn"
                >
                  <PlusCircle className="w-4 h-4 text-amber-300 animate-pulse" />
                  Grant Role Authorization
                </button>
              </form>
            </div>
          </div>

          {/* Directory Listings Column */}
          <div className="lg:col-span-7">
            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3.5">
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-md">Elections / User Directory</h3>
                  <p className="text-xs text-slate-400">Manage all registered accounts currently accessing DocuTrack</p>
                </div>
                
                {/* User quick search */}
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-blue-600 text-slate-800"
                  id="user-dir-search-input"
                />
              </div>

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {filteredUsers.map((user) => {
                  const userOffice = offices.find((o) => o.office_id === user.office_id);
                  const isCreatorAdmin = user.user_id === 'USR-ADMIN1'; // Protect core creator account

                  return (
                    <div
                      key={user.user_id}
                      className="border border-slate-100/80 bg-slate-50/50 rounded-xl p-3 flex justify-between items-center gap-4 hover:bg-slate-50 hover:border-slate-300 transition-all font-sans"
                      id={`user-entry-${user.user_id}`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-sans font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                          {user.full_name}
                          <span
                            className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                              user.role === 'Admin'
                                ? 'bg-red-100 text-red-800'
                                : user.role === 'Administrative Staff'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 tracking-tight leading-none truncate">
                          {user.email} • {userOffice ? `Assigned Desk: ${userOffice.office_name}` : 'No station'}
                        </div>
                      </div>

                      {/* De-registration buttons */}
                      {!isCreatorAdmin ? (
                        <button
                          onClick={() => onDeleteUser(user.user_id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Revoke entry permissions"
                          id={`del-user-btn-${user.user_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold font-sans uppercase">
                          System Host
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: OFFICE STATIONS (School locations)
          ---------------------------------------------------- */}
      {activeTab === 'offices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="panel-offices">
          {/* Creation form column */}
          <div className="lg:col-span-5">
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5">
                <h3 className="font-sans font-bold text-md leading-tight flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-350 animate-spin" />
                  Instate Location Office
                </h3>
                <p className="text-xs text-blue-200 mt-1">Configure campus locations to streamline processing lanes</p>
              </div>

              <form onSubmit={handleCreateOffice} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="office-code-input" className="text-xs font-bold text-slate-700">
                    Station Code (UPPERCASE)
                  </label>
                  <input
                    id="office-code-input"
                    type="text"
                    placeholder="e.g. OFF-DEAN, OFF-REG"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:outline-blue-600 text-slate-800 font-mono tracking-wide uppercase bg-white"
                    value={newOfficeId}
                    onChange={(e) => setNewOfficeId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="office-name-input" className="text-xs font-bold text-slate-700">
                    Office / Station Name
                  </label>
                  <input
                    id="office-name-input"
                    type="text"
                    placeholder="e.g. Academic Dean Desk Office"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:outline-blue-600 text-slate-800 bg-white"
                    value={newOfficeName}
                    onChange={(e) => setNewOfficeName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="office-dept-input" className="text-xs font-bold text-slate-700">
                    Academic Division / Broad Department
                  </label>
                  <input
                    id="office-dept-input"
                    type="text"
                    placeholder="e.g. Higher Education Division"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:outline-blue-600 text-slate-800"
                    value={newOfficeDept}
                    onChange={(e) => setNewOfficeDept(e.target.value)}
                    required
                  />
                </div>

                {officeError && (
                  <div className="rounded-xl bg-rose-50 text-rose-800 p-3 text-xs font-medium border border-rose-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div>{officeError}</div>
                  </div>
                )}

                {officeSuccess && (
                  <div className="rounded-xl bg-emerald-50 text-emerald-800 p-3 text-xs font-semibold border border-emerald-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <div>{officeSuccess}</div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  id="admin-create-office-btn"
                >
                  <Network className="w-4 h-4 text-amber-300" />
                  Instate Office Location
                </button>
              </form>
            </div>
          </div>

          {/* List display column */}
          <div className="lg:col-span-7">
            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-md">Pre-Configured Campus Offices</h3>
                <p className="text-xs text-slate-400">Active desks managing, signing, and receiving school records</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1">
                {offices.map((office) => {
                  const deskDocumentsCount = documents.filter((doc) => doc.office_id === office.office_id).length;
                  return (
                    <div
                      key={office.office_id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between gap-3 font-sans"
                      id={`office-col-card-${office.office_id}`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-mono bg-blue-50 text-blue-900 font-extrabold border border-blue-200 px-2 py-0.5 rounded">
                          {office.office_id}
                        </span>
                        <h4 className="font-sans font-bold text-slate-800 text-sm mt-1.5 leading-tight">
                          {office.office_name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">{office.department}</p>
                      </div>

                      <div className="text-xs font-mono text-slate-600 bg-slate-150/40 border border-slate-200 rounded p-1.5 text-center mt-1">
                        Currently Holding: <span className="font-bold text-blue-900">{deskDocumentsCount} file{deskDocumentsCount !== 1 && 's'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 4: GLOBAL ACTIVITY TRAILS (Complete Log Export)
          ---------------------------------------------------- */}
      {activeTab === 'logs' && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5 animate-fadeIn" id="panel-logs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-md">Institutional Accountability Log</h3>
              <p className="text-xs text-slate-500">Un-editable chronological audit trails representing all historical campus transitions</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-xs font-sans font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200/80 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-indigo-800"
                id="btn-export-audit-csv"
                title="Download chronological table backup for Microsoft Excel or Google Sheets"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                Download Spreadsheet Logs (CSV)
              </button>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search audit trail keywords..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-blue-600 focus:outline-none"
                  id="global-audit-log-search-input"
                />
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              No audit records matching search keywords.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[500px]">
              <table className="w-full text-left border-collapse text-sm text-slate-700" id="global-audit-log-table">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b">
                  <tr>
                    <th className="p-3.5">Log ID / Date</th>
                    <th className="p-3.5">Doc ID</th>
                    <th className="p-3.5">Campus Signer</th>
                    <th className="p-3.5">Action Executed</th>
                    <th className="p-3.5">Professional Remarks / justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-sans text-xs">
                  {filteredLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/50" id={`table-row-${log.log_id}`}>
                      <td className="p-3.5 space-y-1 font-mono shrink-0">
                        <span className="font-bold block text-slate-800">{log.log_id}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3.5 text-blue-900 font-bold font-mono">
                        {log.doc_id}
                      </td>
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-bold text-slate-800">{log.user_name}</div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400 font-sans mt-0.5 inline-block bg-slate-100 border rounded px-1 tracking-wider">
                          {log.user_role}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-indigo-700 select-all font-mono tracking-wide uppercase text-[10px]">
                        {log.action_taken}
                      </td>
                      <td className="p-3.5 italic text-slate-650 max-w-sm whitespace-normal leading-relaxed text-sm font-serif p-4">
                        &ldquo;{log.remarks}&rdquo;
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 5: EXECUTIVE STATE OVERRIDES (Central Desk)
          ---------------------------------------------------- */}
      {activeTab === 'override' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn" id="panel-override">
          {/* Document list & search panel (7 columns) */}
          <div className="lg:col-span-7 whitespace-normal">
            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-sans font-bold text-slate-800 text-md">Governor Real-time Registry Override</h3>
                <p className="text-xs text-slate-500">Filter, select and manually override active student documents across specific campus departments.</p>
              </div>

              {/* Search and Station filter bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search title, tracking code..."
                    value={overrideSearchQuery}
                    onChange={(e) => setOverrideSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all shadow-xs"
                    id="override-doc-search-input"
                  />
                </div>

                <div>
                  <select
                    id="override-station-filter-select"
                    value={overrideOfficeFilter}
                    onChange={(e) => setOverrideOfficeFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer shadow-xs"
                  >
                    <option value="All">All Routing Stations</option>
                    {offices.map((off) => (
                      <option key={off.office_id} value={off.office_id}>
                        Only routed to: {off.office_name} ({off.office_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Match list */}
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {(() => {
                  const filtered = documents.filter((doc) => {
                    const matchesOffice = overrideOfficeFilter === 'All' ? true : doc.office_id === overrideOfficeFilter;
                    const q = overrideSearchQuery.toLowerCase();
                    const matchesSearch = (
                      doc.doc_id.toLowerCase().includes(q) ||
                      doc.title.toLowerCase().includes(q) ||
                      doc.type.toLowerCase().includes(q) ||
                      doc.file_name.toLowerCase().includes(q)
                    );
                    return matchesOffice && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 px-4 bg-slate-50 border border-dashed rounded-xl text-slate-400 text-xs">
                        No active requests found currently routed to the selected station filter.
                      </div>
                    );
                  }

                  return filtered.map((doc) => {
                    const isOverriding = doc.doc_id === overrideSelectedDocId;
                    const docOffice = offices.find((o) => o.office_id === doc.office_id);
                    return (
                      <div
                        key={doc.doc_id}
                        onClick={() => handleSelectDocForOverride(doc)}
                        className={`border rounded-xl p-4 transition-all cursor-pointer ${
                          isOverriding
                            ? 'border-rose-600 bg-rose-50/15 ring-2 ring-rose-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 font-sans'
                        }`}
                        id={`override-doc-card-${doc.doc_id}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                          <span className="text-xs font-mono font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded leading-none">
                            {doc.doc_id}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 text-xs uppercase font-bold tracking-wide rounded-full ${
                            doc.current_status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            doc.current_status === 'Processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            doc.current_status === 'Forwarded' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            doc.current_status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {doc.current_status}
                          </span>
                        </div>

                        <h4 className="font-sans font-bold text-slate-800 text-sm line-clamp-1">{doc.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 font-sans">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold uppercase">{doc.type}</span>
                          <span className="flex items-center gap-1">Routed Station: <strong className="text-slate-800">{docOffice?.office_name || doc.office_id}</strong></span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Interactive Form panel (5 columns) */}
          <div className="lg:col-span-5">
            {overrideSelectedDocId ? (
              (() => {
                const doc = documents.find(d => d.doc_id === overrideSelectedDocId);
                if (!doc) return null;
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                    <div className="bg-gradient-to-r from-rose-600 to-rose-800 text-white px-6 py-5">
                      <h3 className="font-sans font-bold text-md sm:text-lg leading-tight flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-amber-300 animate-pulse" />
                        Governor State Override
                      </h3>
                      <p className="text-xs text-rose-100 mt-1">Force update school location, routing path, & clearance statuses</p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setOverrideError(null);
                        setOverrideSuccess(null);

                        if (!overrideRemarks.trim()) {
                          setOverrideError('Please supply professional justification remarks describing why this override was issued.');
                          return;
                        }

                        const updatedDocObj: Document = {
                          ...doc,
                          current_status: overrideStatus,
                          office_id: overrideOfficeId || doc.office_id,
                          date_received: new Date().toISOString(),
                        };

                        const actionText = `GOVERNOR OVERRIDE ACTION`;
                        const logRemarks = `[Governor Executive Clearance Override] - ${overrideRemarks.trim()}`;

                        const overrideLogObj: AccountabilityLog = {
                          log_id: `LOG-ADM-${Date.now()}`,
                          doc_id: doc.doc_id,
                          user_id: 'USR-ADMIN1',
                          user_name: 'Admin Governor',
                          user_role: 'Admin',
                          action_taken: actionText,
                          remarks: logRemarks,
                          timestamp: new Date().toISOString(),
                        };

                        onUpdateDocument(updatedDocObj, overrideLogObj);
                        setOverrideSuccess(`Successfully performed Governor Action Override on ${doc.doc_id}!`);
                        setOverrideRemarks('');
                      }}
                      className="p-6 space-y-4"
                    >
                      {/* Document Meta Info Card */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                        <div>
                          <span className="font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded text-[10px] uppercase">
                            Executive Action
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 leading-snug break-words">
                          {doc.title}
                        </div>
                        <div className="text-[10px] font-mono mt-1">
                          Ref: <span className="font-semibold">{doc.doc_id}</span> • Location: <span className="font-semibold">{offices.find(o => o.office_id === doc.office_id)?.office_name}</span>
                        </div>
                        {doc.description && (
                          <div className="text-[10px] text-slate-600 italic bg-white p-2 rounded border border-slate-100 mt-1">
                            &ldquo;{doc.description}&rdquo;
                          </div>
                        )}
                        
                        {/* Download Action */}
                        <div className="pt-2 border-t border-slate-200 mt-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadDocFile(doc)}
                            className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-750 hover:text-rose-900 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-colors"
                            title="Download received file with original file extension"
                          >
                            <Download className="w-3.5 h-3.5 text-rose-600" />
                            Download Document ({doc.file_format ? doc.file_format.toUpperCase() : 'DOC'})
                          </button>
                        </div>
                      </div>

                      {/* Status override select dropdown */}
                      <div className="space-y-1.5">
                        <label htmlFor="over-status-sel" className="text-xs font-semibold text-slate-700">
                          Force Clearance Status
                        </label>
                        <select
                          id="over-status-sel"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white focus:outline-rose-600 text-slate-850 cursor-pointer"
                          value={overrideStatus}
                          onChange={(e) => setOverrideStatus(e.target.value as Document['current_status'])}
                        >
                          <option value="Pending">Pending (Hold & Inspect)</option>
                          <option value="Processing">Processing (Clearance Verification)</option>
                          <option value="Forwarded">Forwarded (Dispatch / Transfer)</option>
                          <option value="Completed">Completed (Resolution Cleared)</option>
                          <option value="Rejected">Rejected (Denied / Spec Check Fail)</option>
                        </select>
                      </div>

                      {/* Station override select dropdown */}
                      <div className="space-y-1.5">
                        <label htmlFor="over-office-sel" className="text-xs font-semibold text-slate-700">
                          Redirect Station Location
                        </label>
                        <select
                          id="over-office-sel"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white focus:outline-rose-600 text-slate-850 cursor-pointer"
                          value={overrideOfficeId}
                          onChange={(e) => setOverrideOfficeId(e.target.value)}
                        >
                          {offices.map((off) => (
                            <option key={off.office_id} value={off.office_id}>
                              {off.office_name} ({off.office_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Executive Remarks */}
                      <div className="space-y-1.5">
                        <label htmlFor="over-remarks-textarea" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>Governor Executive Remarks *</span>
                          <span className="text-[9px] font-normal text-rose-700 bg-rose-50 border border-rose-200 rounded px-1 font-mono uppercase">
                            MANDATORY
                          </span>
                        </label>
                        <textarea
                          id="over-remarks-textarea"
                          rows={4}
                          placeholder="Provide the administrative clearance remarks, overrides, or board decision justification."
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-rose-600 text-slate-800"
                          value={overrideRemarks}
                          onChange={(e) => setOverrideRemarks(e.target.value)}
                          required
                        />
                        <p className="text-[10px] text-slate-400 italic">
                          This statement will be hard-logged under the Governor signature and visible instantly in the student audit timeline.
                        </p>
                      </div>

                      {/* Feedback Indicators */}
                      {overrideError && (
                        <div className="rounded-xl bg-rose-50 text-rose-800 p-3 text-xs font-semibold border border-rose-100 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>{overrideError}</div>
                        </div>
                      )}

                      {overrideSuccess && (
                        <div className="rounded-xl bg-emerald-50 text-emerald-800 p-3 text-xs font-semibold border border-emerald-100 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>{overrideSuccess}</div>
                        </div>
                      )}

                      {/* Form action triggers */}
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        id="override-commit-btn"
                      >
                        <ShieldAlert className="w-4.5 h-4.5 text-amber-300" />
                        Execute Board Override Action
                      </button>
                    </form>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 py-14 text-center text-slate-400 sticky top-6 flex flex-col items-center justify-center">
                <ShieldAlert className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                <p className="text-slate-700 text-xs font-bold uppercase tracking-wider">Awaiting Instrument Selection</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">Please select an initiated student document request from the registry browser to authorize executive overrides.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 6: COMPLETED/REJECTED RECORD ARCHIVES MANAGER
          ---------------------------------------------------- */}
      {activeTab === 'archive' && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn font-sans" id="panel-archive">
          <div className="border-b pb-4">
            <h3 className="font-sans font-bold text-slate-800 text-md">Executive Archives &amp; Record Soft-Purging</h3>
            <p className="text-xs text-slate-500">
              Manage school records cleanup: Archive Completed or Rejected documents to soft-purge them from active Student queues and live Staff Desk queues while retaining immutable Accountability Logs.
            </p>
          </div>

          {/* Table display of eligible documents */}
          {(() => {
            const resolvableDocs = documents.filter(doc => doc.current_status === 'Completed' || doc.current_status === 'Rejected');
            
            if (resolvableDocs.length === 0) {
              return (
                <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Archive className="mx-auto h-12 w-12 text-slate-350 mb-3" />
                  <p className="text-slate-700 text-xs font-bold font-sans uppercase">No Eligible Documents Found</p>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    Only clearance requests marked with a final status of "Completed" or "Rejected" can be safely archived from active campus processing loops.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-emerald-850">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 block leading-none">TOTAL RESOLVED RECORDS</span>
                    <span className="text-2xl font-extrabold text-emerald-800 mt-1 block">{resolvableDocs.length}</span>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-150 text-indigo-850">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-600 block leading-none">ARCHIVED REGISTRY SECURE</span>
                    <span className="text-2xl font-extrabold text-indigo-800 mt-1 block">{resolvableDocs.filter(d => d.is_archived).length}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-slate-700 lg:col-span-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block leading-none">ARCHIVING ADVANTAGE</span>
                    <span className="text-[11px] font-medium leading-snug text-slate-600 mt-1 block">
                      Archives vanish instantly from student &amp; staff desks, boosting response speeds without losing audit traceability.
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 mt-4">
                  <table className="w-full text-left border-collapse text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b">
                      <tr>
                        <th className="p-3.5">Folder Tracking ID</th>
                        <th className="p-3.5">Document Details</th>
                        <th className="p-3.5">Resolution State</th>
                        <th className="p-3.5">Archiving Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resolvableDocs.map(doc => {
                        const isArchived = !!doc.is_archived;
                        
                        return (
                          <tr key={doc.doc_id} className="hover:bg-slate-50/40" id={`archive-row-${doc.doc_id}`}>
                            <td className="p-3.5 font-mono font-bold text-indigo-900">
                              {doc.doc_id}
                            </td>
                            <td className="p-3.5 space-y-0.5">
                              <p className="font-bold text-slate-800 text-sm leading-tight">{doc.title}</p>
                              <p className="text-[11px] text-slate-550">{doc.type} • File: <span className="font-mono">{doc.file_name}</span> ({doc.file_size})</p>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider rounded-lg ${
                                doc.current_status === 'Completed' 
                                  ? 'bg-emerald-105 text-emerald-800 bg-emerald-100' 
                                  : 'bg-rose-105 text-rose-800 bg-rose-100'
                              }`}>
                                {doc.current_status}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {isArchived ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-850 border border-emerald-250 px-2.5 py-1 rounded-lg text-[10px] font-extrabold">
                                  <Archive className="w-3" />
                                  ARCHIVED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                  ● ACTIVE
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-sans">
                              {isArchived ? (
                                <button
                                  disabled
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-450 cursor-not-allowed"
                                >
                                  Archived Secure
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const updatedDoc: Document = {
                                      ...doc,
                                      is_archived: true
                                    };
                                    
                                    const archiveLog: AccountabilityLog = {
                                      log_id: `LOG-ARCHIVE-${Date.now()}`,
                                      doc_id: doc.doc_id,
                                      user_id: 'SYS-GOV-ADMIN',
                                      user_name: 'Console Governor (Admin)',
                                      user_role: 'Admin',
                                      action_taken: 'Document Filed to Archives',
                                      remarks: `School records manager soft-purged of ID ${doc.doc_id}. Registry data successfully archived for structural audit trail compliance. Record hidden from active operations.`,
                                      timestamp: new Date().toISOString()
                                    };
                                    
                                    onUpdateDocument(updatedDoc, archiveLog);
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                  id={`commit-archive-btn-${doc.doc_id}`}
                                >
                                  📥 Commit to Archives
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
