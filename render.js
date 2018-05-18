const fs = require('fs');
const puppeteer = require('puppeteer');

const filename = `receipt_t${new Date().getTime()}.pdf`;
const path = `./${filename}`;


let render = async (req, callback) => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreHTTPSErrors: true,
        headless: true
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    // Capture first request only
    page.once('request', request => {
        // Fulfill request with HTML, and continue all subsequent requests
        request.respond({body: req.body.content});
        page.on('request', request => request.continue());
    });
    await page.emulateMedia('screen');
    await page.goto(req.get('Referrer'), { waitUntil: 'networkidle0' });
    await page.pdf({
        path: path,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '0.75cm',
            bottom: '0.75cm',
            left: '0.75cm',
            right: '0.75cm'
        }
    }).then(callback, (error) => console.error(error));
    await browser.close();
    return fs.createReadStream(path);
};

module.exports = render;