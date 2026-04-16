const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

// Regex to find "http://localhost:5000" or 'http://localhost:5000' or `http://localhost:5000`
// and safely replace it with a template literal.
// E.g., 'http://localhost:5000/api/users' -> `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`
const regex = /['"`]http:\/\/localhost:5000([^'"`]*)['"`]/g;

// Also look for standalone string variables if any, but the above covers 99% of inline usages.

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFilesCount = 0;

walkDir(directoryPath, function(filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (regex.test(content)) {
            let newContent = content.replace(regex, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('✅ Updated:', filePath);
            modifiedFilesCount++;
        }
    }
});

console.log(`\n🎉 Successfully updated ${modifiedFilesCount} files!`);
console.log('You can now use the VITE_API_URL environment variable in production.');
