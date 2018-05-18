const fs = require('fs');
const puppeteer = require('puppeteer');

const filename = `receipt_t${new Date().getTime()}.pdf`;
const path = `./${filename}`;


let render = async (html, callback) => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, {waitUntil: 'networkidle0'});
    await page.waitFor(2000);
    await page.pdf({
        path: path,
        format: 'A4',
        printBackground: true
    }).then(callback, (error) => console.error(error));
    await browser.close();
    return await fs.createReadStream(path);
};

module.exports = render;