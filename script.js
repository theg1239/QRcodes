// Event listeners for Generate and Export buttons
document.getElementById('generate-btn').addEventListener('click', generateQRCodes);
document.getElementById('export-btn').addEventListener('click', exportAsZip);

// Array to store generated QR codes
let generatedQRCodes = [];

/**
 * Generates QR Codes based on user input and options.
 */
async function generateQRCodes() {
    const inputText = document.getElementById('input-text').value.trim();
    const numberOfQRs = parseInt(document.getElementById('custom-qr').value) || 0;
    const qrContainer = document.getElementById('qr-container');

    // Clear previous QR codes and reset the export button
    qrContainer.innerHTML = '';
    document.getElementById('export-btn').disabled = true;
    generatedQRCodes = [];

    if (!inputText && numberOfQRs <= 0) {
        alert('Please enter some text or specify the number of random QR codes to generate.');
        return;
    }

    // Split input text into lines and filter out empty lines
    let texts = inputText.split('\n').map(line => line.trim()).filter(line => line !== '');

    // Generate additional random QR codes if specified
    if (numberOfQRs > texts.length) {
        const additional = numberOfQRs - texts.length;
        for (let i = 0; i < additional; i++) {
            texts.push(generateRandomString(16));
        }
    }

    // Generate QR codes sequentially to ensure scannability
    for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const qrDataUrl = await createHighResQrCode(text);
        displayQrCode(`QR_${i + 1}`, text, qrDataUrl);
        generatedQRCodes.push({ name: `QR_${i + 1}.png`, data: qrDataUrl });
    }

    // Enable the export button if QR codes are generated
    if (generatedQRCodes.length > 0) {
        document.getElementById('export-btn').disabled = false;
    }
}

/**
 * Generates a random alphanumeric string of given length.
 * @param {number} length 
 * @returns {string}
 */
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for ( let i = 0; i < length; i++ ) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Creates a high-resolution QR code focused on scannability.
 * @param {string} text 
 * @returns {Promise<string>} Data URL of the QR code image
 */
function createHighResQrCode(text) {
    return new Promise((resolve) => {
        // Initialize QR Code with high error correction
        const qr = qrcode(0, 'H');  // 'H' ensures high error correction (30%)
        qr.addData(text);
        qr.make();

        // Define optimal resolution (e.g., 1024x1024 pixels)
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = '#FFFFFF'; // White background for contrast
        ctx.fillRect(0, 0, size, size);

        // Draw QR code
        const tileW = size / qr.getModuleCount();
        const tileH = size / qr.getModuleCount();

        for (let row = 0; row < qr.getModuleCount(); row++) {
            for (let col = 0; col < qr.getModuleCount(); col++) {
                ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#FFFFFF';  // Ensure black and white contrast
                ctx.fillRect(col * tileW, row * tileH, tileW, tileH);
            }
        }

        resolve(canvas.toDataURL('image/png'));  // Return QR code as data URL
    });
}

/**
 * Displays a generated QR code in the output section.
 * @param {string} label 
 * @param {string} text 
 * @param {string} dataUrl 
 */
function displayQrCode(label, text, dataUrl) {
    const qrContainer = document.getElementById('qr-container');

    const qrItem = document.createElement('div');
    qrItem.classList.add('qr-item');

    const qrText = document.createElement('div');
    qrText.classList.add('qr-text');
    qrText.innerText = `${label}: ${text}`;

    const qrImage = document.createElement('img');
    qrImage.src = dataUrl;
    qrImage.alt = `${label} Image`;

    qrItem.appendChild(qrText);
    qrItem.appendChild(qrImage);
    qrContainer.appendChild(qrItem);
}

/**
 * Exports all generated QR codes as a ZIP file.
 */
function exportAsZip() {
    if (generatedQRCodes.length === 0) {
        alert('No QR codes to export.');
        return;
    }

    const zip = new JSZip();
    const imgFolder = zip.folder("QR_Codes");

    generatedQRCodes.forEach(qr => {
        // Remove the data URL prefix to get pure base64
        const base64Data = qr.data.replace(/^data:image\/(png|jpg);base64,/, "");
        imgFolder.file(qr.name, base64Data, {base64: true});
    });

    zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, "QR_Codes.zip");
    });
}