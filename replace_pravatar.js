const fs = require('fs');
const path = require('path');

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkSync(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

walkSync('src', (filepath) => {
  if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.includes('pravatar.cc')) {
      content = content.replace(/`https:\/\/i\.pravatar\.cc\/[^`]+`/g, '"/default-avatar.svg"');
      fs.writeFileSync(filepath, content);
      console.log('Updated ' + filepath);
    }
  }
});
