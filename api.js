const fs = require('fs');
const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const contentDisposition = require('content-disposition');


const api = express();
api.use(express.static('public'));
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({extended: false}));
api.disable('x-powered-by');

// const url = process.argv[2].replace(/--/, '');


api.post('/getpdf', Render);
// Error page.
api.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Oops, An expected error seems to have occurred.')
});

async function Render(req, res, next) {
    try {
        const filename = `receipt_t${new Date().getTime()}.pdf`;
        const path = `./${filename}`;
        const email = req.body.email;
        const query = req.body.query;
        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(query, {
            timeout: 60000,
            waitUntil: 'domcontentloaded'
        });
        await page.type('[name=email]', email);
        await page.click('[type=submit]');
        await page.waitForNavigation({
            timeout: 60000,
            waitUntil: 'domcontentloaded'
        });
        await page.goto(query, {
            timeout: 60000,
            waitUntil: 'networkidle0'
        });
        await page.pdf({
            path: path,
            format: 'A4',
            printBackground: true
        });
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Size': path.length,
            'Content-Disposition': contentDisposition(path)
        });
        fs.createReadStream(path).pipe(res).on('finish', () => fs.unlink(path, (e) => console.log(e)));
    } catch (e) {
        throw e;
    }
}


// Terminate process
process.on('SIGINT', () => {
    process.exit(0);
});

module.exports = api;
