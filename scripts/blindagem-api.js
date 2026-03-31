
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('route.ts') || file.endsWith('route.js')) {
            results.push(file);
        }
    });
    return results;
}

const apiDir = path.join(process.cwd(), 'app', 'api');
const routes = walk(apiDir);

routes.forEach(route => {
    let content = fs.readFileSync(route, 'utf8');
    if (!content.includes('force-dynamic')) {
        console.log(`Aplicando blindagem em: ${route}`);
        const newContent = `export const dynamic = "force-dynamic";\n${content}`;
        fs.writeFileSync(route, newContent);
    }
});

console.log("Blindagem completa em todas as rotas da API! 🚀");
