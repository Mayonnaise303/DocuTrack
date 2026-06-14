/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Upload, FileUp, ListFilter, AlertTriangle, CheckCircle, Eye, Search, FileText } from 'lucide-react';
import { Document, AccountabilityLog, Office, User, ALLOWED_DOCUMENT_EXTENSIONS } from '../types';
import { CKC_DOCUMENT_TYPES } from '../initialData';

interface StudentWorkspaceProps {
  students: User[];
  currentStudent: User;
  onStudentChange: (student: User) => void;
  documents: Document[];
  offices: Office[];
  logs: AccountabilityLog[];
  onAddDocument: (newDoc: Document, initialLog: AccountabilityLog) => void;
  onOpenAuditTrail: (doc: Document) => void;
}

export default function StudentWorkspace({
  students,
  currentStudent,
  onStudentChange,
  documents,
  offices,
  logs,
  onAddDocument,
  onOpenAuditTrail,
}: StudentWorkspaceProps) {
  // Document Request Form State
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docType, setDocType] = useState(CKC_DOCUMENT_TYPES[0]);
  const [targetOfficeId, setTargetOfficeId] = useState(offices[0]?.office_id || 'OFF-REG');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // File Upload State
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileFormat, setFileFormat] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Student specific document search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter student's own documents (excluding archived documents for beautiful rendering)
  const studentDocs = documents.filter((doc) => doc.creator_id === currentStudent.user_id && !doc.is_archived);

  // Apply search & status filters
  const filteredDocs = studentDocs.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.doc_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : doc.current_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Strict validation function for file extension and size
  const validateAndSetFile = (name: string, sizeInBytes: number) => {
    setFileError(null);
    setSubmitSuccess(null);
    const parts = name.split('.');
    const ext = parts[parts.length - 1].toLowerCase();

    // Size calculation
    let sizeStr = 'unknown size';
    if (sizeInBytes > 1024 * 1024) {
      sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (sizeInBytes > 1024) {
      sizeStr = `${(sizeInBytes / 1024).toFixed(0)} KB`;
    } else {
      sizeStr = `${sizeInBytes} bytes`;
    }

    // Physical Code Size Limit Check: Strict 20MB limit (20 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 20 * 1024 * 1024;
    if (sizeInBytes > MAX_SIZE_BYTES) {
      setFileName('');
      setFileSize('');
      setFileFormat('');
      setFileError(
        `File rejected! Your attachment (${sizeStr}) exceeds the student 20MB limit. To optimize university network capacity, student role filings are capped at 20MB per file. Staff is allowed 50MB and Academic Dean has unlimited capacity.`
      );
      return false;
    }

    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
      setFileName('');
      setFileSize('');
      setFileFormat('');
      setFileError(
        `File rejected! "${ext.toUpperCase()}" format is restricted. The DocuTrack system permits standard document and secure reader formats (.docx, .pdf, .doc, .txt, .wps, .wpd). Non-document formats like PowerPoint (PPT), images, or executables are strictly restricted for school data security.`
      );
      return false;
    }

    setFileName(name);
    setFileSize(sizeStr);
    setFileFormat(ext);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file.name, file.size);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file.name, file.size);
    }
  };

  // Pre-validate document inputs, then prompt for confirmation
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setFileError('Please provide a document subject/title.');
      return;
    }
    if (!fileName) {
      setFileError('Please choose or drag-and-drop a valid school document file before submitting.');
      return;
    }

    setFileError(null);
    setSubmitSuccess(null);
    setShowConfirmation(true);
  };

  // Perform actual document submission of tracked record
  const handleConfirmSubmission = () => {
    setShowConfirmation(false);

    // Auto generate ID matching standard CKC counter
    const docIdCounter = documents.length + 1;
    const year = new Date().getFullYear();
    const docId = `DOC-${year}-${String(docIdCounter).padStart(4, '0')}`;
    const isoString = new Date().toISOString();

    const newDocument: Document = {
      doc_id: docId,
      title: docTitle.trim(),
      type: docType,
      description: docDescription.trim(),
      current_status: 'Pending',
      date_received: isoString,
      office_id: targetOfficeId,
      creator_id: currentStudent.user_id,
      file_name: fileName,
      file_size: fileSize,
      file_format: fileFormat,
    };

    const initialLog: AccountabilityLog = {
      log_id: `LOG-${Date.now()}`,
      doc_id: docId,
      user_id: currentStudent.user_id,
      user_name: currentStudent.full_name,
      user_role: 'Student',
      action_taken: 'Document Registered',
      remarks: `Submitted document request for processing in target department. Initial filing via DocuTrack portal. Description: ${docDescription.trim() || 'No description provided.'}`,
      timestamp: isoString,
    };

    onAddDocument(newDocument, initialLog);

    // Clear and state reset
    setDocTitle('');
    setDocDescription('');
    setFileName('');
    setFileSize('');
    setFileFormat('');
    setSubmitSuccess(`Document submitted successfully! Assigned tracking ID: ${docId}`);
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
    <div className="space-y-8" id="student-workspace">
      {/* Simulation Selector Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-amber-200 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
            Simulated Sandbox Mode
          </span>
          <p className="text-sm mt-1.5 text-slate-700 leading-relaxed">
            Switch between students to test personal document segregation and view how individuals monitor their own requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="student-sim-select" className="text-xs font-semibold text-slate-500 font-sans uppercase">
            Active Student User:
          </label>
          <select
            id="student-sim-select"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-blue-600 cursor-pointer"
            value={currentStudent.user_id}
            onChange={(e) => {
              const f = students.find((s) => s.user_id === e.target.value);
              if (f) onStudentChange(f);
            }}
          >
            {students.map((student) => (
              <option key={student.user_id} value={student.user_id}>
                {student.full_name} ({student.email.split('@')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Submission Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-6 py-5">
              <h3 className="font-sans font-bold text-lg leading-tight flex items-center gap-2">
                <FileUp className="w-5 h-5 text-amber-300" />
                Initiate School Request
              </h3>
              <p className="text-xs text-indigo-100 mt-1">Submit digital assets for official processing and tracking.</p>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
              {/* Target Title */}
              <div className="space-y-1.5">
                <label htmlFor="doc-title-in" className="text-sm font-semibold text-slate-700">
                  Document Title / Subject
                </label>
                <input
                  id="doc-title-in"
                  type="text"
                  placeholder="e.g. Clearance application for graduation filing"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-xs focus:border-indigo-600 focus:outline-none transition-colors text-slate-800"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  required
                />
              </div>

              {/* Document Description */}
              <div className="space-y-1.5">
                <label htmlFor="doc-desc-in" className="text-sm font-semibold text-slate-700">
                  Document Description / Purpose
                </label>
                <textarea
                  id="doc-desc-in"
                  rows={2}
                  placeholder="e.g. Clearance from athletics, library, guidance and registrar departments."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-xs focus:border-indigo-600 focus:outline-none transition-colors text-slate-800 placeholder-slate-400"
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                />
              </div>

              {/* Type Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="doc-type-sel" className="text-sm font-semibold text-slate-700">
                    Document Type
                  </label>
                  <select
                    id="doc-type-sel"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white shadow-xs focus:border-indigo-600 focus:outline-none cursor-pointer text-slate-800"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    {CKC_DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="doc-office-sel" className="text-sm font-semibold text-slate-700">
                    Routing Office (Submit To)
                  </label>
                  <select
                    id="doc-office-sel"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white shadow-xs focus:border-indigo-600 focus:outline-none cursor-pointer text-slate-800"
                    value={targetOfficeId}
                    onChange={(e) => setTargetOfficeId(e.target.value)}
                  >
                    {offices.map((off) => (
                      <option key={off.office_id} value={off.office_id}>
                        {off.office_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Secure File Upload Drag and Drop Area */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">
                  Verify or Attach Document Asset
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    className="hidden"
                    accept=".doc,.docx,.txt,.wps,.wpd"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                    <Upload className="mx-auto h-10 w-10 text-slate-400" id="upload-cloud-icon-st" />
                    <span className="block text-sm font-semibold text-slate-700">
                      Drag & Drop your document here, or <span className="text-indigo-600 hover:underline">browse files</span>
                    </span>
                    <span className="block text-xs font-mono text-slate-400">
                      Allowed local formats: doc, docx, txt, wps, wpd (Max 50MB)
                    </span>
                  </label>
                </div>

                {/* Live upload metadata indicator or Error */}
                {fileError && (
                  <div className="rounded-xl bg-rose-50 text-rose-800 p-4 text-xs font-medium border border-rose-100 flex items-start gap-2.5 mt-2 shadow-sm leading-relaxed" id="upload-file-error-alert">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>{fileError}</div>
                  </div>
                )}

                {fileName && !fileError && (
                  <div className="rounded-xl bg-indigo-50 text-indigo-900 px-4 py-3 text-xs font-medium border border-indigo-100 flex items-center justify-between mt-2" id="selected-file-meta-indicator">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-5.5 w-5.5 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold block truncate text-slate-800 text-xs">{fileName}</span>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wide">{fileSize} | Format: .{fileFormat}</span>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 font-sans px-2 py-0.5 rounded-full text-[10px] uppercase font-bold shrink-0">
                      Verified Layout
                    </span>
                  </div>
                )}
              </div>

              {submitSuccess && (
                <div className="rounded-xl bg-emerald-50 text-emerald-800 p-4 text-xs font-semibold border border-emerald-100 flex items-center gap-3" id="submission-success-indicator">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>{submitSuccess}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 font-sans font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                id="student-submit-doc-btn"
              >
                <FileUp className="w-4 h-4 text-amber-300" />
                Submit and Register Document
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            
            <div className="space-y-6" id="student-tabset-requests">
              {/* List Header and Queries */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-sans font-bold text-slate-850 text-md">Active Tracked Filings</h3>
                  <p className="text-xs text-slate-400">Current status of requests stationed at campus desks</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center bg-slate-100 text-slate-700 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border">
                    Active: {studentDocs.length}
                  </span>
                  {studentDocs.length > 0 && (
                    <span className="inline-flex items-center bg-emerald-50 text-emerald-750 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      Done: {studentDocs.filter(d => d.current_status === 'Completed').length}
                    </span>
                  )}
                </div>
              </div>

              {/* Queries & Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-2">
                <div className="sm:col-span-8 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Query tracking ID or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all text-slate-800"
                    id="student-search-input"
                  />
                </div>

                <div className="sm:col-span-4 select-wrapper">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                    id="student-filter-select"
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

              {/* Document Cards */}
              {filteredDocs.length === 0 ? (
                <div className="text-center py-16 px-4 bg-slate-50/60 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-sans">
                    {studentDocs.length === 0
                      ? 'Submit your first document request using the form on the left to start processing.'
                      : 'No document matching selected filters or search keyword.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredDocs.map((doc) => {
                    const currentOffice = offices.find((o) => o.office_id === doc.office_id);
                    const docLogs = logs.filter((l) => l.doc_id === doc.doc_id);
                    const lastForwardLog = docLogs
                      .filter((l) => l.action_taken && l.action_taken.toLowerCase().includes('forwarded'))
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                    return (
                      <div
                        key={doc.doc_id}
                        className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl p-4 transition-all hover:shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative"
                        id={`student-doc-card-${doc.doc_id}`}
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {doc.doc_id}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 text-[9px] uppercase font-bold tracking-wide rounded-full ${getStatusBadgeClass(doc.current_status)}`}>
                              {doc.current_status}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 font-sans">
                              {new Date(doc.date_received).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <h4 className="font-sans font-bold text-slate-800 text-sm leading-snug tracking-tight">
                            {doc.title}
                          </h4>

                          {doc.description && (
                            <p className="text-xs text-slate-600 bg-slate-50/70 border border-slate-100 px-2.5 py-1.5 rounded-lg italic font-sans max-w-full">
                              &ldquo;{doc.description}&rdquo;
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-sans">
                            <div>
                              <span className="font-semibold text-slate-400">Class:</span> {doc.type}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Current Station:</span> <span className="font-semibold text-slate-700">{currentOffice?.office_name || 'Unassigned'}</span>
                            </div>
                          </div>

                          {/* Forwarded detail callout */}
                          {doc.current_status === 'Forwarded' && lastForwardLog && (
                            <div className="mt-1 p-2 bg-purple-50/70 hover:bg-purple-100/60 border border-purple-100 rounded-lg text-[11px] text-purple-950 font-sans flex flex-col gap-0.5 shadow-2xs" id={`forwarded-badge-st-${doc.doc_id}`}>
                              <span className="font-bold flex items-center gap-1 text-purple-900">
                                <span className="h-1.5 w-1.5 bg-purple-600 rounded-full"></span>
                                Route Movement: {lastForwardLog.action_taken}
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                Actioned by: <span className="font-semibold text-slate-700">{lastForwardLog.user_name} ({lastForwardLog.user_role})</span> • Remarks: <span className="italic">"{lastForwardLog.remarks}"</span>
                              </span>
                            </div>
                          )}

                          {/* File detail tag info */}
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 rounded px-2 py-0.5 text-[11px] font-mono text-slate-600 max-w-full truncate">
                            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{doc.file_name}</span>
                            <span className="text-slate-400 shrink-0 font-normal">({doc.file_size})</span>
                          </div>
                        </div>

                        {/* Action buttons removed for student - authorization moved to Super Admin */}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Modern Student Submission Safety Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="submit-confirm-overlay">
          <div 
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden text-left"
            id="submit-confirm-modal"
          >
            {/* Modal Warning Ribbon */}
            <div className="p-6 pb-0 flex gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0" id="confirm-warning-icon-wrapper">
                <AlertTriangle className="h-6 w-6 text-rose-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-extrabold text-slate-900 text-sm" id="confirm-modal-title">
                  Confirm Document Submission
                </h4>
                <p className="text-xs text-rose-600 font-medium leading-relaxed" id="confirm-modal-warning-text">
                  Once registered to Christ the King College routing server, you cannot remove, recall, or delete this file.
                </p>
              </div>
            </div>

            {/* Document metadata overview for student sanity check */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Please double check your submission details before proceeding. Your document will enter the official system audit log instantaneously.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5" id="confirm-metadata-viewer">
                <div className="text-xs">
                  <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Subject/Title:</span>
                  <span className="font-sans font-bold text-slate-800 break-words">{docTitle}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Document Type:</span>
                    <span className="font-sans font-semibold text-slate-700">{docType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Target Destination:</span>
                    <span className="font-sans font-semibold text-slate-700">
                      {offices.find(o => o.office_id === targetOfficeId)?.office_name || 'Desk office'}
                    </span>
                  </div>
                </div>
                <div className="text-xs border-t border-slate-200/50 pt-2 flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{fileName}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">({fileSize})</span>
                </div>
              </div>
            </div>

            {/* Interactive Control actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-3" id="confirm-modal-actions">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all border border-slate-200 bg-white cursor-pointer"
                id="btn-cancel-submit"
              >
                Go Back & Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmission}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-850 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                id="btn-confirm-submit"
              >
                Yes, Securely Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
