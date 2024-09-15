document.getElementById('generate-btn').addEventListener('click', function() {
    const inputText = document.getElementById('input-text').value;
    const customQrCount = parseInt(document.getElementById('custom-qr').value, 10);
    const logoFile = document.getElementById('logo-upload').files[0];
    const lines = inputText.split('\n').filter(line => line.trim() !== "");
    const outputSection = document.querySelector('.qr-container');
    const exportBtn = document.getElementById('export-btn');

    outputSection.innerHTML = '';
    exportBtn.disabled = true;  
    const qrCodes = [];

    function generateRandomString() {
        return Array(16).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    function drawLogoOnQr(qrCanvas, logoImage, callback) {
        const ctx = qrCanvas.getContext('2d');
        const logoSize = qrCanvas.width / 6;
        ctx.drawImage(
            logoImage,
            (qrCanvas.width - logoSize) / 2,
            (qrCanvas.height - logoSize) / 2,
            logoSize,
            logoSize
        );
        callback(qrCanvas.toDataURL());
    }

    function createQrWithLogo(data, fileName, callback) {
        const qr = qrcode(4, 'Q');  
        qr.addData(data);
        qr.make();
        const qrCanvas = document.createElement('canvas');
        const ctx = qrCanvas.getContext('2d');
        qrCanvas.width = 200;
        qrCanvas.height = 200;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
        const qrImage = new Image();
        qrImage.src = qr.createDataURL();
        qrImage.onload = function() {
            ctx.drawImage(qrImage, 0, 0, qrCanvas.width, qrCanvas.height);
            if (logoFile) {
                const logoImage = new Image();
                const reader = new FileReader();
                reader.onload = function(e) {
                    logoImage.src = e.target.result;
                    logoImage.onload = function() {
                        drawLogoOnQr(qrCanvas, logoImage, callback);
                    };
                };
                reader.readAsDataURL(logoFile);
            } else {
                callback(qrCanvas.toDataURL());
            }
        };
    }

    if (customQrCount && customQrCount > 0) {
        for (let i = 0; i < customQrCount; i++) {
            const randomString = generateRandomString();
            createQrWithLogo(randomString, `${randomString}.png`, function(qrDataUrl) {
                const qrItem = document.createElement('div');
                qrItem.classList.add('qr-item');
                const label = document.createElement('div');
                label.innerText = `QR ${i + 1}: ${randomString}`;
                const qrImage = document.createElement('img');
                qrImage.src = qrDataUrl;
                qrItem.appendChild(label);
                qrItem.appendChild(qrImage);
                outputSection.appendChild(qrItem);
                qrCodes.push({ name: `${randomString}.png`, dataUrl: qrDataUrl });
            });
        }
    }

    lines.forEach((line, index) => {
        createQrWithLogo(line.trim(), `QR_${index + 1}.png`, function(qrDataUrl) {
            const qrItem = document.createElement('div');
            qrItem.classList.add('qr-item');
            const label = document.createElement('div');
            label.innerText = `QR ${index + 1}: ${line.trim()}`;
            const qrImage = document.createElement('img');
            qrImage.src = qrDataUrl;
            qrItem.appendChild(label);
            qrItem.appendChild(qrImage);
            outputSection.appendChild(qrItem);
            qrCodes.push({ name: `QR_${index + 1}.png`, dataUrl: qrDataUrl });
        });
    });

    setTimeout(() => {
        if (qrCodes.length > 0) {
            exportBtn.disabled = false;
        }

        exportBtn.onclick = function() {
            const zip = new JSZip();
            qrCodes.forEach(qr => {
                const imgData = qr.dataUrl.split(',')[1]; 
                zip.file(qr.name, imgData, { base64: true });
            });
            zip.generateAsync({ type: 'blob' }).then(function(content) {
                saveAs(content, 'qr_codes.zip');
            });
        };
    }, 1000);  
});
