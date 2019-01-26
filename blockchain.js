const SHA256 = require('crypto-js/sha256');
const {broadcastLatest} = require('./p2p');
const {hexToBinary} = require('./util');

function Block(){

    this.index = 0;
    this.hash = "";
    this.previousHash = "";
    this.timestamp = 0;
    this.data = "";    
    this.difficulty = 0;
    this.nonce = 0;

    return this;    
}

Block.prototype.constructor = function(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
    this.difficulty = difficulty;
    this.nonce = nonce;
}

const genesisBlock = new Block();
genesisBlock.constructor(
    0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null, 1465154705, 'my genesis block!!', 0, 0
);

const blockchain = [];
blockchain.push(genesisBlock);

const getBlockchain = () => blockchain;

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

const generateNextBlock = (blockData) => {
    const previousBlock = getLatestBlock();
    const difficulty = getDifficulty(getBlockchain());
    console.log('difficulty: ' + difficulty);
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = getCurrentTimestamp();
    const newBlock = findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);
    newBlock.constructor(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData, 0, 0);
    return newBlock;
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
    let nonce = 0;
    while (true) {
        const hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
        if (hashMatchesDifficulty(hash, difficulty)) {
            return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
        }
        nonce++;
    }
};

const calculateHashForBlock = (block) =>
    calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);

const calculateHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
    SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();

const addBlock = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
    }
};

const isValidBlockStructure = (block) => {
    // console.log(typeof block.index);
    // console.log(typeof block.hash);
    // console.log(typeof block.previousHash);
    // console.log(typeof block.timestamp);
    // console.log(typeof block.data);
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && (typeof block.previousHash === 'string' || typeof block.previousHash === 'object')
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};

const isValidNewBlock = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } else if (!isValidTimestamp(newBlock, previousBlock)) {
        console.log('invalid timestamp');
        return false;
    } else if (!hasValidHash(newBlock)) {
        return false;
    }
    return true;
};
const getAccumulatedDifficulty = (aBlockchain) => {
    return aBlockchain
        .map((block) => block.difficulty)
        .map((difficulty) => Math.pow(2, difficulty))
        .reduce((a, b) => a + b);
};

const isValidTimestamp = (newBlock, previousBlock) => {
    return ( previousBlock.timestamp - 60 < newBlock.timestamp )
        && newBlock.timestamp - 60 < getCurrentTimestamp();
};

const hasValidHash = (block) => {

    if (!hashMatchesBlockContent(block)) {
        console.log('invalid hash, got:' + block.hash);
        return false;
    }

    if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
        console.log('block difficulty not satisfied. Expected: ' + block.difficulty + 'got: ' + block.hash);
    }
    return true;
};

const hashMatchesBlockContent = (block) => {
    const blockHash = calculateHashForBlock(block);
    return blockHash === block.hash;
};

const hashMatchesDifficulty = (hash, difficulty) => {
    const hashInBinary = hexToBinary(hash);
    const requiredPrefix = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredPrefix);
};

const isValidChain = (blockchainToValidate) => {
    const isValidGenesis = (block) => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };

    if (!isValidGenesis(blockchainToValidate[0])) {
        return false;
    }

    for (let i = 1; i < blockchainToValidate.length; i++) {
        if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false;
        }
    }
    return true;
};

const addBlockToChain = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
        return true;
    }
    return false;
};

const replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) &&
        getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockchain())) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        broadcastLatest();
    } else {
        console.log('Received blockchain invalid');
    }
};

// Chapter 2

// export {Block, getBlockchain, getLatestBlock, generateNextBlock, isValidBlockStructure, replaceChain, addBlockToChain};
var exports = module.exports = {Block, getBlockchain, getLatestBlock, generateNextBlock, isValidBlockStructure, replaceChain, addBlockToChain};