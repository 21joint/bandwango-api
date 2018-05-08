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

const url = process.argv[2].replace(/--/, '');
const Render = async (req, res, next) => {
    const filename = `receipt_t${new Date().getTime()}.pdf`;
    const path = `public/${filename}`;
    const email = req.body.email;
    const query = req.body.query;
    const browser = await puppeteer.launch();
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
        printBackground: true,
        margin: {
            left: '2.54cm',
            top: '2.54cm',
            right: '2.54cm',
            bottom: '2.54cm'
        }
    });
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Size': path.length,
        'Content-Disposition': contentDisposition(path)
    });
    fs.createReadStream(path).pipe(res).on('finish', () => fs.unlink(path, (e) => console.log(e)));
    next();

};

api.post('/getpdf', Render);
// Error page.
api.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Oops, An expected error seems to have occurred.')
});


// Terminate process
process.on('SIGINT', () => {
    process.exit(0);
});

module.exports = api;
