/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Student' | 'Administrative Staff' | 'Admin' | 'Super Admin';

export interface Office {
  office_id: string;
  office_name: string;
  department: string;
}

export interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: Role;
  office_id?: string; // Optional (e.g. for students, or global admins)
}

export interface Document {
  doc_id: string;
  title: string;
  type: string;
  description?: string; // Add description field!
  current_status: 'Pending' | 'Processing' | 'Forwarded' | 'Completed' | 'Rejected';
  date_received: string; // ISO date string
  office_id: string;    // Links to where the document currently sits
  creator_id: string;   // The author/initiator (Student or Administrative Staff)
  file_name: string;
  file_size: string;
  file_format: string; // doc, docx, txt, wps, wpd
  is_archived?: boolean;       // Support for Admin resolved-file archiving
  viewed_by_staff?: boolean;   // Tracking seen-locks for Staff verification
}

export interface AccountabilityLog {
  log_id: string;
  doc_id: string;
  user_id: string;
  user_name: string;
  user_role: Role;
  action_taken: string;
  remarks: string;
  timestamp: string; // ISO timestamp
}

export interface Notification {
  notification_id: string;
  recipient_id: string; // user_id for students, or office_id for staff/dean, or "OFF-DEAN" / "ALL"
  title: string;
  message: string;
  doc_id: string;
  is_read: boolean;
  timestamp: string; // ISO timestamp
}

// Strictly allowed formats according to "Format Limitations" in Page 13 of the study
export const ALLOWED_DOCUMENT_EXTENSIONS = ['doc', 'docx', 'pdf', 'txt', 'wps', 'wpd'];

