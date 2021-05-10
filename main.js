const bodyParser = require('body-parser');
const express = require('express');

var {Block, generateNextBlock, generatenextBlockWithTransaction, generateRawNextBlock, getAccountBalance, 
    getBlockchain, 
    getMyUnspentTransactionOutputs, getUnspentTxOuts, sendTransaction} = require('./resources/blockchain/blockchain');
var {connectToPeers, getSockets, initP2PServer, broadcastLatest} = require('./resources/p2p/p2p');
var {getPublicFromWallet, initWallet} = require('./resources/currency/transaction');
var {getTransactionPool} = require('./resources/currency/transaction_pool');

const httpPort = parseInt(process.env.HTTP_PORT) || 3001;
const p2pPort = parseInt(process.env.P2P_PORT) || 6001;

const initHttpServer = ( myHttpPort ) => {
    const app = module.exports = express();

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