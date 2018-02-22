'use strict';
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const login = require("facebook-chat-api");
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const credentials = require('./credentials.json');

const db = new sqlite3.Database('matsmart.sqlite'),
      query = "SELECT name, url, price, normalPrice FROM Products",
      testMode = false,
      urlPrefix = 'https://www.matsmart.se',
      urlsToScrape = [
           'https://www.matsmart.se/storpack-fynda-hela-lador',
           'https://www.matsmart.se/skafferiet',
           'https://www.matsmart.se/drycker',
           'https://www.matsmart.se/godis',
           'https://www.matsmart.se/snacks',
           'https://www.matsmart.se/produkter/halsa',
           'https://www.matsmart.se/barn-0',
           'https://www.matsmart.se/te-kaffe',
           'https://www.matsmart.se/produkter/brod-kakor-kex',
           'https://www.matsmart.se/kryddor',
           'https://www.matsmart.se/saser-oljor',
           'https://www.matsmart.se/ekologiskt',
           'https://www.matsmart.se/glutenfritt',
           'https://www.matsmart.se/produkter/har-kropp-intim',
           'https://www.matsmart.se/produkter/munvard',
           'https://www.matsmart.se/apotek',
           'https://www.matsmart.se/spara-och-forvara',
           'https://www.matsmart.se/produkter/stad-tvatt-disk',
           'https://www.matsmart.se/i-koket',
           'https://www.matsmart.se/husdjur',
      ];

const sendFBMessage = (msg) => {
    if (fs.existsSync('appstate.json')) {
        login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
            if(err) return console.error(err);
    
            var userId = api.getCurrentUserID();
        
            api.sendMessage(msg, userId);
        });
    }
    else {
        login({ email: credentials.userName, password: credentials.password }, (err, api) => {
            if(err) return console.error(err);
    
            fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
        });
    }
};

db.on("error", (error) => {
    console.log('SQLite error: ' + error);
});

process.on('exit', function () {
    db.close();

    console.log('Done with everything.');
});

const readDatabase = new Promise((resolve, reject) => {
    try {
        db.all(query, [], (err, rows) => {
            if (err) {
                throw err;
            }
        
            let products = [];
            console.log('Read database');
        
            rows.forEach(product => {
                products.push({
                    name: product.name,
                    url: product.url,
                    price: product.price,
                    normalPrice: product.normalPrice,
                });
            });

            resolve(products);
        });
    }
    catch(err) {
        reject(err);
    }
});

const scrapeSites = products => {
    if (testMode) return 'ok';

    var message = '';

    try {
        for (let i = 0; i < urlsToScrape.length; i++) {
            fetch(urlsToScrape[i], { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36' } })
                .then(res => res.text())
                .then(body => {
                    console.log('Fetched ' + urlsToScrape[i]);
                    let $ = cheerio.load(body);

                    $('.prd').each((i, productBox) => {
                        let productName = $(productBox).find('.prd-name').text().trim().replace(/[^a-zA-z0-9 \å\ä\ö\Å\Ä\Ö]/g, ''),
                            normalPrice = $(productBox).find('[data-normal-price]').data('normal-price') / 100,
                            currentPrice = $(productBox).find('[data-cur-price]').data('cur-price') / 100,
                            discount = Math.round(100 - ((currentPrice / normalPrice) * 100)),
                            productUrl = $(productBox).find('a').attr('href'),
                            query = '';
        
                    if (typeof(normalPrice) !== 'number' || typeof(currentPrice) !== 'number') {
                        console.log('Price is incorrect for product: ' + productName, normalPrice, currentPrice);
                        return;
                    }

                    let thisProduct = products.find(prod => prod.url === productUrl);
                    
                    if (typeof(thisProduct) === 'undefined') {
                        console.log(`New product detected: ${urlPrefix}${productUrl}`);
                        message += `New product detected: ${urlPrefix}${productUrl}\r\n`;

                        query = `INSERT INTO Products
                                    (name, url, price, normalPrice)
                                    VALUES (
                                        '${productName}', '${productUrl}', '${currentPrice}', '${normalPrice}'
                                    )`;
                    }
                    else if (currentPrice < thisProduct.currentPrice) {
                        console.log(`Price reduction detected: ${urlPrefix}${productUrl}. It changed from ${thisProduct.price} SEK to ${currentPrice} SEK (${discount}% dicount)`);
                        message += `Price reduction detected: ${urlPrefix}${productUrl}. It changed from ${thisProduct.price} SEK to ${currentPrice} SEK (${discount}% dicount)\r\n`;

                        query = `UPDATE Products SET name = '${productName}', price = '${currentPrice}', normalPrice = '${normalPrice}'
                                    WHERE url = '${productUrl}'
                                    `;
                    }

                    if (query === '') return;
                    
                    db.serialize(function() {           
                        let stmt = db.prepare(query);
                        stmt.run();
                        stmt.finalize();
                    });
                });
            });
        }

        if (message === '') return;

        sendFBMessage(message);
    }
    catch (err) {
        console.log(err);
    }
};

readDatabase.then(products => {
    scrapeSites(products);
});
