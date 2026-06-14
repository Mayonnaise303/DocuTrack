/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, GraduationCap, Users, RefreshCw, FileText, ClipboardList, Info, HelpCircle, Bell, BellOff, Check, Trash2 } from 'lucide-react';
import { Role, Office, User, Document, AccountabilityLog, Notification } from './types';
import { getStoredData, saveStoredData, INITIAL_DOCUMENTS, INITIAL_LOGS, INITIAL_OFFICES, INITIAL_USERS, INITIAL_NOTIFICATIONS } from './initialData';
import StudentWorkspace from './components/StudentWorkspace';
import StaffWorkspace from './components/StaffWorkspace';
import AdminWorkspace from './components/AdminWorkspace';
import SuperAdminWorkspace from './components/SuperAdminWorkspace';
import AuditTrailModal from './components/AuditTrailModal';

export default function App() {
  // 1. Core database states initialized from localStorage persistence
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [logs, setLogs] = useState<AccountabilityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 2. Persona Selection States for review sandbox
  const [activeRole, setActiveRole] = useState<Role>('Student');
  const [currentStudent, setCurrentStudent] = useState<User | null>(null);
  const [currentStaff, setCurrentStaff] = useState<User | null>(null);

  // 3. Modal parameters
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditSelectedDoc, setAuditSelectedDoc] = useState<Document | null>(null);

  // Load state on mount
  useEffect(() => {
    const data = getStoredData();
    setOffices(data.offices);
    
    // Safety check: Auto-sync newly seeded users from INITIAL_USERS that are not currently in local storage
    const storedUsers = data.users || [];
    const mergedUsers = [...storedUsers];
    let usersSynced = false;
    
    INITIAL_USERS.forEach((initUser) => {
      if (!mergedUsers.some((u) => u.user_id === initUser.user_id || u.email === initUser.email)) {
        mergedUsers.push(initUser);
        usersSynced = true;
      }
    });
    
    setUsers(mergedUsers);
    setDocuments(data.documents);
    setLogs(data.logs);
    setNotifications(data.notifications || []);

    if (usersSynced) {
      saveStoredData({ 
        offices: data.offices, 
        users: mergedUsers, 
        documents: data.documents, 
        logs: data.logs,
        notifications: data.notifications || []
      });
    }

    // Set default sandbox simulated personas
    const studentsList = mergedUsers.filter((u: User) => u.role === 'Student');
    if (studentsList.length > 0) {
      setCurrentStudent(studentsList[0]);
    }

    const staffList = mergedUsers.filter((u: User) => u.role === 'Administrative Staff');
    if (staffList.length > 0) {
      setCurrentStaff(staffList[0]);
    }
  }, []);

  // Sync back to local storage whenever states mutate
  const updateDatabase = (
    nextOffices: Office[],
    nextUsers: User[],
    nextDocs: Document[],
    nextLogs: AccountabilityLog[],
    nextNotifications: Notification[]
  ) => {
    setOffices(nextOffices);
    setUsers(nextUsers);
    setDocuments(nextDocs);
    setLogs(nextLogs);
    setNotifications(nextNotifications);
    saveStoredData({ 
      offices: nextOffices, 
      users: nextUsers, 
      documents: nextDocs, 
      logs: nextLogs, 
      notifications: nextNotifications 
    });
  };

  // 4. API Operations bound down to components

  // Registering new asset (document)
  const handleAddDocument = (newDoc: Document, initialLog: AccountabilityLog) => {
    const nextDocs = [newDoc, ...documents];
    const nextLogs = [initialLog, ...logs];
    
    // Trigger notification for destination staff desk
    const newNtf: Notification = {
      notification_id: `NTF-${Date.now()}`,
      recipient_id: newDoc.office_id,
      title: 'New Document Routed',
      message: `${initialLog.user_name || 'A User'} submitted "${newDoc.title}" to your division for clearance action.`,
      doc_id: newDoc.doc_id,
      is_read: false,
      timestamp: new Date().toISOString()
    };
    
    const nextNtfs = [newNtf, ...notifications];
    updateDatabase(offices, users, nextDocs, nextLogs, nextNtfs);
  };

  // Staff processing / routing document status update
  const handleUpdateDocument = (updatedDoc: Document, newLog: AccountabilityLog) => {
    const nextDocs = documents.map((doc) => (doc.doc_id === updatedDoc.doc_id ? updatedDoc : doc));
    const nextLogs = [newLog, ...logs];
    const nextNtfs = [...notifications];

    const originalDoc = documents.find(d => d.doc_id === updatedDoc.doc_id);

    // If forwarded to a new division:
    if (originalDoc && originalDoc.office_id !== updatedDoc.office_id) {
      const originOffice = offices.find(o => o.office_id === originalDoc.office_id);
      const originOfficeName = originOffice ? originOffice.office_name : originalDoc.office_id;
      const targetOffice = offices.find(o => o.office_id === updatedDoc.office_id);
      const targetOfficeName = targetOffice ? targetOffice.office_name : updatedDoc.office_id;

      const forwardNtf: Notification = {
        notification_id: `NTY-${Date.now()}-fwd`,
        recipient_id: updatedDoc.office_id,
        title: 'Forwarded Document Arrived',
        message: `File "${updatedDoc.title}" has been forwarded to your desk station by ${newLog.user_name || 'Staff'} from the ${originOfficeName} department.`,
        doc_id: updatedDoc.doc_id,
        is_read: false,
        timestamp: new Date().toISOString()
      };
      nextNtfs.unshift(forwardNtf);
    }

    // Trigger notification for the student (creator)
    const originOffice = originalDoc ? offices.find(o => o.office_id === originalDoc.office_id) : null;
    const originOfficeName = originOffice ? originOffice.office_name : (originalDoc?.office_id || '');
    const targetOffice = offices.find(o => o.office_id === updatedDoc.office_id);
    const targetOfficeName = targetOffice ? targetOffice.office_name : updatedDoc.office_id;

    const studentMessage = updatedDoc.current_status === 'Forwarded'
      ? `Your file "${updatedDoc.title}" has been forwarded from ${originOfficeName} to ${targetOfficeName} by ${newLog.user_name} (${newLog.user_role}). Remarks: ${newLog.remarks}`
      : `Your file "${updatedDoc.title}" status has been altered to "${updatedDoc.current_status}" by ${newLog.user_name} (${newLog.user_role}). Remarks: ${newLog.remarks}`;

    const studentNtf: Notification = {
      notification_id: `NTY-${Date.now()}-std`,
      recipient_id: updatedDoc.creator_id,
      title: updatedDoc.current_status === 'Forwarded' ? 'Document Forwarded' : 'Document Tracking Update',
      message: studentMessage,
      doc_id: updatedDoc.doc_id,
      is_read: false,
      timestamp: new Date().toISOString()
    };
    nextNtfs.unshift(studentNtf);

    updateDatabase(offices, users, nextDocs, nextLogs, nextNtfs);
  };

  // Admin adding a user
  const handleAddUser = (newUser: User) => {
    const nextUsers = [...users, newUser];
    updateDatabase(offices, nextUsers, documents, logs, notifications);

    // Update simulation selectors if needed
    if (newUser.role === 'Student' && !currentStudent) {
      setCurrentStudent(newUser);
    }
    if (newUser.role === 'Administrative Staff' && !currentStaff) {
      setCurrentStaff(newUser);
    }
  };

  // Admin deleting user
  const handleDeleteUser = (userId: string) => {
    const nextUsers = users.filter((u) => u.user_id !== userId);
    updateDatabase(offices, nextUsers, documents, logs, notifications);

    // Reset simulator defaults if we deleted active ones
    if (currentStudent?.user_id === userId) {
      const remainingStudents = nextUsers.filter((u) => u.role === 'Student');
      setCurrentStudent(remainingStudents[0] || null);
    }
    if (currentStaff?.user_id === userId) {
      const remainingStaff = nextUsers.filter((u) => u.role === 'Administrative Staff');
      setCurrentStaff(remainingStaff[0] || null);
    }
  };

  // Admin adding office code
  const handleAddOffice = (newOffice: Office) => {
    const nextOffices = [...offices, newOffice];
    updateDatabase(nextOffices, users, documents, logs, notifications);
  };

  // Open audit dialog window
  const handleOpenAuditTrail = (doc: Document) => {
    setAuditSelectedDoc(doc);
    setIsAuditModalOpen(true);
  };

  // Sandbox resetting tool: flushes custom storage back to baseline preloads
  const handleResetSandboxPrimes = () => {
    if (window.confirm('Are you sure you want to restore the DocuTrack system back to the default CKC baseline seed values? All customized document uploads, users, and audit logs created during this browser session will be reset.')) {
      localStorage.removeItem('docutrack_offices');
      localStorage.removeItem('docutrack_users');
      localStorage.removeItem('docutrack_documents');
      localStorage.removeItem('docutrack_logs');
      localStorage.removeItem('docutrack_notifications');

      setOffices(INITIAL_OFFICES);
      setUsers(INITIAL_USERS);
      setDocuments(INITIAL_DOCUMENTS);
      setLogs(INITIAL_LOGS);
      setNotifications(INITIAL_NOTIFICATIONS);

      const studentsList = INITIAL_USERS.filter((u) => u.role === 'Student');
      setCurrentStudent(studentsList[0] || null);

      const staffList = INITIAL_USERS.filter((u) => u.role === 'Administrative Staff');
      setCurrentStaff(staffList[0] || null);

      setActiveRole('Student');
      setIsAuditModalOpen(false);
      setAuditSelectedDoc(null);
    }
  };

  // Notification state and interactive handlers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getRoleFilteredNotifications = () => {
    if (activeRole === 'Student') {
      if (!currentStudent) return [];
      return notifications.filter((n) => n.recipient_id === currentStudent.user_id);
    }
    if (activeRole === 'Administrative Staff') {
      if (!currentStaff) return [];
      return notifications.filter((n) => n.recipient_id === currentStaff.office_id);
    }
    if (activeRole === 'Admin') {
      return notifications.filter((n) => n.recipient_id === 'OFF-DEAN');
    }
    if (activeRole === 'Super Admin') {
      // Super Admin sees all system notifications
      return notifications;
    }
    return [];
  };

  const filteredNtfs = getRoleFilteredNotifications();
  const unreadCount = filteredNtfs.filter(n => !n.is_read).length;

  const handleMarkAsRead = (ntfId: string) => {
    const updated = notifications.map(n => n.notification_id === ntfId ? { ...n, is_read: true } : n);
    updateDatabase(offices, users, documents, logs, updated);
  };

  const handleMarkAllAsRead = () => {
    const targetedIds = filteredNtfs.map(n => n.notification_id);
    const updated = notifications.map(n => targetedIds.includes(n.notification_id) ? { ...n, is_read: true } : n);
    updateDatabase(offices, users, documents, logs, updated);
  };

  const handleClearAllNotifications = () => {
    const targetedIds = filteredNtfs.map(n => n.notification_id);
    const updated = notifications.filter(n => !targetedIds.includes(n.notification_id));
    updateDatabase(offices, users, documents, logs, updated);
  };

  const handleNotificationClick = (ntf: Notification) => {
    handleMarkAsRead(ntf.notification_id);
    const doc = documents.find(d => d.doc_id === ntf.doc_id);
    if (doc) {
      handleOpenAuditTrail(doc);
    }
    setIsNotificationsOpen(false);
  };

  // Categorize lists for sandbox simulations
  const studentsUsers = users.filter((u) => u.role === 'Student');
  const staffUsers = users.filter((u) => u.role === 'Administrative Staff');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-indigo-950 flex flex-col font-sans" id="docutrack-application">
      
      {/* Sleek Minimal Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              <GraduationCap className="h-5 w-5 text-white" id="header-ckc-emblem" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-sans font-extrabold text-[9px] tracking-wide text-indigo-650 uppercase">
                  Christ the King College
                </span>
                <span className="text-[10px] text-slate-400">| Gingoog City</span>
              </div>
              <h1 className="font-sans font-bold tracking-tight text-slate-950 text-sm sm:text-base mt-0.5" id="app-title-literal">
                DocuTrack Portal
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Elegant Segmented Role Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1" id="role-switcher">
              <button
                onClick={() => setActiveRole('Student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRole === 'Student'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                id="switch-to-student-btn"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Student</span>
              </button>

              <button
                onClick={() => setActiveRole('Administrative Staff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRole === 'Administrative Staff'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                id="switch-to-staff-btn"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Staff</span>
              </button>

              <button
                onClick={() => setActiveRole('Admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRole === 'Admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                id="switch-to-admin-btn"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin</span>
              </button>

              <button
                onClick={() => setActiveRole('Super Admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRole === 'Super Admin'
                    ? 'bg-red-650 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                id="switch-to-super-admin-btn"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                <span>Super Admin</span>
              </button>
            </div>

            {/* Real-time Role Notifications Popover */}
            <div className="relative" id="notifications-trigger-container">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isNotificationsOpen || unreadCount > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                id="header-bell-button"
                title={`${activeRole} Notifications`}
              >
                <Bell className={`h-4.5 w-4.5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center border-2 border-white animate-pulse" id="unread-count-badge">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div 
                  className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                  id="notifications-dropdown-menu"
                >
                  {/* Dropdown Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                      <h4 className="font-sans font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-indigo-600" />
                        <span>{activeRole} Notifications</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                        {activeRole === 'Student' && currentStudent 
                          ? `Logged as Student: ${currentStudent.full_name}` 
                          : activeRole === 'Administrative Staff' && currentStaff 
                          ? `Office Desk Tracker (${currentStaff.office_id})` 
                          : activeRole === 'Super Admin' 
                          ? 'Global Registry Logs Master Monitor' 
                          : 'Dean Console Alerts'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-850 flex items-center gap-0.5 cursor-pointer bg-transparent border-0 py-1 px-2 hover:bg-indigo-50/50 rounded-md"
                        id="btn-mark-all-read"
                      >
                        <Check className="h-3 w-3" />
                        Mark Read
                      </button>
                    )}
                  </div>

                  {/* Dropdown List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100" id="notifications-list-container">
                    {filteredNtfs.length === 0 ? (
                      <div className="py-8 px-4 text-center shrink-0 flex flex-col items-center justify-center text-slate-400" id="empty-ntf-state">
                        <BellOff className="h-8 w-8 text-slate-300 mb-2" />
                        <span className="text-xs font-semibold text-slate-700">All caught up!</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] text-center leading-relaxed">
                          Clearances, forwarding, and stamp evaluations will notify you dynamically.
                        </p>
                      </div>
                    ) : (
                      filteredNtfs.map((ntf) => (
                        <div 
                          key={ntf.notification_id}
                          onClick={() => handleNotificationClick(ntf)}
                          className={`p-3.5 transition-all cursor-pointer hover:bg-slate-50/80 flex gap-2.5 relative border-l-3 ${
                            !ntf.is_read ? 'bg-indigo-50/20 border-l-indigo-600' : 'border-l-transparent'
                          }`}
                          id={`ntf-${ntf.notification_id}`}
                          title="Click to view file audit clearance log"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1.5">
                              <span className={`font-sans text-xs leading-tight block truncate ${!ntf.is_read ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                                {ntf.title}
                              </span>
                              <span className="font-mono text-[9px] text-slate-400 shrink-0 bg-slate-100 rounded px-1">
                                {new Date(ntf.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-normal">
                              {ntf.message}
                            </p>
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-slate-500 bg-slate-50 group-hover:bg-white border border-slate-200/60 rounded px-1.5 py-0.5">
                              <span>📄 Clearance Ref:</span>
                              <span className="text-indigo-600">{ntf.doc_id}</span>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  {filteredNtfs.length > 0 && (
                    <div className="p-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
                      <button
                        onClick={handleClearAllNotifications}
                        className="w-full text-center py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 flex items-center justify-center gap-1 cursor-pointer transition-colors border-0"
                        id="btn-clear-all-ntf"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear All Notifications
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>

            <button
              onClick={handleResetSandboxPrimes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
              id="btn-sandbox-system-reset"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              Reset Demo
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area with Elegant Background and Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Render Student Workspace */}
        {activeRole === 'Student' && currentStudent && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded uppercase">
                  Student Panel
                </span>
                <h3 className="font-sans font-bold text-slate-900 text-[15px] leading-snug">
                  Welcome back, {currentStudent.full_name}
                </h3>
                <p className="text-xs text-slate-550 leading-relaxed max-w-xl">
                  Initiate scholastic requests and track real-time processing across departments.
                </p>
              </div>

              <div className="bg-slate-50/80 px-3.5 py-2 border border-slate-200/50 rounded-lg font-mono text-[11px] text-slate-600 min-w-[200px] text-left md:text-right">
                <div>Institutional ID: <span className="font-bold text-slate-800">{currentStudent.user_id}</span></div>
                <div className="text-slate-400 mt-0.5">{currentStudent.email}</div>
              </div>
            </div>

            <StudentWorkspace
              students={studentsUsers}
              currentStudent={currentStudent}
              onStudentChange={setCurrentStudent}
              documents={documents}
              offices={offices}
              logs={logs}
              onAddDocument={handleAddDocument}
              onOpenAuditTrail={handleOpenAuditTrail}
            />
          </div>
        )}

        {/* Render Staff Workspace */}
        {activeRole === 'Administrative Staff' && currentStaff && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider font-bold bg-indigo-55 bg-indigo-55 border border-indigo-100/60 text-indigo-700 px-2.5 py-0.5 rounded uppercase">
                  Staff Desk
                </span>
                <h3 className="font-sans font-bold text-slate-900 text-[15px] leading-snug">
                  Department Work Desk & Encoders
                </h3>
                <p className="text-xs text-slate-550 leading-relaxed max-w-xl">
                  Process incoming requests, apply quick stamp evaluations, and dispatch to appropriate divisions.
                </p>
              </div>

              <div className="bg-slate-50/80 px-3.5 py-2 border border-slate-200/50 rounded-lg font-mono text-[11px] text-slate-600 min-w-[205px] text-left md:text-right">
                <div className="text-slate-400">Desk Staff</div>
                <div className="font-bold text-indigo-950 truncate max-w-[240px]">{currentStaff.full_name} ({currentStaff.office_id})</div>
              </div>
            </div>

            <StaffWorkspace
              staffMembers={staffUsers}
              currentStaff={currentStaff}
              onStaffChange={setCurrentStaff}
              documents={documents}
              offices={offices}
              logs={logs}
              onUpdateDocument={handleUpdateDocument}
              onOpenAuditTrail={handleOpenAuditTrail}
              onAddDocument={handleAddDocument}
              users={users}
            />
          </div>
        )}

        {/* Render Admin Workspace */}
        {activeRole === 'Admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider font-bold bg-amber-50 text-amber-800 border border-amber-250 px-2.5 py-0.5 rounded uppercase">
                  Administrator Console
                </span>
                <h3 className="font-sans font-bold text-slate-900 text-[15px] leading-snug">
                  Superuser Management Platform
                </h3>
                <p className="text-xs text-slate-550 leading-relaxed max-w-xl">
                  Configure academic stations, adjust access controls, examine global trails, and resolve registry overrides.
                </p>
              </div>

              <div className="bg-slate-50/80 px-3.5 py-2 border border-slate-200/50 rounded-lg font-mono text-[11px] text-slate-600 min-w-[200px] text-left md:text-right">
                <div className="text-slate-400">Governance ID</div>
                <div className="font-bold text-slate-800">USR-ADMIN1</div>
              </div>
            </div>

            <AdminWorkspace
              offices={offices}
              users={users}
              documents={documents}
              logs={logs}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onAddOffice={handleAddOffice}
              onUpdateDocument={handleUpdateDocument}
              onAddDocument={handleAddDocument}
            />
          </div>
        )}

        {/* Render Super Admin Workspace */}
        {activeRole === 'Super Admin' && (
          <div className="space-y-6">
            <SuperAdminWorkspace
              documents={documents}
              logs={logs}
              offices={offices}
              users={users}
            />
          </div>
        )}

      </main>

      {/* Contemporary Footer */}
      <footer className="bg-white border-t border-slate-250/60 py-6 shrink-0 text-[11px] text-slate-400 mt-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; 2026 Christ the King College. DocuTrack Clearance & Document Tracking Portal.
          </div>
          <div className="flex gap-4 font-mono text-[10px] text-slate-400">
            <span>DocuTrack v1.1.0</span>
          </div>
        </div>
      </footer>

      {/* Centralized Modal Rendering */}
      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setAuditSelectedDoc(null);
        }}
        document={auditSelectedDoc}
        logs={logs}
        offices={offices}
      />

    </div>
  );
}
