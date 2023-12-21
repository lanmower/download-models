const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const readTSVFile = (filePath) => {
    const data = fs.readFileSync(filePath, 'utf-8');
    const rows = data.split('\n').map(row => {
        return row.split('\t');
    });
    return rows;
};

(async () => {
    const tsvFilePath = 'filtered.tsv'; // Replace with your TSV file path
    const rows = readTSVFile(tsvFilePath);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    for (let i = 0; i < rows.length; i++) {
        const url = rows[i][1];
        console.log(rows[i])
        if (url) {
            const fileName = rows[i][0].replaceAll(' ', '-').replaceAll(',', '-').replaceAll('.', '-').replaceAll('\'', '-').replaceAll('!', '-').replaceAll('`', '-').substring(0, 120) + `.glb`;
            if (fs.existsSync(path.join(__dirname + "/" + process.argv[2], fileName))) continue;
            const pagePromise = page.goto(url, { waitUntil: 'load' });
            const glbURLs = [];
            const responses = [];
            page.on('response', async (response) => {
                const contentType = response.headers()['content-type'];
                if (contentType && contentType.includes('application/octet-stream')) {
                    const responseURL = response.url();
                    if (responseURL.endsWith('.glb')) {
                        glbURLs.push(responseURL);
                        responses.push(response);
                    }
                }
            });
            console.log(glbURLs.length, responses.length)
            await new Promise(res => { setTimeout(res, 4000) });
            await pagePromise;
            await page.waitForSelector('svg');
            await pagePromise;
            if (!fs.existsSync(__dirname + "/" + process.argv[2])) fs.mkdirSync(__dirname + "/" + process.argv[2])
            for (const response of responses) {
                const buffer = await response.buffer();
                console.log('saving ' + rows[i][0].replace(' ', '-').replace(',', '-').replace('.', '-').replace('\'', '-').replace('!', '-').replace('`', '-'))
                const filePath = path.join(__dirname + "/" + process.argv[2], fileName);
                fs.writeFileSync(filePath, buffer);
                console.log(`Downloaded: ${fileName}`);
            }
            console.log(`For URL ${url}, found ${glbURLs.length} GLB files:`, glbURLs);
        }
    }

    await browser.close();
})();
