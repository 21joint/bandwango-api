const fs = require('fs');
const puppeteer = require('puppeteer');

const filename = `receipt_t${new Date().getTime()}.pdf`;
const path = `./${filename}`;


let render = async (html, req, callback) => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreHTTPSErrors: true,
        headless: true
    });
    const page = await browser.newPage();
    await page.goto(`data:text/html;charset=UTF-8,${html}`, { waitUntil: 'networkidle0' });
    await page.emulateMedia('screen');
    await page.pdf({
        path: path,
        format: 'A4',
        printBackground: true,
        scale: 0.75,
        margin: {
            top: '1cm',
            bottom: '1cm',
            left: '1cm',
            right: '1cm'
        }
    }).then(callback, (error) => console.error(error));
    await browser.close();
    return fs.createReadStream(path);
};

module.exports = render;