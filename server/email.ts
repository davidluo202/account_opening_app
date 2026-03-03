// Simplified email module for testing without SendGrid dependencies

export async function sendVerificationCode(to: string, code: string): Promise<boolean> {
  console.log(`[Email Mock] Sending verification code ${code} to ${to}`);
  return true;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendCustomerConfirmationEmail(
  to: string,
  applicationNumber: string,
  customerName: string,
  customerGender?: string | null,
  pdfUrl?: string
): Promise<boolean> {
  console.log(`[Email Mock] Customer confirmation email sent to ${to}`);
  return true;
}

export async function sendInternalNotificationEmail(
  applicationNumber: string,
  customerName: string,
  customerEmail: string,
  pdfUrl?: string
): Promise<boolean> {
  console.log(`[Email Mock] Internal notification email sent`);
  return true;
}

export async function sendApprovalNotificationEmail(
  applicationNumber: string,
  customerName: string,
  approverName: string,
  isProfessionalInvestor: boolean,
  approvedRiskProfile: string
): Promise<boolean> {
  console.log(`[Email Mock] Approval notification sent for application ${applicationNumber}`);
  return true;
}

export async function sendRejectionNotificationEmail(
  applicationNumber: string,
  customerName: string,
  customerEmail: string,
  approverName: string,
  rejectReason: string
): Promise<boolean> {
  console.log(`[Email Mock] Rejection notification sent for application ${applicationNumber}`);
  return true;
}

export async function sendReturnNotificationEmail(
  applicationNumber: string,
  customerName: string,
  customerEmail: string,
  approverName: string,
  returnReason: string
): Promise<boolean> {
  console.log(`[Email Mock] Return notification sent for application ${applicationNumber}`);
  return true;
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
  console.log(`[Email Mock] Password reset email sent to ${to}`);
  return true;
}

export async function sendFirstApprovalNotificationEmail(
  applicationNumber: string,
  customerName: string,
  firstApproverName: string,
  firstApproverCeNo: string,
  isProfessionalInvestor: boolean,
  approvedRiskProfile: string
): Promise<boolean> {
  console.log(`[Email Mock] First approval notification sent`);
  return true;
}

export async function sendFinalApprovalNotificationEmail(
  applicationNumber: string,
  customerName: string,
  firstApproverName: string,
  firstApproverCeNo: string,
  secondApproverName: string,
  secondApproverCeNo: string,
  isProfessionalInvestor: boolean,
  approvedRiskProfile: string,
  finalPdfUrl?: string
): Promise<boolean> {
  console.log(`[Email Mock] Final approval notification sent`);
  return true;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  console.log(`[Email Mock] Generic email sent to ${to} with subject: ${subject}`);
  return true;
}
