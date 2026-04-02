const fs = require('fs');
const path = require('path');

const targetUrl = 'https://data-vista-crm.onrender.com';
const filesToUpdate = [
  'src/app/services/pivot.ts',
  'src/app/components/sidebar/sidebar.ts',
  'src/app/services/notification.service.ts',
  'src/app/services/import.ts',
  'src/app/services/file-viewer.ts',
  'src/app/services/deal.ts',
  'src/app/services/contact.ts',
  'src/app/services/chat.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', file);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(targetUrl)) {
    const parts = file.split('/');
    const depth = parts.length - 2; 
    let envImportPath = '../'.repeat(depth) + 'environments/environment';

    if (!content.includes('environment')) {
      content = `import { environment } from '${envImportPath}';\n` + content;
    }

    content = content.replace(/'https:\/\/data-vista-crm\.onrender\.com/g, "environment.apiUrl + '");
    content = content.replace(/"https:\/\/data-vista-crm\.onrender\.com/g, "environment.apiUrl + '");
    // Some lines might not have trailing quote, handle plain
    content = content.replace(/https:\/\/data-vista-crm\.onrender\.com/g, " + environment.apiUrl + ");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
