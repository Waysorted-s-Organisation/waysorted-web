const fs = require('fs');
const path = require('path');

const directory = 'public/icons';
const files = fs.readdirSync(directory);

files.forEach(file => {
    if (path.extname(file) === '.svg') {
        const filePath = path.join(directory, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Regex to find base64 image data
        // Looks for data:image/png;base64, OR data:image/jpeg;base64,
        const match = content.match(/data:image\/([a-zA-Z]+);base64,([a-zA-Z0-9+/=]+)/);

        if (match) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const base64Data = match[2];
            const outputFilename = file.replace('.svg', `.${ext}`);
            const outputPath = path.join(directory, outputFilename);

            console.log(`Extracting embedded image from ${file} to ${outputFilename}...`);

            fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));

            const originalSize = fs.statSync(filePath).size;
            const newSize = fs.statSync(outputPath).size;

            console.log(`Done. Original SVG: ${(originalSize / 1024 / 1024).toFixed(2)} MB -> Extracted ${ext.toUpperCase()}: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log(`No embedded image found in ${file}`);
        }
    }
});
