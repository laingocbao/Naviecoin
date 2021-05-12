'use strict'
const transaction = require('../currency/transaction');
const p2p = require('../p2p/p2p');
const _ = require('lodash');
const transactionPool = require('../currency/transaction_pool');
const wallet = require('../currency/wallet');
const utils = require('../lib/utils');
const math = require('../lib/math');
const storage = require('../storage/storage');
const Block = require('./block');

let blockchain = storage.getInstance().blockchain;
const getLatestBlock = () => {
    return blockchain[blockchain.length - 1]
};

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

const getBlockchain = () => blockchain;

const generateNextBlockWithData  = (data) => {
    const previousBlock = getLatestBlock();
    const difficulty = getDifficulty(getBlockchain());
    console.log('difficulty: ' + difficulty);
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = utils.getCurrentTimestamp();
    const newBlock = findBlock(nextIndex, previousBlock.hash, nextTimestamp, data, difficulty);
    
    if(addBlockToChain(newBlock)) {
        return newBlock;
    } else {
        return null;
    }
};

const generateNextBlockWithTransaction = (receiverAddress, amount) => {
    if (!utils.isValidAddress(receiverAddress)) {
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
        if (utils.hashMatchesDifficulty(hash, difficulty)) {
            let newBlock = new Block();
            newBlock.constructor(index, hash, previousHash, timestamp, data, difficulty, nonce);
            return newBlock;
        }
        nonce++;
    }
};

const addBlockToChain = (newBlock) => {
    if (utils.isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
        return true;

        // OPEN AGAIN
        // const retVal = transaction.processTransactions(newBlock.data, getUnspentTxOuts(), newBlock.index);
        // if (retVal === null) {
        //     console.log('block is not valid in terms of transactions');
        //     return false;
        // } else {
        //
        //     transaction.setUnspentTxOuts(retVal);
        //     transactionPool.updateTransactionPool(transaction.getUnspentTxOuts());
        //
        // }
    }
    return false;
};

const replaceChain = (newBlocks) => {
    const aUnspentTxOuts = utils.isValidChain(newBlocks);
    const validChain = aUnspentTxOuts !== null;
    if (validChain &&
        utils.getAccumulatedDifficulty(newBlocks) > utils.getAccumulatedDifficulty(getBlockchain())) {
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

module.exports = {blockchain, getBlockchain, generateNextBlockWithData, getLatestBlock};