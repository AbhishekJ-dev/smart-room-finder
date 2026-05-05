const fs = require('fs');
const path = require('path');

const directoriesToProcess = [
    path.join(__dirname, '../routes'),
    path.join(__dirname, '../controllers')
];

function convertQueriesInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Replace db.execute -> pool.query
    content = content.replace(/\bdb\.execute\b/g, 'pool.query');
    content = content.replace(/\bdb\.query\b/g, 'pool.query');

    // 2. Replace db import -> pool import
    content = content.replace(/const db = require\('\.\.\/config\/db'\);/g, "const pool = require('../config/db');");

    // 3. Destructuring results: `const [rows] = await pool.query(...)` -> `const { rows } = await pool.query(...)`
    // Regex matches `const [varName] = await pool.query` or `let [varName] = await pool.query`
    // This is tricky if it's `const [rows, fields]` so we just do a generic replacement
    content = content.replace(/(const|let)\s+\[\s*([a-zA-Z0-9_]+)\s*\]\s*=\s*await pool\.query/g, "$1 { rows: $2 } = await pool.query");
    
    // Replace `const [varName, fields] = await pool.query` -> `const { rows: varName } = await pool.query`
    content = content.replace(/(const|let)\s+\[\s*([a-zA-Z0-9_]+)\s*,\s*[a-zA-Z0-9_]+\s*\]\s*=\s*await pool\.query/g, "$1 { rows: $2 } = await pool.query");

    // 4. Update the queries themselves to use $1, $2 instead of ?
    // We'll find all `pool.query(...)` calls and replace `?` inside them.
    // Since SQL queries are strings, we can search for `pool.query(`...` ` or `pool.query('...' `
    let queryRegex = /pool\.query\(([`'"])([\s\S]*?)\1\s*(,\s*\[[\s\S]*?\])?\)/g;
    content = content.replace(queryRegex, (match, quote, sqlString, paramsPart) => {
        let newSqlString = sqlString;
        let counter = 1;
        while (newSqlString.includes('?')) {
            newSqlString = newSqlString.replace('?', `$${counter}`);
            counter++;
        }

        // Add RETURNING * to INSERT if missing
        if (newSqlString.trim().toUpperCase().startsWith('INSERT INTO') && !newSqlString.toUpperCase().includes('RETURNING')) {
            newSqlString += ' RETURNING *';
        }

        if (paramsPart) {
            return `pool.query(${quote}${newSqlString}${quote}${paramsPart})`;
        } else {
            return `pool.query(${quote}${newSqlString}${quote})`;
        }
    });

    // 5. Replace insertId
    // In MySQL: result.insertId
    // In PG (with RETURNING *): result.rows[0].id
    content = content.replace(/\b([a-zA-Z0-9_]+)\.insertId\b/g, "$1.rows[0].id");

    // 6. Fix `db.getConnection()` for transactions
    content = content.replace(/db\.getConnection\(\)/g, "pool.connect()");
    content = content.replace(/connection\.execute/g, "client.query");
    content = content.replace(/connection\.release/g, "client.release");
    content = content.replace(/connection\.commit/g, "client.query('COMMIT')");
    content = content.replace(/connection\.rollback/g, "client.query('ROLLBACK')");
    content = content.replace(/connection\.beginTransaction\(\)/g, "client.query('BEGIN')");
    content = content.replace(/const connection = await pool\.connect\(\);/g, "const client = await pool.connect();");

    // Fix destructuring for client.query
    content = content.replace(/(const|let)\s+\[\s*([a-zA-Z0-9_]+)\s*\]\s*=\s*await client\.query/g, "$1 { rows: $2 } = await client.query");

    // 7. Fix existing `result.affectedRows` -> `result.rowCount`
    content = content.replace(/\.affectedRows\b/g, ".rowCount");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.js')) {
            convertQueriesInFile(fullPath);
        }
    }
}

directoriesToProcess.forEach(processDirectory);
console.log('Migration refactor complete.');
