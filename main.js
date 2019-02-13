const bodyParser = require('body-parser');
const express = require('express');

var {Block, generateNextBlock, generatenextBlockWithTransaction, generateRawNextBlock, getAccountBalance, 
    getBlockchain, 
    getMyUnspentTransactionOutputs, getUnspentTxOuts, sendTransaction} = require('./blockchain');
var {connectToPeers, getSockets, initP2PServer, broadcastLatest} = require('./p2p');
var {getPublicFromWallet, initWallet} = require('./transaction');
var {getTransactionPool} = require('./transactionPool');

const httpPort = parseInt(process.env.HTTP_PORT) || 3001;
const p2pPort = parseInt(process.env.P2P_PORT) || 6001;

const initHttpServer = ( myHttpPort ) => {
    const app = module.exports = express();
    app.use(bodyParser.json());

    app.use((err, req, res, next) => {
        if (err) {
            res.status(400).send(err.message);
        }
    });

    app.get('/blocks', (req, res) => {
        res.send(getBlockchain());
    });

    app.get('/unspentTransactionOutputs', (req, res) => {
        res.send(getUnspentTxOuts());
    });

    app.get('/myUnspentTransactionOutputs', (req, res) => {
        res.send(getMyUnspentTransactionOutputs());
    });

    app.post('/mineRawBlock', (req, res) => {
        if (req.body.data == null) {
            res.send('data parameter is missing');
            return;
        }
        const newBlock = generateRawNextBlock(req.body.data);
        if (newBlock === null) {
            res.status(400).send('could not generate block');
        } else {
            broadcastLatest();
            res.send(getBlockchain());
        }
    });

    app.post('/mineBlock', (req, res) => {
        const newBlock = generateNextBlock();
        if (newBlock === null) {
            res.status(400).send('could not generate block');
        } else {
            res.send(newBlock);
        }
    });

    app.get('/balance', (req, res) => {
        const balance = getAccountBalance();
        res.send({'balance': balance});
    });

    app.get('/address', (req, res) => {
        const address = getPublicFromWallet();
        res.send({'address': address});
    });

    app.post('/mineTransaction', (req, res) => {
        const address = req.body.address;
        const amount = req.body.amount;
        try {
            const resp = generatenextBlockWithTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });

    app.post('/sendTransaction', (req, res) => {
        try {
            const address = req.body.address;
            const amount = req.body.amount;

            if (address === undefined || amount === undefined) {
                throw Error('invalid address or amount');
            }
            const resp = sendTransaction(address, amount);
            res.send(resp);
        } catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });

    app.get('/transactionPool', (req, res) => {
        res.send(getTransactionPool());
    });

    app.get('/peers', (req, res) => {
        res.send(getSockets().map(( s ) => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {
        connectToPeers(req.body.peer);
        res.send();
    });

    app.post('/stop', (req, res) => {
        res.send({'msg' : 'stopping server'});
        process.exit();
    });

    app.listen(myHttpPort, () => {
        console.log('Listening http on port: ' + myHttpPort);
    });
};

initHttpServer(httpPort);
initP2PServer(p2pPort);
initWallet();