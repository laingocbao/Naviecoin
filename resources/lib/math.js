

exports.calculateHashForBlock = (block) =>
    calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);

exports.calculateHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
    SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();
