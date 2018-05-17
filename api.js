const fs = require('fs');
const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const contentDisposition = require('content-disposition');
const cors = require('cors');


const api = express();
api.use(express.static('public'));
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({extended: false}));
api.disable('x-powered-by');
api.use(cors());


// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

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

api.post('/getpdf', Render);

// Error page.
api.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!')
});

async function Render(req, res, next) {
    const filename = `receipt_t${new Date().getTime()}.pdf`;
    const path = `./${filename}`;
    const email = req.body['email'];
    const query = req.body['query'];
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();


        await page.setDefaultNavigationTimeout(0);
        await page.setViewport({width: 1200, height: 800, deviceScaleFactor: 2});
        await page.goto(query, {
            timeout: 60000,
            waitUntil: 'domcontentloaded'
        });
        await page.type('[name=email]', email);
        await page.click('[type=submit]');
        await page.waitForNavigation();
        await page.close();
        const pdfPage = await browser.newPage();
        await pdfPage.goto(query, {
            timeout: 60000,
            waitUntil: 'networkidle0'
        });
        await pdfPage.pdf({
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
    } catch (error) {
        next(error);
    }
}

// Terminate process
process.on('SIGINT', () => {
    process.exit(0);
});

module.exports = api;