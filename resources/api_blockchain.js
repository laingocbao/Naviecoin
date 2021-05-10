'use strict'
const blockchain = require('./blockchain/blockchain.js');
const p2p = require('./p2p/p2p');

module.exports.setupRouters = function (server) {
    server.get('/blockchain/list', (req, res, next) => {
        res.send(blockchain.getBlockchain());
    })

    server.post('/blockchain/mine_raw_block', (req, res, next) => {
        if (!req.body || req.body.data == null)
            return res.send('data parameter is missing');

        const newBlock = blockchain.generateRawNextBlock(req.body.data);
        if (newBlock === null) {
            res.send(404, 'could not generate block');
        } else {
            p2p.broadcastLatest();
            res.send(blockchain.getBlockchain());
        }
    })

    server.post('/blockchain/mine_block', (req, res) => {
        const newBlock = blockchain.generateNextBlock();
        if (newBlock === null) {
            res.send(404, 'could not generate block');
        } else {
            res.send(newBlock);
        }
    });

    server.post('/blockchain/mine_transaction', (req, res) => {
        const address = req.body.address;
        const amount = req.body.amount;
        try {
            const resp = blockchain.generateNextBlockWithTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log(e.message);
            res.send(404, e.message);
        }
    });
}