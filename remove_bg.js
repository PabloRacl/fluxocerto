const Jimp = require('jimp');
const path = require('path');

const targetColor = { r: 15, g: 23, b: 42, a: 255 }; // slate-900 para combinar bem com os paineis ou 2,6,23 (slate-950)
const targetColorHex = Jimp.rgbaToInt(15, 23, 42, 255); // Usando slate-900 (bg-slate-900) porque o container do InsightsPanel é bg-slate-900/60
// Na verdade, 2,6,23 é bg-slate-950 do fundo principal. 

// A imagem 2 do usuario tem um tom bem dark, provavelmente slate-950.
const targetColorHexDark = Jimp.rgbaToInt(2, 6, 23, 255); // slate-950 (RGB: 2, 6, 23)

async function processImage(filename) {
    const fullPath = path.join(__dirname, 'public', 'mascote', filename);
    const image = await Jimp.read(fullPath);
    
    // Iterating over all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const red   = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue  = this.bitmap.data[idx + 2];
        const alpha = this.bitmap.data[idx + 3];

        const transparentHex = Jimp.rgbaToInt(0, 0, 0, 0);

        // Se for branco ou muito próximo do branco
        if (red > 230 && green > 230 && blue > 230) {
            this.setPixelColor(transparentHex, x, y);
        }
    });

    await image.writeAsync(fullPath.replace('.png', '_dark.png'));
    console.log(`Saved ${filename}_dark.png`);
}

async function main() {
    await processImage('sapo_feliz.png');
    await processImage('sapo_preocupado.png');
    console.log("Done");
}

main().catch(console.error);
