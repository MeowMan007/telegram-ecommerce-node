const fs = require('fs');

const files = [
  'src/app/announcements/page.js',
  'src/app/categories/page.js',
  'src/app/clients/page.js',
  'src/app/orders/page.js',
  'src/app/payments/page.js',
  'src/app/products/page.js',
  'src/app/settings/page.js',
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.split('../../../../lib/auth.js').join('../../lib/auth.js');
    c = c.split('../../admin-layout').join('../admin-layout');
    fs.writeFileSync(f, c);
    console.log('Fixed', f);
  }
});

let rootPage = 'src/app/page.js';
if (fs.existsSync(rootPage)) {
  let rootC = fs.readFileSync(rootPage, 'utf8');
  rootC = rootC.split('../../../lib/auth.js').join('../lib/auth.js');
  rootC = rootC.split('../admin-layout').join('./admin-layout');
  fs.writeFileSync(rootPage, rootC);
  console.log('Fixed', rootPage);
}
