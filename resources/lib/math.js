'use strict'
const SHA256 = require('crypto-js/sha256');

const calculateHashForBlock = (block) =>
    calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);

const calculateHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
    SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();

module.exports = {calculateHashForBlock, calculateHash}