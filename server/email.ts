// Simplified email module for testing
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  console.log(`[Email Mock] Sending email to ${to}`);
  console.log(`[Email Mock] Subject: ${subject}`);
  return true;
}
