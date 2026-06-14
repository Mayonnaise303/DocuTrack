/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileEdit, ListFilter, ClipboardCheck, ArrowRight, User, Compass, HelpCircle, Eye, Search, AlertCircle, FileText, Lock, Unlock, CheckCircle2, Zap, Sparkles, Upload, Download, FileUp, Edit3 } from 'lucide-react';
import { Document, AccountabilityLog, Office, User as UserType, ALLOWED_DOCUMENT_EXTENSIONS, GET_CANNED_REMARKS_BY_TYPE } from '../types';
import { CKC_DOCUMENT_TYPES } from '../initialData';

interface StaffWorkspaceProps {
  staffMembers: UserType[];
  currentStaff: UserType;
  onStaffChange: (staff: UserType) => void;
  documents: Document[];
  offices: Office[];
  logs: AccountabilityLog[];
  onUpdateDocument: (updatedDoc: Document, newLog: AccountabilityLog) => void;
  onOpenAuditTrail: (doc: Document) => void;
  onAddDocument: (newDoc: Document, initialLog: AccountabilityLog) => void;
  users?: UserType[];
}

const CANNED_REMARKS_TEMPLATES = [
  { label: "-- Quick Canned Comments Selector --", value: "" },
  { label: "✅ Clearance Approved (Complete Specs Checked)", value: "Clearance Check Passed: Verified all requirements, documents are complete and authentic. Ready for next academic stage." },
  { label: "⚠️ Missing Attachments Notice (Hold State)", value: "Notice of Deficiency: Document is missing mandatory certified copy signatures or school certificates. Processing on hold." },
  { label: "🔍 Curriculum Evaluation (Review In Progress)", value: "Broad Curriculum Evaluation: Document units are currently being cross-referenced with catalog graduation criteria. Review in progress." },
  { label: "➡️ Dispatch Forward-Routing Approved", value: "Forward-Routing Approved: Pre-evaluation checks validated successfully. Dispatching files to the next physical station desk." },
  { label: "❌ Submissions Rejected (Format Error)", value: "Submission Rejected: The file structure contains unidentifiable formatting margins or non-document attachments. Student must re-submit." }
];

