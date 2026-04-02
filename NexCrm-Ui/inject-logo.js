const fs = require('fs');
const logoPath = 'C:\\Users\\Kunal\\.gemini\\antigravity\\brain\\458f4de6-9b2b-4aef-b97e-d2f21f2428af\\media__1775118991172.jpg';
const servicePath = 'c:\\Users\\Kunal\\OneDrive\\Desktop\\DATA-VISTA-CRM-main\\NexCrm-Ui\\src\\app\\services\\pdf-export.service.ts';

if (!fs.existsSync(logoPath)) {
  console.error('Logo not found at:', logoPath);
  process.exit(1);
}

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
let content = fs.readFileSync(servicePath, 'utf8');

const logoProperty = `  private readonly VECARE_LOGO = 'data:image/jpeg;base64,${logoBase64}';\n\n`;
if (!content.includes('VECARE_LOGO')) {
  content = content.replace('constructor(', logoProperty + '  constructor(');
}

fs.writeFileSync(servicePath, content, 'utf8');
console.log('Successfully injected VECARE logo into PdfExportService');
