/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Search, Download, ClipboardList, Eye, FileText, User as UserIcon, Clock, ChevronRight, FileClock, ShieldAlert, BadgeInfo } from 'lucide-react';
import { Document, AccountabilityLog, Office, User as UserType } from '../types';

interface SuperAdminWorkspaceProps {
  documents: Document[];
  logs: AccountabilityLog[];
  offices: Office[];
  users: UserType[];
}

export default function SuperAdminWorkspace({
  documents,
  logs,
  offices,
  users,
}: SuperAdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'audit_trails' | 'registry_logs'>('audit_trails');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  // 1. Registry Logs Filtering & Handling
  const filteredLogs = logs.filter((log) => {
    const searchString = `${log.log_id || ''} ${log.doc_id || ''} ${log.user_name || ''} ${log.user_role || ''} ${log.action_taken || ''} ${log.remarks || ''}`.toLowerCase();
    return searchString.includes(logSearchQuery.toLowerCase());
  });

  // Export CSV functional handler
  const handleExportCSV = () => {
    try {
      const headers = ['Log ID', 'Document ID', 'Date/Time', 'Signer / Processor', 'Role', 'Action Taken', 'Professional Remarks'];
      const rows = filteredLogs.map((log) => [
        log.log_id,
        log.doc_id,
        new Date(log.timestamp).toISOString(),
        log.user_name.replace(/"/g, '""'),
        log.user_role,
        log.action_taken.replace(/"/g, '""'),
        log.remarks.replace(/"/g, '""'),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.map((field) => `"${field}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `CKC_DocuTrack_SuperAdmin_Accountability_Logs_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  // 2. Audit Trails Selection & Filtering
  const selectedDoc = documents.find((d) => d.doc_id === selectedDocId) || null;
  const documentLogs = selectedDoc
    ? logs
        .filter((l) => l.doc_id === selectedDoc.doc_id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const getStatusColor = (status: string) => {
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
    <div className="space-y-6 font-sans" id="super-admin-workspace-view">
      {/* Visual Header Banner for Super Admin with Red Shield Accent in clean light style */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-200 shadow-2xs shrink-0">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest font-extrabold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-150 uppercase">
                LEVEL 4 SECURITY ACCESS
              </span>
              <span className="text-[10px] font-mono text-slate-400">| FULL ROOT CLEARANCE</span>
            </div>
            <h2 className="font-sans font-bold text-slate-900 text-lg mt-1 tracking-tight">
              Super Admin Core Dashboard
            </h2>
          </div>
        </div>

        <div className="flex items-center bg-slate-50 px-4 py-2 border border-slate-200 rounded-xl font-mono text-xs text-slate-500 gap-2 shrink-0">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span>Security Officer Console:</span>
          <span className="font-bold text-slate-850">Super Administrator</span>
        </div>
      </div>

      {/* Navigation Section Tabs - Matching Gov panels */}
      <div className="flex flex-wrap gap-1.5" id="super-admin-console-tab-list">
        <button
          onClick={() => setActiveTab('audit_trails')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit_trails'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200'
          }`}
          id="tab-super-audit-btn"
        >
          <Clock className="w-3.5 h-3.5" />
          Universal Audit Trails
        </button>

        <button
          onClick={() => setActiveTab('registry_logs')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'registry_logs'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200'
          }`}
          id="tab-super-registry-btn"
        >
          <Database className="w-3.5 h-3.5" />
          System-Wide Registry Logs
        </button>
      </div>

      {/* ======================= TAB: UNIVERSAL AUDIT TRAILS ======================= */}
      {activeTab === 'audit_trails' && (
        <div className="space-y-6 animate-fadeIn" id="super-panel-audit-trails">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-slate-950 text-[15px]">Document Life-Cycle Inspector</h3>
              <p className="text-xs text-slate-500">Select any active or archived system document to verify its full path, custodian stations, and encoder signatures.</p>
            </div>

            {/* Document selector dropdown */}
            <div className="space-y-1.5 max-w-xl">
              <label htmlFor="super-doc-selector" className="text-xs font-bold text-slate-700">
                Select Document to Inspect
              </label>
              <select
                id="super-doc-selector"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 cursor-pointer transition-all shadow-2xs"
              >
                <option value="">-- Choose registered document from university file-pool --</option>
                {documents.map((doc) => {
                  const beneficiary = users.find((u) => u.user_id === doc.creator_id);
                  return (
                    <option key={doc.doc_id} value={doc.doc_id}>
                      {doc.doc_id} - {doc.title} ({doc.type} • Owner: {beneficiary ? beneficiary.full_name : 'N/A'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {selectedDoc ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* File Details (Left panel - 4 cols) */}
              <div className="lg:col-span-4 space-y-4 font-sans">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileClock className="w-4.5 h-4.5 text-red-500" />
                    Filing Parameters
                  </h4>

                  <div className="border-t border-slate-100 pt-3.5 space-y-3.5 font-sans">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Document Reference</span>
                      <span className="font-mono text-xs font-bold text-red-650 block">{selectedDoc.doc_id}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Title / Description</span>
                      <p className="text-xs font-bold text-slate-800 block leading-normal">{selectedDoc.title}</p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Filing Category</span>
                      <span className="text-xs text-slate-600 block font-medium">{selectedDoc.type}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Current Clearance Station</span>
                      <span className="text-xs text-indigo-600 block font-semibold">
                        {offices.find((o) => o.office_id === selectedDoc.office_id)?.office_name || selectedDoc.office_id}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Workflow Level Status</span>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusColor(selectedDoc.current_status)}`}>
                          {selectedDoc.current_status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Physical File Asset</span>
                      <div className="font-mono text-[11px] text-slate-650 bg-slate-50 border border-slate-200 rounded px-2 py-1 max-w-full truncate inline-block">
                        {selectedDoc.file_name} ({selectedDoc.file_size})
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Interactive Timeline (Right panel - 8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h4 className="font-sans font-bold text-slate-950 text-sm mb-6 border-b border-slate-100 pb-3.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500 animate-pulse" />
                    Secure Chronological Audit Log
                  </h4>

                  {documentLogs.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No logs registered yet.</p>
                  ) : (
                    <div className="flow-root max-h-[500px] overflow-y-auto pr-2">
                      <ul className="-mb-8">
                        {documentLogs.map((log, idx) => {
                          const showLine = idx !== documentLogs.length - 1;
                          return (
                            <li key={log.log_id || idx} className="relative pb-8 font-sans">
                              {showLine && (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                              )}
                              <div className="relative flex space-x-3 items-start">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 text-red-500 flex items-center justify-center ring-8 ring-white">
                                    <UserIcon className="h-4 w-4 text-red-500" />
                                  </span>
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
                                  <div className="text-xs text-slate-500 flex flex-wrap justify-between items-center gap-1.5">
                                    <span className="font-bold text-slate-850 flex items-center gap-2">
                                      {log.user_name}
                                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-650 border border-slate-200 px-1.5 py-0.5 rounded uppercase font-semibold">
                                        {log.user_role}
                                      </span>
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                  </div>

                                  <div className="bg-slate-50/60 border border-slate-150 px-4 py-3 rounded-xl shadow-2xs">
                                    <div className="font-mono text-[9px] font-bold uppercase text-red-650 tracking-wider">
                                      Action Code: {log.action_taken}
                                    </div>
                                    <p className="text-xs text-slate-650 leading-relaxed font-sans mt-1.5 italic">
                                      &ldquo;{log.remarks}&rdquo;
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center text-slate-400 max-w-full">
              <BadgeInfo className="h-12 w-12 text-slate-350 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700">No Document Inspected</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-sans leading-normal">
                Please pick any clearance folder or academic filing document from the list box above to load its secure, non-malleable audit trails.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB: SYSTEM-WIDE REGISTRY LOGS ======================= */}
      {activeTab === 'registry_logs' && (
        <div className="space-y-4 animate-fadeIn" id="super-panel-registry-logs">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-[15px]">Full Core Registry System Logs</h3>
              <p className="text-xs text-slate-500 font-sans">Chronological ledger representing all historical transitions and validations across CKC.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 text-xs font-sans bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border-0"
                id="super-btn-export-csv"
              >
                <Download className="w-4 h-4 text-white" />
                Export Spreadsheet (CSV)
              </button>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ledger entries..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 font-sans"
                  id="super-audit-log-search-input"
                />
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-slate-50 py-16 text-center text-slate-400 border border-slate-200 rounded-xl font-sans text-xs">
              No system log records matching current query parameters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[550px] bg-white">
              <table className="w-full text-left border-collapse text-xs text-slate-650" id="super-audit-log-table">
                <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5">Log Code / Date</th>
                    <th className="p-3.5">Doc ID</th>
                    <th className="p-3.5">User Signatory</th>
                    <th className="p-3.5">Action Code</th>
                    <th className="p-3.5">Clearance Comments / Professional remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-sans text-xs">
                  {filteredLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-55/30 hover:bg-slate-50/40 transition-all">
                      <td className="p-3.5 space-y-0.5 font-mono shrink-0">
                        <span className="font-bold block text-red-650">{log.log_id}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3.5 text-indigo-900 font-bold font-mono">
                        {log.doc_id}
                      </td>
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-semibold text-slate-800">{log.user_name}</div>
                        <div className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                          {log.user_role}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 bg-slate-50 rounded text-red-650 border border-slate-200 font-bold font-mono uppercase text-[9px]">
                          {log.action_taken}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 italic text-xs max-w-md whitespace-normal leading-relaxed">
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
    </div>
  );
}
