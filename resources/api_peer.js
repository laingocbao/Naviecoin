'use strict'
const p2p = require('./p2p/p2p');

module.exports.setupRouters = function (server) {
    server.get('/peer/list', (req, res) => {
        res.send(p2p.getSockets().map(( s ) => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });

    server.post('/peer/add', (req, res) => {
        p2p.connectToPeers(req.body.peer);
        res.send();
    });
}