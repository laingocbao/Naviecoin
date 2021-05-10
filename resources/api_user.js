'use strict'
const blockchain = require('./blockchain/blockchain');
const transaction = require('./currency/transaction');

module.exports.setupRouters = function (server) {
    server.get('/user/balance', (req, res) => {
        const balance = blockchain.getAccountBalance();
        res.send({'balance': balance});
    });

    server.get('/user/address', (req, res) => {
        const address = transaction.getPublicFromWallet();
        res.send({'address': address});
    });

}