export const GET_CANNED_REMARKS_BY_TYPE = (docType: string, role: 'Staff' | 'Dean') => {
  const common = [
    { label: role === 'Dean' ? "-- Select Dean Resolution Template --" : "-- Quick Canned Comments Selector --", value: "" },
  ];

  if (docType === 'Transcript of Records (TOR)') {
    return [
      ...common,
      {
        label: role === 'Dean' ? "✅ TOR graduation audit approved" : "✅ TOR verified: Credit checks complete",
        value: role === 'Dean'
          ? "Academic Dean Clearance Approved: Reviewed Transcript of Records (TOR) graduation audit thoroughly. Student satisfies all credit distributions and academic benchmarks."
          : "TOR Verification Checked: Verified comprehensive Transcript of Records (TOR) course credits and GPA calculations correctly. Fully compliant."
      },
      {
        label: role === 'Dean' ? "⚠️ Dean TOR Hold: Major course credit deficit" : "⚠️ TOR Deficiency: Missing prerequisite subject credit",
        value: role === 'Dean'
          ? "Academic Dean Hold: TOR graduation checklist flagged outstanding major subject corequisite deficiencies. Processing suspended."
          : "TOR Audit Warning: Student's Transcript of Records (TOR) exhibits a core prerequisite subject credit deficiency. Under research."
      },
      {
        label: "🔍 Transcript verification process active",
        value: "Graduation Transcript Audit: Active manual review of candidate's individual transcript modules and transfer credits is currently in progress."
      }
    ];
  }

  if (docType === 'Grade Slips') {
    return [
      ...common,
      {
        label: role === 'Dean' ? "✅ Dean Approval: Verified registry grade registers" : "✅ Grade Slips approved: Faculty signatures matches physical logs",
        value: role === 'Dean'
          ? "Academic Dean Approval: Checked Grade Slips against registry server ledger sheets. Grade distribution satisfies graduation protocols."
          : "Grade Slips Evaluation: All instructor signatures and credit values matched physical ledger books correctly. Ready for enrollment validation."
      },
      {
        label: "⚠️ Grade Slips Deficiency: Missing signature verification",
        value: "Grade Slips Recalibration: System flagged a blank entry block or missing Department Chairperson validation signature. Placed on hold."
      }
    ];
  }

  if (docType === 'Enrollment Forms') {
    return [
      ...common,
      {
        label: role === 'Dean' ? "✅ Dean Approval: Enrollment card cleared" : "✅ Enrollment checked: Load and schedule validated",
        value: role === 'Dean'
          ? "Academic Dean Approval: Enrollment specifications cleared. The requested program load and semester track are signed off for execution."
          : "Enrollment Forms Verification: Checked student loads and schedule conflicts. All course prerequisites certified under standard guidelines."
      },
      {
        label: "⚠️ Enrollment hold: Finance backlog detected",
        value: "Enrollment Processing Hold: Outstanding financial accountabilities flagged from the prior school term. Registrations on temporary hold."
      }
    ];
  }

  if (docType === 'Clearance Forms') {
    return [
      ...common,
      {
        label: role === 'Dean' ? "✅ Academic Clearance fully verified" : "✅ Department clearance confirmed: Complete signatures",
        value: role === 'Dean'
          ? "Academic Dean Clearance Approved: Checked student's comprehensive clearing forms. Signatures from all university stations verified."
          : "Clearance Verification: Physical libraries, laboratory storage, and campus desk audits cleared. Student holds no pending school properties."
      },
      {
        label: "⚠️ Clearance hold: Outstanding student ledger books",
        value: "Clearance Hold: Unreturned laboratory equipment or unpaid library fees flagged on the student database ledger. Please settle immediately."
      }
    ];
  }

  if (docType === 'Certifications') {
    return [
      ...common,
      {
        label: role === 'Dean' ? "✅ Dean Seal: Authorized for honorable discharge certification" : "✅ Certification verified: Official dry-seal issued",
        value: role === 'Dean'
          ? "Academic Dean Seal: This honorable discharge/graduation certification is authorized for official CKC Dean dry-seal stamping and release."
          : "Certification Verification: Eligibility credentials checked. Document processed and authorized for official dry-seal stamping."
      },
      {
        label: "⚠️ Certification on hold: Incomplete credential folder",
        value: "Certification Hold: High school academic records or primary transfer papers are missing. Primary registration folder on check."
      }
    ];
  }

  if (docType === 'Project Proposals') {
    return [
      ...common,
      {
        label: role === 'Dean' ? "✅ Dean Approval: Academic research funds cleared" : "✅ Proposal reviewed: Budget & specifications aligned",
        value: role === 'Dean'
          ? "Academic Dean Proposal Approval: Reviewed research budget and experimental limits. Fully certified for department research allocation."
          : "Project Proposal Review: Scope statement, itemized budget margins, and academic timeline validated under thesis/research board conditions."
      },
      {
        label: "⚠️ Proposal returned: Missing chairperson directive",
        value: "Project Proposal Return: The research brief requires a certified endorsement signature from the faculty advisor prior to clearance approval."
      }
    ];
  }

  if (docType === 'Internal Reports') {
    return [
      ...common,
      {
        label: role === 'Dean' ? "✅ Dean Audit: Report published into college record" : "✅ Internal report audited: Technical guidelines met",
        value: role === 'Dean'
          ? "Academic Dean Audit: Quarterly report has been evaluated and archived in high compliance with overall Christ the King College standards."
          : "Internal Reports Review: Quarterly data graphs, student statistics, and progress indexes align with standard college tracking regulations."
      },
      {
        label: "⚠️ Internal report on hold: Missing chairperson validation",
        value: "Internal Reports Deficiency: This quarterly division report is on hold pending the required head-of-department validation."
      }
    ];
  }

  // Fallback default templates
  return [
    ...common,
    { label: "✅ Clearance Approved (Complete Specs Checked)", value: "Clearance Check Passed: Verified all requirements, documents are complete and authentic. Ready for next academic stage." },
    { label: "⚠️ Missing Attachments Notice (Hold State)", value: "Notice of Deficiency: Document is missing mandatory certified copy signatures or school certificates. Processing on hold." },
    { label: "🔍 Evaluation Review in progress", value: "Broad Evaluation: Document units are currently being cross-referenced with catalog criteria. Review in progress." },
    { label: "❌ Submissions Rejected (Format Error)", value: "Submission Rejected: The file structure contains unidentifiable formatting margins or non-document attachments. Student must re-submit." }
  ];
};
