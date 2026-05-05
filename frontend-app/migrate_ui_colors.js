const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = {
  // Primary (Blue -> Indigo)
  '#2563EB': '#4F46E5',
  '#1D4ED8': '#4338CA',
  '#BFDBFE': '#C7D2FE',
  '#EFF6FF': '#EEF2FF',
  // Backgrounds / text (Slate -> Gray)
  '#1E293B': '#111827',
  '#64748B': '#6B7280',
  '#94A3B8': '#9CA3AF',
  '#E2E8F0': '#E5E7EB',
  '#F1F5F9': '#F3F4F6',
  '#F8FAFC': '#F9FAFB',
  // Keep #22C55E (Success Green) as is, or explicitly ensure it
};

let filesChanged = 0;

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      for (const [oldColor, newColor] of Object.entries(replacements)) {
        // Case insensitive global replacement
        const regex = new RegExp(oldColor, 'gi');
        content = content.replace(regex, newColor);
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesChanged++;
        console.log(`Updated: ${filePath}`);
      }
    }
  });
}

console.log('Starting color migration...');
walk(srcDir);
console.log(`Migration complete. Files updated: ${filesChanged}`);
