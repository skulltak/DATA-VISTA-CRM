const fs = require('fs');
const p = 'c:/Users/Kunal/OneDrive/Desktop/DATA-VISTA-CRM-main/NexCrm-Ui/src/app/services/html-export.service.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/\\\$/g, '$');
c = c.replace(/\\`/g, '`');
fs.writeFileSync(p, c);
console.log('Fixed file escape characters');
