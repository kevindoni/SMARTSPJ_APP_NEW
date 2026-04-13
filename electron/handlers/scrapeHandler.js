const https = require('https');

async function scrapeSchoolData(npsn) {
    if (!npsn) return { success: false, message: 'NPSN is required' };

    // FALLBACK TO EXTERNAL SCRAPER (Backup)
    const url = `https://referensi.data.kemendikdasmen.go.id/tabs.php?npsn=${npsn}`;

    return new Promise((resolve) => {
        const req = https.get(url, {}, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const newUrl = res.headers.location;
                https.get(newUrl, {}, (res2) => {
                    let data = '';
                    res2.on('data', chunk => data += chunk);
                    res2.on('end', () => resolve(parseHtml(data)));
                }).on('error', err => resolve({ success: false, message: err.message }));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(parseHtml(data)));
        });

        req.on('error', (err) => {
            resolve({ success: false, message: err.message });
        });
    });
}

function parseHtml(html) {
    try {
        const extract = (label) => {
            const regex = new RegExp(`<td>\\s*${label}\\s*</td>[\\s\\S]*?<td>:</td>[\\s\\S]*?<td>\\s*(.*?)\\s*</td>`, 'i');
            const match = html.match(regex);
            return match ? match[1].replace(/<[^>]*>/g, '').trim() : null;
        };

        const kecamatan = extract('Kecamatan/Kota \\(LN\\)');
        const kabupaten = extract('Kab.-Kota/Negara \\(LN\\)');
        const provinsi = extract('Propinsi/Luar Negeri \\(LN\\)');
        const desa = extract('Desa/Kelurahan');
        const alamat = extract('Alamat');

        if (!kecamatan && !kabupaten) {
            return { success: false, message: 'Data not found in HTML' };
        }

        return {
            success: true,
            data: {
                kecamatan,
                kabupaten,
                provinsi,
                desa,
                alamat
            },
            source: 'external_scraper'
        };
    } catch (err) {
        return { success: false, message: 'Parsing error: ' + err.message };
    }
}

module.exports = { scrapeSchoolData };
