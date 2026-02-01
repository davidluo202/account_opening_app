import PDFDocument from 'pdfkit';
import * as fs from 'fs';

const fontPath = './server/fonts/NotoSansCJKtc-Regular.otf';
console.log('[Test] Font exists:', fs.existsSync(fontPath));

try {
  const doc = new PDFDocument();
  const chunks = [];
  
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    fs.writeFileSync('/tmp/font-test.pdf', pdfBuffer);
    console.log('[Test] PDF created, size:', pdfBuffer.length);
  });
  doc.on('error', (err) => console.error('[Test] PDF error:', err));
  
  console.log('[Test] Registering font...');
  doc.registerFont('TestFont', fontPath);
  console.log('[Test] Font registered');
  
  doc.font('TestFont').fontSize(20).text('測試中文 Test', 100, 100);
  doc.end();
} catch (err) {
  console.error('[Test] Error:', err.message);
}
