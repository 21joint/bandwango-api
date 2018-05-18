#!/usr/bin/env node

const api = require('./api');
const port = process.env.PORT || 3000;


setTimeout(() => {
    console.log(Math.random());
    api.listen(port, () => console.log(`Listening on port: ${port}!`));
}, 2000);