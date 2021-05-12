'use strict'
const blockchain = require('./blockchain/blockchain.js');
const p2p = require('./p2p/p2p');

module.exports.setupRouters = function (server) {
    server.get('/blockchain/detail', (req, res, next) => {
        res.send(blockchain.getBlockchain());
    })

    server.post('/blockchain/mine_raw_block', (req, res, next) => {
        if (!req.body || req.body.data == null)
            return res.send('data parameter is missing');

        const newBlock = blockchain.generateNextBlockWithData(req.body.data);
        if (newBlock === null) {
            res.send(404, 'could not generate block');
        } else {
            // p2p.broadcastLatest();   // OPEN AGAIN
            res.send(blockchain.getBlockchain());
        }
    })
}