export default function StaffWorkspace({
  staffMembers,
  currentStaff,
  onStaffChange,
  documents,
  offices,
  logs,
  onUpdateDocument,
  onOpenAuditTrail,
  onAddDocument,
  users,
}: StaffWorkspaceProps) {
  // Active selected document for updates
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  // State updates parameters
  const [newStatus, setNewStatus] = useState<Document['current_status']>('Processing');
  const [forwardOfficeId, setForwardOfficeId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [forwardDescription, setForwardDescription] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // New tab and logs viewer states
  const [viewTab, setViewTab] = useState<'active' | 'submit' | 'logs'>('active');
  const [logsSearchQuery, setLogsSearchQuery] = useState('');

  // --- STAFF DOCUMENT CREATION/SENDING STATES ---
  const [sendTitle, setSendTitle] = useState('');
  const [sendDescription, setSendDescription] = useState('');
  const [sendType, setSendType] = useState(CKC_DOCUMENT_TYPES[0]);
  const [sendTargetOfficeId, setSendTargetOfficeId] = useState(offices[0]?.office_id || 'OFF-REG');
  const [sendFileName, setSendFileName] = useState('');
  const [sendFileSize, setSendFileSize] = useState('');
  const [sendFileFormat, setSendFileFormat] = useState('');
  const [sendFileError, setSendFileError] = useState<string | null>(null);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendDragActive, setSendDragActive] = useState(false);
  const [sendStudentId, setSendStudentId] = useState('');

  // Extract student users in simulator
  const students = (users || []).filter(u => u.role === 'Student');

  React.useEffect(() => {
    if (students.length > 0 && !sendStudentId) {
      setSendStudentId(students[0].user_id);
    }
  }, [students, sendStudentId]);

  // --- RE-EDITING RECEIVED DOCUMENT STATES ---
  const [enableReEdit, setEnableReEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('');
  const [editFileName, setEditFileName] = useState('');
  const [editFileSize, setEditFileSize] = useState('');
  const [editFileFormat, setEditFileFormat] = useState('');
  const [editFileError, setEditFileError] = useState<string | null>(null);
  const [editDragActive, setEditDragActive] = useState(false);

  // Helper validation for sending files (Staff Limit: 50MB, allowed extensions doc, docx, pdf, txt, wps, wpd)
  const validateAndSetSendFile = (name: string, sizeInBytes: number) => {
    setSendFileError(null);
    setSendSuccessMessage(null);
    const parts = name.split('.');
    const ext = parts[parts.length - 1].toLowerCase();

    let sizeStr = 'unknown size';
    if (sizeInBytes > 1024 * 1024) {
      sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (sizeInBytes > 1024) {
      sizeStr = `${(sizeInBytes / 1024).toFixed(0)} KB`;
    } else {
      sizeStr = `${sizeInBytes} bytes`;
    }

    const MAX_SIZE_BYTES = 50 * 1024 * 1024; // Staff size limit: 50MB
    if (sizeInBytes > MAX_SIZE_BYTES) {
      setSendFileName('');
      setSendFileSize('');
      setSendFileFormat('');
      setSendFileError(
        `File rejected! File size (${sizeStr}) exceeds your Staff limit of 50MB. (University network rules permit 20MB for Students, 50MB for Staff, and unlimited for Academic Dean/Admin).`
      );
      return false;
    }

    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
      setSendFileName('');
      setSendFileSize('');
      setSendFileFormat('');
      setSendFileError(
        `File rejected! Format ".${ext.toUpperCase()}" is restricted. Under university safety guidelines, only standard files (.docx, .pdf, .doc, .txt, .wps, .wpd) are accepted for tracking.`
      );
      return false;
    }

    setSendFileName(name);
    setSendFileSize(sizeStr);
    setSendFileFormat(ext);
    return true;
  };

  // Helper validation for editing files
  const validateAndSetEditFile = (name: string, sizeInBytes: number) => {
    setEditFileError(null);
    const parts = name.split('.');
    const ext = parts[parts.length - 1].toLowerCase();

    let sizeStr = 'unknown size';
    if (sizeInBytes > 1024 * 1024) {
      sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (sizeInBytes > 1024) {
      sizeStr = `${(sizeInBytes / 1024).toFixed(0)} KB`;
    } else {
      sizeStr = `${sizeInBytes} bytes`;
    }

    const MAX_SIZE_BYTES = 50 * 1024 * 1024;
    if (sizeInBytes > MAX_SIZE_BYTES) {
      setEditFileError(`File rejected! Size (${sizeStr}) exceeds your Staff limit of 50MB.`);
      return false;
    }

    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
      setEditFileError(`Format ".${ext.toUpperCase()}" is restricted. Only standard reader formats are allowed.`);
      return false;
    }

    setEditFileName(name);
    setEditFileSize(sizeStr);
    setEditFileFormat(ext);
    return true;
  };

  // Find active selected document object
  const activeDoc = documents.find((doc) => doc.doc_id === selectedDocId);

  // Filter criteria logic: strictly lock staff workspace to their assigned office_id
  const filteredDocs = documents.filter((doc) => {
    // Strict Station Isolation: Staff can strictly ONLY see active, non-archived documents currently routed/stationed at their location
    const matchesOffice = doc.office_id === currentStaff.office_id && !doc.is_archived;
    
    const matchesStatus = statusFilter === 'All' ? true : doc.current_status === statusFilter;
    
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.doc_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesOffice && matchesStatus && matchesSearch;
  });

  // Calculate filtered logs for the Staff Registry Log Search tab - Isolate so staff cannot view other staff's logs
  const filteredLogs = logs
    .filter((log) => {
      // Security rule: Staff can strictly ONLY see logs that they personally authored/executed. 
      // This complies with privacy regulations restricting other staff's records.
      const isMyOwnLog = log.user_id === currentStaff.user_id;
      if (!isMyOwnLog) {
        return false;
      }

      const q = logsSearchQuery.toLowerCase();
      const matchesSearch =
        log.doc_id.toLowerCase().includes(q) ||
        log.user_name.toLowerCase().includes(q) ||
        log.action_taken.toLowerCase().includes(q) ||
        log.remarks.toLowerCase().includes(q);

      return matchesSearch;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const staffOffice = offices.find((o) => o.office_id === currentStaff.office_id);

  // Select document to update & prefill parameters and sign viewed seen-locks
  const handleSelectDoc = (doc: Document) => {
    setSelectedDocId(doc.doc_id);
    setNewStatus(doc.current_status);
    setForwardOfficeId(offices.find((o) => o.office_id !== currentStaff.office_id)?.office_id || '');
    setRemarks('');
    setForwardDescription('');
    setUpdateError(null);
    setUpdateSuccess(null);

    // Pre-populate Re-Edit form states with current document data
    setEnableReEdit(false);
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setEditType(doc.type);
    setEditFileName(doc.file_name);
    setEditFileSize(doc.file_size);
    setEditFileFormat(doc.file_format);
    setEditFileError(null);

    // If document is not viewed yet, automatically register viewed state and dispatch initial seen audit-trail
    if (!doc.viewed_by_staff) {
      const updatedDoc: Document = {
        ...doc,
        viewed_by_staff: true,
      };
      
      const receiptLog: AccountabilityLog = {
        log_id: `LOG-RECPT-${Date.now()}`,
        doc_id: doc.doc_id,
        user_id: currentStaff.user_id,
        user_name: currentStaff.full_name,
        user_role: 'Administrative Staff',
        action_taken: 'File Opened & Verification Receipted',
        remarks: `Document contents unlocked and examined on terminal. File description details, name (${doc.file_name}), extension format, and allocation dimensions checked by desk officer.`,
        timestamp: new Date().toISOString(),
      };
      
      onUpdateDocument(updatedDoc, receiptLog);
    }
  };

  // Direct Card Stamp Action Handler for swift processing (Option B)
  const handleQuickStamp = (doc: Document, stampStatus: Document['current_status'], standardRemark: string) => {
    if (!doc.viewed_by_staff) {
      alert('Verification Safeguard: Please open and verify the file content details first using the primary blue option button to read the attachments. This ensures strict audit reliability.');
      return;
    }

    const updatedDoc: Document = {
      ...doc,
      current_status: stampStatus,
    };

    const stampLog: AccountabilityLog = {
      log_id: `LOG-STAMP-${Date.now()}`,
      doc_id: doc.doc_id,
      user_id: currentStaff.user_id,
      user_name: currentStaff.full_name,
      user_role: 'Administrative Staff',
      action_taken: `⚡ Quick-Stamped Status: ${stampStatus}`,
      remarks: `${standardRemark} (Committed from rapid card stamps)`,
      timestamp: new Date().toISOString(),
    };

    onUpdateDocument(updatedDoc, stampLog);
    setUpdateSuccess(`Quick Stamp success! Tracking ID ${doc.doc_id} successfully updated to ${stampStatus}.`);
    
    // Smooth transition
    setTimeout(() => {
      setUpdateSuccess(null);
    }, 4000);
  };

  // Perform workflow status transition
  const handleStatusTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);

    if (!activeDoc) return;

    // Strict validation: Remarks cannot be empty (page 44 - Remark Documentation is mandatory!)
    if (newStatus !== 'Forwarded') {
      if (!remarks.trim()) {
        setUpdateError('Validation Check Failed! You must enter professional remarks or justifications before executing any document state transition. This ensures system traceability and audit reliability.');
        return;
      }

      if (remarks.trim().length < 8) {
        setUpdateError('Validation Check Failed! Professional remarks must be descriptive (at least 8 characters long). Please specify actual processing progress/reasons.');
        return;
      }
    } else {
      if (!forwardDescription.trim()) {
        setUpdateError('Validation Check Failed! Please enter professional forwarding instructions / reason description.');
        return;
      }
      if (forwardDescription.trim().length < 8) {
        setUpdateError('Validation Check Failed! Forwarding instructions must be at least 8 characters long.');
        return;
      }
    }

    // Determine final target office location based on routing
    let targetOffice = activeDoc.office_id;
    let actionDescription = '';

    if (newStatus === 'Forwarded') {
      if (!forwardOfficeId) {
        setUpdateError('Standard routing rules require you to specify a Destination Station Office when forwarding.');
        return;
      }
      targetOffice = forwardOfficeId;
      const targetOfficeObj = offices.find((o) => o.office_id === forwardOfficeId);
      const originOfficeObj = offices.find((o) => o.office_id === activeDoc.office_id);
      const originName = originOfficeObj ? originOfficeObj.office_name : activeDoc.office_id;
      const destName = targetOfficeObj ? targetOfficeObj.office_name : forwardOfficeId;
      actionDescription = `Forwarded Document from ${originName} to ${destName}`;
    } else {
      actionDescription = `Status Updated to ${newStatus}`;
    }

    // Recheck Re-edit updates if enabled
    let finalTitle = activeDoc.title;
    let finalType = activeDoc.type;
    let finalDescription = activeDoc.description;
    let finalFileName = activeDoc.file_name;
    let finalFileSize = activeDoc.file_size;
    let finalFileFormat = activeDoc.file_format;

    if (enableReEdit) {
      if (!editTitle.trim()) {
        setUpdateError('Validation Check Failed! Re-edited document title/subject cannot be empty.');
        return;
      }
      finalTitle = editTitle.trim();
      finalType = editType;
      finalDescription = editDescription.trim();
      finalFileName = editFileName;
      finalFileSize = editFileSize;
      finalFileFormat = editFileFormat;
      actionDescription = `${actionDescription} (Details Re-edited)`;
    }

    const updatedDocument: Document = {
      ...activeDoc,
      title: finalTitle,
      type: finalType,
      description: finalDescription,
      file_name: finalFileName,
      file_size: finalFileSize,
      file_format: finalFileFormat,
      current_status: newStatus,
      office_id: targetOffice,
    };

    const finalRemarks = newStatus === 'Forwarded'
      ? `System Routing Dispatch: Forwarded from ${activeDoc.office_id} to ${targetOffice}. Reason/Instructions: ${forwardDescription.trim()}`
      : (remarks.trim() + (enableReEdit ? ` [Document details modifications: Subject updated to "${finalTitle}", Class updated to "${finalType}", File ref: "${finalFileName}"]` : ''));

    const newLog: AccountabilityLog = {
      log_id: `LOG-${Date.now()}`,
      doc_id: activeDoc.doc_id,
      user_id: currentStaff.user_id,
      user_name: `${currentStaff.full_name} [Department: ${staffOffice?.office_name || currentStaff.office_id}]`,
      user_role: 'Administrative Staff',
      action_taken: actionDescription,
      remarks: finalRemarks,
      timestamp: new Date().toISOString(),
    };

    onUpdateDocument(updatedDocument, newLog);

    setUpdateSuccess(`Document status and metadata synchronized! ${activeDoc.doc_id} successfully updated. Log archived.`);
    setRemarks('');
    setForwardDescription('');
    
    // De-select selected document panel after 3 seconds or keep visible
    setTimeout(() => {
      setSelectedDocId(null);
      setUpdateSuccess(null);
    }, 4000);
  };

  // Helper virtual download blob constructor for tracking records
  const handleDownloadDocFile = (doc: Document) => {
    const docLogs = logs.filter(l => l.doc_id === doc.doc_id);
    const originOfficeObj = offices.find((o) => o.office_id === doc.office_id);
    const contentLines = [
      `======================================================`,
      ` CHRIST THE KING COLLEGE - DOCUMENT RE-EDIT PORTABLE EXPORT`,
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
      `This export satisfies university compliance. The active department desk officer who owns the document's custody is permitted legally to alter elements inside the live digital tracking hub. Select the "Re-edit received file details" tool in the sidebar to commit live corrections.`,
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

  // Staff registration of new trackable document (subject to 50MB limits)
  const handleStaffSubmitDocument = (e: React.FormEvent) => {
    e.preventDefault();
    setSendFileError(null);
    setSendSuccessMessage(null);

    if (!sendTitle.trim()) {
      setSendFileError('Validation Error: Document title is mandatory.');
      return;
    }
    if (!sendFileName) {
      setSendFileError('Validation Error: You must attach a valid document asset before dispatching.');
      return;
    }

    const docIdCounter = documents.length + 1;
    const year = new Date().getFullYear();
    const docId = `DOC-${year}-${String(docIdCounter).padStart(4, '0')}`;
    const isoString = new Date().toISOString();

    const newDocument: Document = {
      doc_id: docId,
      title: sendTitle.trim(),
      type: sendType,
      description: sendDescription.trim(),
      current_status: 'Pending',
      date_received: isoString,
      office_id: sendTargetOfficeId,
      creator_id: sendStudentId || currentStaff.user_id,
      file_name: sendFileName,
      file_size: sendFileSize,
      file_format: sendFileFormat,
    };

    const initialLog: AccountabilityLog = {
      log_id: `LOG-${Date.now()}`,
      doc_id: docId,
      user_id: currentStaff.user_id,
      user_name: `${currentStaff.full_name}`,
      user_role: 'Administrative Staff',
      action_taken: 'Document Registered by Staff',
      remarks: `Initial high-priority staff record registration. Student Owner: ${students.find(s => s.user_id === sendStudentId)?.full_name || 'N/A'}. Description: ${sendDescription.trim() || 'None provided.'}`,
      timestamp: isoString,
    };

    onAddDocument(newDocument, initialLog);

    // Reset sending form
    setSendTitle('');
    setSendDescription('');
    setSendFileName('');
    setSendFileSize('');
    setSendFileFormat('');
    setSendSuccessMessage(`Staff Document successfully registered! Assigned tracking ID: ${docId}`);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'Forwarded':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-300';
    }
  };

  return (
    <div className="space-y-8" id="staff-workspace">
      
      {/* Simulation Selector Bar */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
            Simulated Desk Role
          </span>
          <p className="text-xs text-slate-600 mt-1">
            Active Station: <span className="font-bold text-slate-800">{staffOffice?.office_name} ({currentStaff.office_id})</span>. In this sandbox, you can switch personnel below to test routing fields between departments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="staff-sim-select" className="text-xs font-semibold text-slate-500 font-sans uppercase">
            Switch Desk Officer:
          </label>
          <select
            id="staff-sim-select"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-indigo-600 cursor-pointer"
            value={currentStaff.user_id}
            onChange={(e) => {
              const s = staffMembers.find((m) => m.user_id === e.target.value);
              if (s) {
                onStaffChange(s);
                setSelectedDocId(null);
                setUpdateError(null);
                setUpdateSuccess(null);
              }
            }}
          >
            {staffMembers.map((member) => {
              const matchedOffice = offices.find((o) => o.office_id === member.office_id);
              return (
                <option key={member.user_id} value={member.user_id}>
                  {member.full_name} ({matchedOffice ? matchedOffice.office_name : 'No Office'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Document Registry Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            
            {/* Headers and filters selection toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-lg">
                  {viewTab === 'active' ? 'Station Desk Registry' : 'Document Registry Logs'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewTab === 'active' 
                    ? 'Physical tracking and operational routing controls' 
                    : 'Un-editable historical accountability and audit trails'}
                </p>
              </div>

              {/* Robust Tab Segment Control */}
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewTab('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
                    viewTab === 'active'
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-slate-550 hover:text-slate-800'
                  }`}
                  id="staff-tab-btn-active"
                >
                  Active Station Files ({filteredDocs.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewTab('submit');
                    setSelectedDocId(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
                    viewTab === 'submit'
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-slate-550 hover:text-slate-800'
                  }`}
                  id="staff-tab-btn-submit"
                >
                  Register/Send Doc
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewTab('logs');
                    // Deselect active doc to avoid confusion when reading logs
                    setSelectedDocId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
                    viewTab === 'logs'
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-slate-550 hover:text-slate-800'
                  }`}
                  id="staff-tab-btn-logs"
                >
                  Registry Logs ({filteredLogs.length})
                </button>
              </div>
            </div>

            {/* VIEW TAB 1: ACTIVE FILES IN STATION */}
            {viewTab === 'active' && (
              <>
                {/* Queries filters area */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 relative">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Query doc tracking ID, title, filename..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all text-slate-800"
                      id="staff-search-input"
                    />
                  </div>

                  <div className="sm:col-span-4 select-wrapper">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                      id="staff-status-select"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Forwarded">Forwarded</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* List */}
                {filteredDocs.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-slate-50/60 rounded-2xl border-2 border-dashed border-slate-200">
                    <HelpCircle className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-slate-500 text-sm font-semibold font-sans mb-1">No documents in current scope</p>
                    <p className="text-slate-400 text-xs text-center">
                      No documents are currently stationed at the &ldquo;{staffOffice?.office_name || currentStaff.office_id}&rdquo; station matching your current filter criteria.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {filteredDocs.map((doc) => {
                      const locationOffice = offices.find((o) => o.office_id === doc.office_id);
                      const isSelected = doc.doc_id === selectedDocId;
                      const docLogs = logs.filter((l) => l.doc_id === doc.doc_id);
                      const lastForwardLog = docLogs
                        .filter((l) => l.action_taken && l.action_taken.toLowerCase().includes('forwarded'))
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

                      return (
                        <div
                          key={doc.doc_id}
                          className={`border rounded-xl p-4 transition-all flex flex-col justify-between gap-4 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/25 ring-1 ring-indigo-600 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs'
                          }`}
                          id={`staff-doc-card-${doc.doc_id}`}
                        >
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-extrabold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                                  {doc.doc_id}
                                </span>
                                <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded-full ${getStatusBadgeClass(doc.current_status)}`}>
                                  {doc.current_status}
                                </span>

                                {/* Verification Seen status lock representation */}
                                {doc.viewed_by_staff ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-sans font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    READ &amp; VERIFIED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-sans font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    UNREAD LOCK
                                  </span>
                                )}
                              </div>
                              
                              <span className="text-xs text-slate-400 font-mono font-normal">
                                {new Date(doc.date_received).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            <h4 className="font-sans font-bold text-slate-800 text-sm leading-tight">
                              {doc.title}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 font-sans">
                              <div>
                                <span className="font-semibold text-slate-400">Class:</span> {doc.type}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-400">Current Site Station:</span> <span className="font-medium text-slate-800">{locationOffice ? `${locationOffice.office_name} (${locationOffice.office_id})` : doc.office_id}</span>
                              </div>
                            </div>

                            {/* Forwarded detail callout */}
                            {doc.current_status === 'Forwarded' && lastForwardLog && (
                              <div className="mt-1 p-2 bg-purple-50/70 hover:bg-purple-100/60 border border-purple-100 rounded-lg text-[11px] text-purple-950 font-sans flex flex-col gap-0.5 shadow-2xs" id={`forwarded-badge-sf-${doc.doc_id}`}>
                                <span className="font-bold flex items-center gap-1 text-purple-900">
                                  <span className="h-1.5 w-1.5 bg-purple-600 rounded-full"></span>
                                  Route Movement: {lastForwardLog.action_taken}
                                </span>
                                <span className="text-slate-500 text-[10px]">
                                  Actioned by: <span className="font-semibold text-slate-700">{lastForwardLog.user_name} ({lastForwardLog.user_role})</span> • Remarks: <span className="italic">"{lastForwardLog.remarks}"</span>
                                </span>
                              </div>
                            )}

                            {/* File detail description block */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded px-2.5 py-0.5 text-xs text-slate-600 font-mono max-w-full truncate">
                                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate text-slate-700">{doc.file_name}</span>
                                <span className="text-slate-400 font-normal">({doc.file_size})</span>
                              </span>
                            </div>

                            {/* Optional Fast Stamping - rendered ONLY if seen verification has been completed */}
                            {doc.viewed_by_staff && (
                              <div className="pt-3 border-t border-dashed border-slate-100 flex flex-wrap items-center gap-2" id={`quick-stamps-panel-${doc.doc_id}`}>
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1 font-sans uppercase">
                                  <Zap className="w-3 h-3 text-amber-500" /> Fast Stamping:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    onClick={() => handleQuickStamp(doc, 'Processing', 'Quick Stamp: Reviewed physically and moved into station backlog processing state.')}
                                    className="px-2.5 py-1 text-[10px] font-sans font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                                    id={`quick-stamp-processing-${doc.doc_id}`}
                                  >
                                    Processing Stamp
                                  </button>
                                  <button
                                    onClick={() => handleQuickStamp(doc, 'Completed', 'Quick Stamp: Evaluated thoroughly and cleared under institutional program regulations.')}
                                    className="px-2.5 py-1 text-[10px] font-sans font-bold text-emerald-700 bg-emerald-55 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                    id={`quick-stamp-completed-${doc.doc_id}`}
                                  >
                                    Completed Stamp
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Control buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
                            {doc.viewed_by_staff ? (
                              <button
                                onClick={() => handleSelectDoc(doc)}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-indigo-200 text-indigo-750 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center justify-center gap-1 cursor-pointer text-indigo-800"
                                id={`update-doc-btn-${doc.doc_id}`}
                              >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                Detailed Update Panel
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSelectDoc(doc)}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-indigo-600 bg-indigo-600 hover:bg-indigo-750 text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                                id={`update-doc-btn-${doc.doc_id}`}
                              >
                                <Lock className="w-3.5 h-3.5 text-indigo-200/90" />
                                Open &amp; Verify Document
                              </button>
                            )}

                             {/* View Logs button removed for staff - authorization moved to Super Admin */}
                           </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* VIEW TAB: REGISTER & SEND DOCUMENT (50MB LIMIT) */}
            {viewTab === 'submit' && (
              <div className="space-y-6 animate-fadeIn" id="staff-submit-panel">
                <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-sans font-bold text-sm leading-tight flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-yellow-300" />
                    Register / Forward New Document
                  </h4>
                  <p className="text-xs text-teal-100 mt-1">
                    Staff Desk Privilege: Register new documents with other branches. Subject to a strict **50MB size limit**.
                  </p>
                </div>

                {sendFileError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2" id="send-file-error">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{sendFileError}</span>
                  </div>
                )}

                {sendSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold" id="send-success-msg">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{sendSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleStaffSubmitDocument} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="staff-send-title" className="text-xs font-bold text-slate-700">
                      Document Title / Subject
                    </label>
                    <input
                      id="staff-send-title"
                      type="text"
                      placeholder="e.g. Official Faculty Evaluation Report"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      value={sendTitle}
                      onChange={(e) => {
                        setSendFileError(null);
                        setSendTitle(e.target.value);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="staff-send-desc" className="text-xs font-bold text-slate-700">
                      Document Description / Purpose
                    </label>
                    <textarea
                      id="staff-send-desc"
                      rows={2}
                      placeholder="e.g. Faculty evaluation document for processing registrar credentials and clearance."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      value={sendDescription}
                      onChange={(e) => setSendDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Student Beneficiary Selection */}
                    <div className="space-y-1 sm:col-span-2">
                       <label htmlFor="staff-send-student" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                         <span>Student Beneficiary / Document Owner *</span>
                         <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">MAPPED TO SYSTEM STUDENT</span>
                       </label>
                       <select
                         id="staff-send-student"
                         className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-indigo-50/40 text-xs text-slate-800 focus:outline-none cursor-pointer"
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
                       <p className="text-[10px] text-slate-400">
                         The selected student will immediately see this newly registered filing inside their dynamic tracking hub!
                       </p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="staff-send-type" className="text-xs font-bold text-slate-700">
                        Document Type
                      </label>
                      <select
                        id="staff-send-type"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-sm text-slate-800 focus:outline-none cursor-pointer"
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
                      <label htmlFor="staff-send-office" className="text-xs font-bold text-slate-700">
                        Target Recipient Office Station
                      </label>
                      <select
                        id="staff-send-office"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-sm text-slate-800 focus:outline-none cursor-pointer"
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

                  {/* Drag and Drop Asset Uplink */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Document Attachment <span className="font-medium text-slate-400 font-mono">(Size limit: 50MB)</span>
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
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                        sendDragActive
                          ? 'border-indigo-600 bg-indigo-50/20'
                          : sendFileName
                          ? 'border-emerald-500 bg-emerald-50/10'
                          : 'border-slate-200 bg-slate-50/55 hover:bg-slate-50'
                      }`}
                      onClick={() => document.getElementById('staff-file-uploader')?.click()}
                    >
                      <input
                        type="file"
                        id="staff-file-uploader"
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
                          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                          <div className="text-sm font-semibold text-slate-700">
                            Drag &amp; drop document or <span className="text-indigo-600 underline">browse files</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                            Only standard document files (.docx, .pdf, .doc, .txt, .wps, .wpd) under 50MB are accepted.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 flex flex-col items-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <span className="font-bold text-slate-800 text-sm max-w-xs truncate">{sendFileName}</span>
                          <span className="text-xs bg-slate-150 text-slate-650 font-mono px-2 py-0.5 rounded">
                            {sendFileSize} • {sendFileFormat.toUpperCase()} valid.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-sans font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-0 mt-2"
                  >
                    <FileUp className="w-4 h-4" />
                    Register and Track Document (Staff 50MB limit)
                  </button>
                </form>
              </div>
            )}

            {/* VIEW TAB 2: SEAMLESS REPUTABLE LOGS AUDIT */}
            {viewTab === 'logs' && (
              <div className="space-y-4 animate-fadeIn" id="staff-logs-panel">
                
                {/* Security warning log isolation banner */}
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs" id="privacy-isolation-banner">
                  <Lock className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Staff Registry Log Isolation Active</span>
                    <p className="text-[11px] text-rose-700/90 mt-0.5 leading-relaxed">
                      Under institutional security rules, personnel can strictly only inspect logs of their own processing actions. Other staff members' registry logs are invisible, except to the **Academic Dean / Admin** console counters.
                    </p>
                  </div>
                </div>

                {/* Search query log and isolated filter switch */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search your tracking records, actions, remarks..."
                      value={logsSearchQuery}
                      onChange={(e) => setLogsSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-850 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
                      id="staff-logs-search"
                    />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-100 bg-rose-50/40 text-rose-800 text-xs font-semibold shrink-0" id="staff-isolation-shield">
                    <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>My Logs Only</span>
                  </div>
                </div>

                {/* Audit Trails List Layout */}
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-slate-50/65 rounded-2xl border-2 border-dashed border-slate-200/80">
                    <HelpCircle className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-slate-500 text-sm font-semibold mb-1">No logs matching search criteria</p>
                    <p className="text-slate-450 text-xs">
                      Try typing a different document ID, action, or commit transitions to populate your personal log history.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                    {filteredLogs.map((log) => {
                      const logDoc = documents.find(d => d.doc_id === log.doc_id);
                      return (
                        <div
                          key={log.log_id}
                          className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/55 hover:bg-white hover:shadow-xs transition-all space-y-2"
                          id={`staff-log-row-${log.log_id}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                {log.log_id}
                              </span>
                              <span className="text-[11px] font-mono font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
                                {log.doc_id}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 font-sans leading-relaxed">
                            <span className="font-bold text-slate-900">{logDoc ? logDoc.title : 'External Document'}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 font-sans border-t border-slate-100/50 pt-2">
                            <div>
                              <span className="text-slate-400 font-semibold font-sans">Campus Signer:</span>{' '}
                              <span className="font-bold text-slate-800">{log.user_name}</span> ({log.user_role})
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold font-sans">Action Executed:</span>{' '}
                              <span className="font-mono font-bold uppercase text-[10px] text-purple-700 bg-purple-55 bg-purple-50 px-1.5 py-0.5 rounded">
                                {log.action_taken}
                              </span>
                            </div>
                          </div>

                          {log.remarks && (
                            <div className="text-xs font-serif italic text-slate-650 bg-white border border-slate-150 rounded-lg p-2.5 mt-2 leading-relaxed text-slate-600 select-all">
                              &ldquo;{log.remarks}&rdquo;
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Status update work pane Column */}
        <div className="lg:col-span-5">
          {activeDoc ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-6 py-5">
                <h3 className="font-sans font-bold text-lg leading-tight flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-300" />
                  Life Cycle Update Control
                </h3>
                <p className="text-xs text-indigo-100 mt-1">Configure status workflow transitions for {activeDoc.doc_id}</p>
              </div>

              <form onSubmit={handleStatusTransitionSubmit} className="p-6 space-y-5">
                {/* Visual Header displaying Document Info */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 font-sans space-y-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                    Selected Track
                  </span>
                  <div className="font-sans font-bold text-slate-800 text-sm mt-1 mb-1.5 break-words">
                    {activeDoc.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Station: {offices.find(o => o.office_id === activeDoc.office_id)?.office_name}
                  </div>
                  {activeDoc.description && (
                    <div className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100 mt-1.5">
                      &ldquo;{activeDoc.description}&rdquo;
                    </div>
                  )}

                  {/* Download Action */}
                  <div className="pt-2 border-t border-slate-200/60 mt-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadDocFile(activeDoc)}
                      className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-colors"
                      title="Download received file with original file extension"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Document ({activeDoc.file_format ? activeDoc.file_format.toUpperCase() : 'DOC'})
                    </button>
                  </div>
                </div>

                {/* Status Selection Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="workflow-status-sel" className="text-sm font-semibold text-slate-700">
                    Target Workflow State
                  </label>
                  <select
                    id="workflow-status-sel"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white shadow-xs focus:border-indigo-600 focus:outline-none cursor-pointer text-slate-800"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as Document['current_status'])}
                  >
                    <option value="Pending">Pending (Hold / Review state)</option>
                    <option value="Processing">Processing (Under Verification)</option>
                    <option value="Forwarded">Forwarded (Route to destination office)</option>
                    <option value="Completed">Completed (Request Resolution OK)</option>
                    <option value="Rejected">Rejected (Incomplete specs / Denied)</option>
                  </select>
                </div>

                {/* Forwarding office section displayed ONLY when status is Forwarded */}
                {newStatus === 'Forwarded' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label htmlFor="forward-office-sel" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <Compass className="w-4 h-4 text-purple-600" />
                      Destination School Office
                    </label>
                    <select
                      id="forward-office-sel"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white shadow-sm focus:border-purple-600 focus:outline-none cursor-pointer text-slate-800"
                      value={forwardOfficeId}
                      onChange={(e) => setForwardOfficeId(e.target.value)}
                    >
                      {offices
                        .filter((o) => o.office_id !== activeDoc.office_id)
                        .map((off) => (
                          <option key={off.office_id} value={off.office_id}>
                            {off.office_name} ({off.office_id})
                          </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      Forwarding updates the physical location in the registry logs.
                    </p>

                    <div className="space-y-1.5 font-sans mt-3">
                      <label htmlFor="forward-description-text" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Forwarding Reason / Dispatch Notes *</span>
                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 rounded px-1.5 py-0.5">MANDATORY</span>
                      </label>
                      <textarea
                        id="forward-description-text"
                        rows={3}
                        placeholder="Provide details or routing instructions for the destination office (e.g., Forwarding for program validation or registrar sign-off verification.)"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs shadow-xs focus:border-purple-600 focus:outline-none text-slate-800 placeholder-slate-400"
                        value={forwardDescription}
                        onChange={(e) => setForwardDescription(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Re-edit Received Document Option */}
                <div className="border border-slate-250/80 rounded-xl p-3 bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableReEdit}
                      onChange={(e) => {
                        setEnableReEdit(e.target.checked);
                        if (e.target.checked) {
                          setEditTitle(activeDoc.title);
                          setEditDescription(activeDoc.description || '');
                          setEditType(activeDoc.type);
                          setEditFileName(activeDoc.file_name);
                          setEditFileSize(activeDoc.file_size);
                          setEditFileFormat(activeDoc.file_format);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4 bg-white cursor-pointer"
                    />
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      Re-edit received file details
                    </div>
                  </label>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Allows correcting or updating metadata details of this active track file.
                  </span>
                </div>

                {enableReEdit && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-250/80 space-y-3.5 animate-fadeIn">
                    <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-indigo-800 block">
                      Edit File Metadata
                    </span>

                    <div className="space-y-1">
                      <label htmlFor="edit-doc-title" className="text-[10px] font-bold text-slate-600">
                        Revised Document Title / Subject
                      </label>
                      <input
                        id="edit-doc-title"
                        type="text"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                        value={editTitle}
                        onChange={(e) => {
                          setUpdateError(null);
                          setEditTitle(e.target.value);
                        }}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="edit-doc-desc" className="text-[10px] font-bold text-slate-600">
                        Revised Description / Purpose
                      </label>
                      <textarea
                        id="edit-doc-desc"
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-850 focus:outline-none"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="edit-doc-type" className="text-[10px] font-bold text-slate-600">
                        Revised Document Type
                      </label>
                      <select
                        id="edit-doc-type"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 cursor-pointer"
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                      >
                        {CKC_DOCUMENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Choose/replace file attachment */}
                    <div className="space-y-1.5 border-t border-slate-200/50 pt-2.5">
                      <span className="text-[10px] font-bold text-slate-600 block">
                        Replace File Asset
                      </span>
                      {editFileError && (
                        <div className="text-[10px] text-rose-600 font-semibold">{editFileError}</div>
                      )}
                      <div
                        onClick={() => document.getElementById('edit-file-uploader')?.click()}
                        className="border border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-2.5 text-center bg-white cursor-pointer transition-colors text-[11px] font-medium text-indigo-600"
                      >
                        <input
                          type="file"
                          id="edit-file-uploader"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              validateAndSetEditFile(file.name, file.size);
                            }
                          }}
                        />
                        {editFileName ? (
                          <div className="text-slate-800 font-semibold truncate max-w-[200px] mx-auto">
                            📂 {editFileName} ({editFileSize})
                          </div>
                        ) : (
                          "Click to replace active file"
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Remarks - programmatic constraint (MANDATORY on Page 44) */}
                {newStatus === 'Forwarded' ? (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center font-sans">
                    <p className="text-xs font-bold text-slate-500">Action Audit Remarks Disabled</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Route updates automatically log standardized dispatch notices for system reliability.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 font-sans animate-fadeIn">
                    <label htmlFor="remarks-text" className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                      <span>Professional Remarks / Action Audit *</span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded px-1 font-mono uppercase shrink-0">
                        MANDATORY
                      </span>
                    </label>

                    {/* Canned comments selector layout */}
                    <select
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-indigo-50/50 hover:bg-indigo-50/80 text-indigo-800 focus:outline-none cursor-pointer mb-1.5 transition-colors"
                      onChange={(e) => {
                        if (e.target.value) {
                          setRemarks(e.target.value);
                        }
                      }}
                      id="staff-canned-remarks-dropdown"
                    >
                      {GET_CANNED_REMARKS_BY_TYPE(activeDoc.type, 'Staff').map((item, idx) => (
                        <option key={idx} value={item.value}>{item.label}</option>
                      ))}
                    </select>

                    <textarea
                      id="remarks-text"
                      rows={4}
                      placeholder={`Provide professional ${activeDoc.type} remarks or justifications describing evaluation status...`}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-indigo-600 focus:outline-none text-slate-800 placeholder-slate-400"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-slate-400 italic">
                      All remarks are permanently archived in the student tracking dashboard under audit laws.
                    </p>
                  </div>
                )}

                {/* Alerts indicators errors/success */}
                {updateError && (
                  <div className="rounded-xl bg-rose-50 text-rose-800 px-4 py-3.5 text-xs font-medium border border-rose-100 flex items-start gap-2" id="workflow-err-alert">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>{updateError}</div>
                  </div>
                )}

                {updateSuccess && (
                  <div className="rounded-xl bg-emerald-50 text-emerald-800 px-4 py-3 text-xs font-semibold border border-emerald-100 flex items-center gap-2" id="workflow-succ-alert">
                    <ClipboardCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>{updateSuccess}</div>
                  </div>
                )}

                {/* Submission Action */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-sm py-3.5 px-4 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                    id="staff-apply-transition-btn"
                  >
                    <ArrowRight className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                    Commit Workflow Update
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedDocId(null)}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3.5 font-bold text-sm transition-colors cursor-pointer"
                    id="staff-cancel-pane-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-8 text-center text-slate-400 sticky top-6 flex flex-col items-center justify-center min-h-[300px]">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700 font-sans mb-1">State Transition Engine</p>
              <p className="text-xs max-w-xs leading-relaxed text-slate-400">
                Select any document from the list on the left to initiate status updates, coordinate tracking trails, or forward files.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
