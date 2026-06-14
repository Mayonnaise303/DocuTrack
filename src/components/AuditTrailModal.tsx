/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, X, Clock, User, ClipboardList, ArrowRight } from 'lucide-react';
import { Document, AccountabilityLog, Office } from '../types';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  logs: AccountabilityLog[];
  offices: Office[];
}

export default function AuditTrailModal({
  isOpen,
  onClose,
  document,
  logs,
  offices,
}: AuditTrailModalProps) {
  if (!isOpen || !document) return null;

  // Filter logs related to this document, sorted newest first
  const documentLogs = logs
    .filter((log) => log.doc_id === document.doc_id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const currentOffice = offices.find((o) => o.office_id === document.office_id);

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
    <div className="fixed inset-0 z-50 overflow-y-auto" id="audit-trail-modal">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/60" onClick={onClose} />

        {/* Modal panel positioning elements */}
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="relative z-10 inline-block transform rounded-2xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-amber-400 animate-pulse" id="modal-icon-audit" />
              <div>
                <h3 className="font-sans font-bold text-lg tracking-tight leading-none">Document Audit Trail</h3>
                <p className="text-xs text-indigo-100 mt-1">{document.doc_id} • Real-time Movement History</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-indigo-200 hover:bg-slate-700/50 hover:text-white transition-colors"
              id="close-audit-modal-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Document details box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <div className="text-xs font-mono font-medium text-slate-400 tracking-wider">DOCUMENT TITLE</div>
                <div className="font-sans text-md font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                  {document.title}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono text-slate-400">DOCUMENT TYPE</div>
                <div className="text-sm font-medium text-slate-700">{document.type}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono text-slate-400">CURRENT WORKFLOW STATUS</div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.current_status)}`}>
                    {document.current_status}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono text-slate-400">ATTACHED FILE</div>
                <div className="text-sm font-mono text-xs text-slate-600 truncate bg-white px-2 py-1 rounded border border-slate-200/60 inline-block max-w-full">
                  {document.file_name} ({document.file_size})
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono text-slate-400">CURRENT REGISTRY LOCATION</div>
                <div className="text-sm font-medium text-slate-700">
                  {currentOffice ? `${currentOffice.office_name} (${currentOffice.office_id})` : 'Unassigned Office'}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-sans font-semibold text-slate-800 text-sm mb-4 border-b pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
              Chronological Audit Milestones
              </h4>

              {documentLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm font-sans">
                  No action logs registered for this document yet.
                </div>
              ) : (
                <div className="flow-root max-h-96 overflow-y-auto pr-2">
                  <ul className="-mb-8">
                    {documentLogs.map((log, index) => (
                      <li key={log.log_id || index}>
                        <div className="relative pb-8">
                          {index !== documentLogs.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3 items-start">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center ring-8 ring-white">
                                <User className="h-4 w-4" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="text-sm text-slate-500 flex flex-wrap justify-between items-center gap-1">
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  {log.user_name}
                                  <span className="text-xs font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                    {log.user_role}
                                  </span>
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                  {new Date(log.timestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className="text-xs font-mono text-indigo-600 font-semibold mt-1 uppercase flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 text-indigo-500" />
                                {log.action_taken}
                              </div>
                              <div className="mt-2 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100/80 italic font-serif">
                                &ldquo;{log.remarks || 'No notes appended.'}&rdquo;
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl px-4 py-2 border border-slate-200 bg-white text-sm font-semibold font-sans text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              id="modal-close-foot-btn"
            >
              Close History Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
