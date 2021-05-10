'use strict'
const transaction = require('../currency/transaction');
const p2p = require('../p2p/p2p');
const _ = require('lodash');
const transactionPool = require('../currency/transaction_pool');
const {Block} = require('./block');
const wallet = require('../currency/wallet');
const util = require('../lib/util');
const math = require('../lib/math');
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

let blockchain = [];
blockchain.push(genesisBlock);

const getLatestBlock = () => blockchain[blockchain.length - 1];

// in seconds
const BLOCK_GENERATION_INTERVAL = 10;

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

const getDifficulty = (aBlockchain) => {
    const latestBlock = aBlockchain[blockchain.length - 1];
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
        return getAdjustedDifficulty(latestBlock, aBlockchain);
    } else {
        return latestBlock.difficulty;
    }
};

const getAdjustedDifficulty = (latestBlock, aBlockchain) => {
    const prevAdjustmentBlock = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
    if (timeTaken < timeExpected / 2) {
        return prevAdjustmentBlock.difficulty + 1;
    } else if (timeTaken > timeExpected * 2) {
        return prevAdjustmentBlock.difficulty - 1;
    } else {
        return prevAdjustmentBlock.difficulty;
    }
};

const getCurrentTimestamp = () => Math.round(new Date().getTime() / 1000);

exports.getBlockchain = () => blockchain;

exports.generateRawNextBlock  = (blockData) => {
    const previousBlock = getLatestBlock();
    const difficulty = getDifficulty(getBlockchain());
    console.log('difficulty: ' + difficulty);
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = getCurrentTimestamp();
    const newBlock = findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);
    
    if(addBlockToChain(newBlock)) {
        return newBlock;
    } else {
        return null;
    }
};

exports.generateNextBlock = () => {
    const coinbaseTx = transaction.getCoinbaseTransaction(wallet.getPublicFromWallet(), getLatestBlock().index + 1);
    const blockData = [coinbaseTx].concat(transactionPool.getTransactionPool());
    return generateRawNextBlock(blockData);
};

exports.generateNextBlockWithTransaction = (receiverAddress, amount) => {
    if (!util.isValidAddress(receiverAddress)) {
        throw Error('invalid address');
    }
    if (typeof amount !== 'number') {
        throw Error('invalid amount');
    }
    const coinbaseTx = transaction.getCoinbaseTransaction(wallet.getPublicFromWallet(), getLatestBlock().index + 1);
    const tx = wallet.createTransaction(receiverAddress, amount, wallet.getPrivateFromWallet(), transaction.getUnspentTxOuts(), transactionPool.getTransactionPool());
    const blockData = [coinbaseTx, tx];
    return generateRawNextBlock(blockData);
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
    let nonce = 0;
    while (true) {
        const hash = math.calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
        if (util.hashMatchesDifficulty(hash, difficulty)) {
            let newBlock = new Block();
            newBlock.constructor(index, hash, previousHash, timestamp, data, difficulty, nonce);
            return newBlock;
        }
        nonce++;
    }
};

const addBlockToChain = (newBlock) => {
    if (util.isValidNewBlock(newBlock, getLatestBlock())) {
        const retVal = transaction.processTransactions(newBlock.data, getUnspentTxOuts(), newBlock.index);
        if (retVal === null) {
            console.log('block is not valid in terms of transactions');
            return false;
        } else {
            blockchain.push(newBlock);
            transaction.setUnspentTxOuts(retVal);
            transactionPool.updateTransactionPool(transaction.getUnspentTxOuts());
            return true;
        }
    }
    return false;
};

const replaceChain = (newBlocks) => {
    const aUnspentTxOuts = util.isValidChain(newBlocks);
    const validChain = aUnspentTxOuts !== null;
    if (validChain &&
        util.getAccumulatedDifficulty(newBlocks) > util.getAccumulatedDifficulty(getBlockchain())) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        transaction.setUnspentTxOuts(aUnspentTxOuts);
        transactionPool.updateTransactionPool(transaction.getUnspentTxOuts());
        p2p.broadcastLatest();
    } else {
        console.log('Received blockchain invalid');
    }
};

const handleReceivedTransaction = (transaction) => {
    transactionPool.addToTransactionPool(transaction, getUnspentTxOuts());
};

exports.blockchain = blockchain;