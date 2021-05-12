const _ = require('lodash');
const transaction = require('./transaction');
const wallet = require('./wallet');
const blockchain = require('../blockchain/blockchain.js');

let transaction_pool = [];

const getTransactionPool = () => {
    return _.cloneDeep(transaction_pool);
};

const addToTransactionPool = (tx, unspentTxOuts) => {

    if (!validateTransaction(tx, unspentTxOuts)) {
        throw Error('Trying to add invalid tx to pool');
    }

    if (!isValidTxForPool(tx, transaction_pool)) {
        throw Error('Trying to add invalid tx to pool');
    }
    console.log('adding to txPool: %s', JSON.stringify(tx));
    transaction_pool.push(tx);
};

const hasTxIn = (txIn, unspentTxOuts) => {
    const foundTxIn = unspentTxOuts.find((uTxO) => {
        return uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex;
    });
    return foundTxIn !== undefined;
};

const updateTransactionPool = (unspentTxOuts) => {
    const invalidTxs = [];
    for (const tx of transaction_pool) {
        for (const txIn of tx.txIns) {
            if (!hasTxIn(txIn, unspentTxOuts)) {
                invalidTxs.push(tx);
                break;
            }
        }
    }
    if (invalidTxs.length > 0) {
        console.log('removing the following transactions from txPool: %s', JSON.stringify(invalidTxs));
        transaction_pool = _.without(transaction_pool, ...invalidTxs);
    }
};

const getTxPoolIns = (aTransactionPool) => {
    return _(aTransactionPool)
        .map((tx) => tx.txIns)
        .flatten()
        .value();
};

const generateNextBlockByTransactionPool = () => {
    const coinbaseTx = transaction.getCoinbaseTransaction(wallet.getPublicKeyFromMyWallet(), blockchain.getLatestBlock().index + 1);
    const blockData = [coinbaseTx].concat(getTransactionPool());
    return blockchain.generateNextBlockWithData(blockData);
};

module.exports = {addToTransactionPool, getTransactionPool, updateTransactionPool, generateNextBlockByTransactionPool};