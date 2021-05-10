'use strict'
const restify = require('restify');
const apiBlockchain = require('./resources/api_blockchain.js');
const apiPeer = require('./resources/api_peer.js');
const apiTransaction = require('./resources/api_transaction.js');
const apiUser = require('./resources/api_user.js');

let server = restify.createServer({
    name: 'BusMap API',
    version: '3.0.0'
});

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

apiBlockchain.setupRouters(server);
apiPeer.setupRouters(server);
apiTransaction.setupRouters(server);
apiUser.setupRouters(server);

server.listen(5000, function () {
    console.log('%s listening at %s', server.name, server.url);
});