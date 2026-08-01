const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.ts');
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:3000')) {
    // Replace hardcoded URL with env variable, defaulting to 3010
    content = content.replace(/http:\/\/localhost:3000/g, "${process.env.FRONTEND_URL || 'http://localhost:3010'}");
    
    // Fix string interpolations that were inside single quotes
    content = content.replace(/'\$\{process\.env\.FRONTEND_URL \|\| 'http:\/\/localhost:3010'\}([^']*)'/g, '`${process.env.FRONTEND_URL || \\'http://localhost:3010\\'}$1`');
    
    // Fix string interpolations that were inside double quotes
    content = content.replace(/\"\$\{process\.env\.FRONTEND_URL \|\| 'http:\/\/localhost:3010'\}([^"]*)\"/g, '`${process.env.FRONTEND_URL || \\'http://localhost:3010\\'}$1`');
    
    fs.writeFileSync(file, content);
    changedCount++;
    console.log('Modified', file);
  }
}
console.log('Total files modified:', changedCount);
