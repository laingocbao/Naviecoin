'use strict'
const Block = require('../blockchain/block');
const genesisData = require('../currency/transaction').genesisTransaction;

const genesisBlock = new Block();
genesisBlock.constructor(
    0,
    '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7',
    null,
    1465154705,
    [genesisData],
    0,
    0
);

class Storage {
    static getInstance() {
        if (!Storage.instance) {
            Storage.instance = new Storage();
            Storage.instance.blockchain = [];
            Storage.instance.blockchain.push(genesisBlock);
        }
        return Storage.instance;
    }

}

module.exports = Storage;