const fs = require('fs');
const path = require('path');

['routes', 'controllers'].forEach(d => {
    const dir = path.join(__dirname, '..', d);
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        let c = fs.readFileSync(p, 'utf8');
        const orig = c;
        c = c.replace(/client\.query\('COMMIT'\)\(\)/g, "client.query('COMMIT')");
        c = c.replace(/client\.query\('ROLLBACK'\)\(\)/g, "client.query('ROLLBACK')");
        c = c.replace(/client\.query\('BEGIN'\)\(\)/g, "client.query('BEGIN')");
        if (c !== orig) {
            fs.writeFileSync(p, c);
            console.log('Fixed: ' + f);
        }
    });
});
console.log('Done');
