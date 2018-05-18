const express = require('express');
const bodyParser = require('body-parser');
const contentDisposition = require('content-disposition');
const cors = require('cors');
const render = require('./render');
const purifycss = require('purify-css');


const api = express();
api.use(bodyParser.json({limit: '10mb'}));
api.use(bodyParser.urlencoded({extended: false, limit: '10mb'}));
api.disable('x-powered-by');
api.use(cors());

let buildHtml = async (host, content, styles) => {
    const _content = await content.replace(/\/fonts\//, 'https://bandwango-laravel-sandbox.herokuapp.com/fonts/');
    return await `<!doctype html><html>
                        <head>
                            <title>Receipt ${new Date().getTime()}</title>
                            <meta charset="UTF-8">
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <style>${styles}</style>
                        </head>
                        <body>${_content}</body>
                    </html>`
};


api.post('/getpdf', async (req, res, next) => {
    console.log(req.headers.origin);
    const stylesheet = await purifycss(req.body.content, req.body.styles, {
        // Will minify CSS code in addition to purify.
        minify: true,
        // Logs out removed selectors.
        rejected: true,
        info: true,
        whitelist: ['*prh*']
    });
    console.log(stylesheet);
    const html = await buildHtml(req.headers.origin, req.body.content, stylesheet);
    console.log(html);

    const stream = await render(html);

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition(stream.path),
        'Content-Size': stream.size
    });

    stream.pipe(res);
});

// Error page.
api.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!')
});


// Terminate process
process.on('SIGINT', () => {
    process.exit(0);
});

module.exports = api;