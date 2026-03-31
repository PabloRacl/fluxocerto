
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const dirs = [
    path.join(process.cwd(), 'servicos'),
    path.join(process.cwd(), 'app', 'api'),
];

let totalFixed = 0;

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = walk(dir);
    
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        
        // Only fix files that use prisma.account for banking operations
        // Skip files that legitimately use Account (NextAuth auth)
        const basename = path.basename(file);
        const dirName = path.dirname(file);
        
        // Skip the NextAuth route itself
        if (dirName.includes('[...nextauth]')) return;
        
        // Check if this file uses prisma.account with banking fields
        if (content.includes('prisma.account') && 
            (content.includes('balance') || 
             content.includes('isActive') || 
             content.includes('isDeleted') || 
             content.includes('isArchived') ||
             content.includes('diaFechamento') ||
             content.includes('limiteCredito') ||
             content.includes('AccountType'))) {
            
            const count = (content.match(/prisma\.account/g) || []).length;
            const newContent = content.replace(/prisma\.account/g, 'prisma.conta');
            fs.writeFileSync(file, newContent);
            console.log(`✅ Corrigido: ${path.relative(process.cwd(), file)} (${count} referências)`);
            totalFixed += count;
        }
    });
});

console.log(`\n🛡️ Total de referências corrigidas: ${totalFixed}`);
