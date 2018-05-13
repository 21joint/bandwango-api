const fs = require('fs');
const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const contentDisposition = require('content-disposition');
const cors = require('cors');
const api = express();
const IS_DEV = api.get('env') == 'development';
console.log(IS_DEV);
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({extended: false}));

const str = 'http://app.bandwango.com/dashboard/receipt?p=3&t=TY9QG2ZZE&orderId=368128';
console.log();


// const url = process.argv[2].replace(/--/, '');
//
// const whitelist = ['http://localhost:8000', 'http://localhost:3000'];
// const resolveCorsOptions = (req, cb) => {
//     let corsOptions;
//     if (whitelist.indexOf(req.header('Origin')) !== -1) {
//         corsOptions = {origin: true} // reflect (enable) the requested origin in the CORS response
//     } else {
//         corsOptions = {origin: false} // disable CORS for this request
//     }
//     cb(null, corsOptions) // callback expects two parameters: error and options
// };

api.post('/getpdf', cors(), Render);

// Error page.
api.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!')
});

async function Render(req, res, next) {
    try {
        const filename = `receipt_t${new Date().getTime()}.pdf`;
        const path = `./${filename}`;
        const email = req.body['email'];
        const query = IS_DEV ? 'http://localhost:3002' + req.body['query'].slice(req.body['query'].indexOf('.com/') + 4) : req.body['query'];
        const browser = await puppeteer.launch({
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
            scale: 0.72
        });
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Size': path.length,
            'Content-Disposition': contentDisposition(path)
        });
        fs.createReadStream(path).pipe(res).on('finish', () => fs.unlink(path, (e) => console.log(e)));
    } catch (error) {
        console.error(error);
    }
}

// Terminate process
process.on('SIGINT', () => {
    process.exit(0);
});

module.exports = api;
