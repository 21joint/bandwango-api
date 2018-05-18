const fs = require('fs');
const puppeteer = require('puppeteer');

const filename = `receipt_t${new Date().getTime()}.pdf`;
const path = `./${filename}`;


let render = async (html, headers, callback) => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreHTTPSErrors: true,
        headless: true
    });
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    await page.goto(headers.origin, {waitUntil: 'networkidle0'});
    await page.setContent(html);
    await page.emulateMedia('screen');
    await page.pdf({
        path: path,
        format: 'A4',
        printBackground: true,
        scale: 0.85
    }).then(callback, (error) => console.error(error));
    await browser.close();
    return fs.createReadStream(path);
};

module.exports = render;