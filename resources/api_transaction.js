'use strict'
const blockchain = require('./blockchain/blockchain');
const transaction = require('./currency/transaction');
const transactionPool = require('./currency/transaction_pool');

module.exports.setupRouters = function (server) {

    server.post('/transaction/mine_block_by_transaction_pool', (req, res) => {
        const newBlock = transactionPool.generateNextBlockByTransactionPool();
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

    server.get('/transaction/unspent_transaction_outputs', (req, res, next) => {
        res.send(blockchain.getUnspentTxOuts());
    })

    server.get('/transaction/my_unspent_transaction_outputs', (req, res) => {
        res.send(blockchain.getMyUnspentTransactionOutputs());
    });

    server.post('/transaction/send', (req, res) => {
        try {
            const address = req.body.address;
            const amount = req.body.amount;

            if (address === undefined || amount === undefined) {
                throw Error('invalid address or amount');
            }
            const resp = blockchain.sendTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log(e.message);
            res.send(400, e.message);
        }
    });

    server.get('/transaction/pool', (req, res) => {
        res.send(transactionPool.getTransactionPool());
    });
}