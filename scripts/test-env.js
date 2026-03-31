
require('dotenv').config();

console.log("--- TESTE DE VARIÁVEIS DO .ENV ---");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✅ OK (Começa com " + process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "...)" : "❌ NÃO ENCONTRADO");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ OK" : "❌ NÃO ENCONTRADO");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "❌ NÃO ENCONTRADO");
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "✅ OK" : "❌ NÃO ENCONTRADO");
console.log("----------------------------------");
