const CryptoJS = require('crypto-js');
const ecdsa = require('elliptic');
const _ = require('lodash');
const {existsSync, readFileSync, unlinkSync, writeFileSync} = require('fs');
const blockchain = require('../blockchain/blockchain');
const wallet = require('./wallet');

const ec = new ecdsa.ec('secp256k1');

const COINBASE_AMOUNT = 50;

exports.genesisTransaction = {    // Giao dịch khởi tạo của blockchain
    'txIns': [{'signature': '', 'txOutId': '', 'txOutIndex': 0}],
    'txOuts': [{
        'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
        'amount': 50
    }],
    'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
};

function UnspentTxOut() {
    this.txOutId = "";
    this.txOutIndex = 0;
    this.address = "";
    this.amount = 0;

    return this;
}

UnspentTxOut.prototype.constructor = function (txOutId, txOutIndex, address, amount) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.address = address;
    this.amount = amount;
}

function TxIn() {
    this.txOutId = "";
    this.txOutIndex = 0;
    this.signature = "";

    return this;
}

function TxOut() {
    this.address = "";
    this.amount = 0;

    return this;
}

TxOut.prototype.constructor = function (address, amount) {
    this.address = address;
    this.amount = amount;
}

function Transaction() {
    this.id = "";
    this.txIns = [];
    this.txOuts = [];
}

const getAccountBalance = () => {
    return wallet.getBalance(getPublicFromWallet(), getUnspentTxOuts());
};

const sendTransaction = (address, amount) => {
    const tx = wallet.createTransaction(address, amount, wallet.getPrivateFromWallet(), getUnspentTxOuts(), transactionPool.getTransactionPool());
    transactionPool.addToTransactionPool(tx, getUnspentTxOuts());
    p2p.broadCastTransactionPool();
    return tx;
};


const getTransactionId = (transaction) => {
    const txInContent = transaction.txIns
        .map((txIn) => txIn.txOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, '');

    const txOutContent = transaction.txOuts
        .map((txOut) => txOut.address + txOut.amount)
        .reduce((a, b) => a + b, '');

    return CryptoJS.SHA256(txInContent + txOutContent).toString();
};

const hasDuplicates = (txIns) => {
    const groups = _.countBy(txIns, (txIn) => txIn.txOutId + txIn.txOutIndex);
    return _(groups)
        .map((value, key) => {
            if (value > 1) {
                console.log('duplicate txIn: ' + key);
                return true;
            } else {
                return false;
            }
        })
        .includes(true);
};

const getTxInAmount = (txIn, aUnspentTxOuts) => {
    return findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts).amount;
};

const findUnspentTxOut = (transactionId, index, aUnspentTxOuts) => {
    return aUnspentTxOuts.find((uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index);
};

exports.getCoinbaseTransaction = (address, blockIndex) => {
    const t = new Transaction();
    const txIn = new TxIn();
    txIn.signature = '';
    txIn.txOutId = '';
    txIn.txOutIndex = blockIndex;

    t.txIns = [txIn];
    let txOut = new TxOut();
    txOut.constructor(address, COINBASE_AMOUNT);
    t.txOuts = [txOut];
    t.id = getTransactionId(t);
    return t;
};

const signTxIn = (transaction, txInIndex, privateKey, aUnspentTxOuts) => {
    const txIn = transaction.txIns[txInIndex];

    const dataToSign = transaction.id;
    const referencedUnspentTxOut = findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts);
    if (referencedUnspentTxOut == null) {
        console.log('could not find referenced txOut');
        throw Error();
    }
    const referencedAddress = referencedUnspentTxOut.address;

    if (getPublicKey(privateKey) !== referencedAddress) {
        console.log('trying to sign an input with private' +
            ' key that does not match the address that is referenced in txIn');
        throw Error();
    }
    const key = ec.keyFromPrivate(privateKey, 'hex');
    const signature = toHexString(key.sign(dataToSign).toDER());

    return signature;
};
