'use strict'

function Block() {
    this.index = 0;
    this.hash = "";
    this.previousHash = "";
    this.timestamp = 0;
    this.data = [];
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
module.exports = Block;