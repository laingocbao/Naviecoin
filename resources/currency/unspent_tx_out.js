'use strict'
const _ = require('lodash');

// the unspent txOut of genesis block is set to unspentTxOuts on startup
let unspentTxOuts = this.processTransactions(blockchain[0].data, [], 0);

exports.getUnspentTxOuts = () => _.cloneDeep(unspentTxOuts);

// and txPool should be only updated at the same time
exports.setUnspentTxOuts = (newUnspentTxOut) => {
    console.log('replacing unspentTxouts with: %s', newUnspentTxOut);
    unspentTxOuts = newUnspentTxOut;
};


// gets the unspent transaction outputs owned by the wallet
exports.getMyUnspentTransactionOutputs = () => {
    return wallet.findUnspentTxOuts(getPublicFromWallet(), getUnspentTxOuts());
};


const updateUnspentTxOuts = (aTransactions, aUnspentTxOuts) => {
    const newUnspentTxOuts = aTransactions.map((t) => {
        return t.txOuts.map((txOut, index) => {
            let unspentTxOut = new UnspentTxOut();
            unspentTxOut.constructor(t.id, index, txOut.address, txOut.amount);
            return unspentTxOut
        });
    })
        .reduce((a, b) => a.concat(b), []);

    const consumedTxOuts = aTransactions
        .map((t) => t.txIns)
        .reduce((a, b) => a.concat(b), [])
        .map((txIn) => {
            let unspentTxOut = new UnspentTxOut();
            unspentTxOut.constructor(txIn.txOutId, txIn.txOutIndex, '', 0);
            return unspentTxOut
        });

    return aUnspentTxOuts
        .filter(((uTxO) => !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)))
        .concat(newUnspentTxOuts);
};

exports.processTransactions = (aTransactions, aUnspentTxOuts, blockIndex) => {
    if (!validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
        console.log('invalid block transactions');
        return null;
    }
    return updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
};
