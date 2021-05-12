'use strict'
const {ec} = require('elliptic');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const {getPublicKey, getTransactionId, signTxIn, Transaction, TxIn, TxOut, UnspentTxOut} = require('./transaction');

const EC = new ec('secp256k1');
const privateKeyLocation = path.join(__dirname, '../../private_key.txt');

const getPrivateKeyFromMyWallet = () => {
    const buffer = fs.readFileSync(privateKeyLocation, 'utf8');
    return buffer.toString();
};

const getPublicKeyFromMyWallet = () => {
    const privateKey = getPrivateKeyFromMyWallet();
    const key = EC.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex');
};

const generatePrivateKey = () => {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
};

const initWallet = () => {
    // let's not override existing private keys
    if (existsSync(privateKeyLocation)) {
        return;
    }
    const newPrivateKey = generatePrivateKey();

    writeFileSync(privateKeyLocation, newPrivateKey);
    console.log('new wallet with private key created to : %s', privateKeyLocation);
};

exports.deleteWallet = () => {
    if (existsSync(privateKeyLocation)) {
        unlinkSync(privateKeyLocation);
    }
};

exports.getBalance = (address, unspentTxOuts) => {
    return _(findUnspentTxOuts(address, unspentTxOuts))
        .map((uTxO) => uTxO.amount)
        .sum();
};

exports.findUnspentTxOuts = (ownerAddress, unspentTxOuts) => {
    return _.filter(unspentTxOuts, (uTxO) => uTxO.address === ownerAddress);
};

exports.findTxOutsForAmount = (amount, myUnspentTxOuts) => {
    let currentAmount = 0;
    const includedUnspentTxOuts = [];
    for (const myUnspentTxOut of myUnspentTxOuts) {
        includedUnspentTxOuts.push(myUnspentTxOut);
        currentAmount = currentAmount + myUnspentTxOut.amount;
        if (currentAmount >= amount) {
            const leftOverAmount = currentAmount - amount;
            return {includedUnspentTxOuts, leftOverAmount};
        }
    }

    const eMsg = 'Cannot create transaction from the available unspent transaction outputs.' +
        ' Required amount:' + amount + '. Available unspentTxOuts:' + JSON.stringify(myUnspentTxOuts);
    throw Error(eMsg);
};

const createTxOuts = (receiverAddress, myAddress, amount, leftOverAmount) => {
    const txOut1 = new TxOut(receiverAddress, amount);
    if (leftOverAmount === 0) {
        return [txOut1];
    } else {
        const leftOverTx = new TxOut(myAddress, leftOverAmount);
        return [txOut1, leftOverTx];
    }
};

const filterTxPoolTxs = (unspentTxOuts, transactionPool) => {
    const txIns = _(transactionPool)
        .map((tx) => tx.txIns)
        .flatten()
        .value();
    const removable = [];
    for (const unspentTxOut of unspentTxOuts) {
        const txIn = _.find(txIns, (aTxIn) => {
            return aTxIn.txOutIndex === unspentTxOut.txOutIndex && aTxIn.txOutId === unspentTxOut.txOutId;
        });

        if (txIn === undefined) {

        } else {
            removable.push(unspentTxOut);
        }
    }

    return _.without(unspentTxOuts, ...removable);
};

exports.createTransaction = (receiverAddress, amount, privateKey,
                           unspentTxOuts, txPool) => {

    console.log('txPool: %s', JSON.stringify(txPool));
    const myAddress = getPublicKey(privateKey);
    const myUnspentTxOutsA = unspentTxOuts.filter((uTxO) => uTxO.address === myAddress);

    const myUnspentTxOuts = filterTxPoolTxs(myUnspentTxOutsA, txPool);

    // filter from unspentOutputs such inputs that are referenced in pool
    const {includedUnspentTxOuts, leftOverAmount} = findTxOutsForAmount(amount, myUnspentTxOuts);

    const toUnsignedTxIn = (unspentTxOut) => {
        const txIn = new TxIn();
        txIn.txOutId = unspentTxOut.txOutId;
        txIn.txOutIndex = unspentTxOut.txOutIndex;
        return txIn;
    };

    const unsignedTxIns = includedUnspentTxOuts.map(toUnsignedTxIn);

    const tx = new Transaction();
    tx.txIns = unsignedTxIns;
    tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);
    tx.id = getTransactionId(tx);

    tx.txIns = tx.txIns.map((txIn, index) => {
        txIn.signature = signTxIn(tx, index, privateKey, unspentTxOuts);
        return txIn;
    });

    return tx;
};

module.exports = {getPublicKeyFromMyWallet, }
// const privateKeyLocation = process.env.PRIVATE_KEY || 'node/wallet/private_key';
//
// exports.getPrivateFromWallet = () => {
//     const buffer = readFileSync(privateKeyLocation, 'utf8');
//     return buffer.toString();
// };
//
// exports.getPublicFromWallet = () => {
//     const privateKey = getPrivateFromWallet();
//     const key = ec.keyFromPrivate(privateKey, 'hex');
//     return key.getPublic().encode('hex');
// };
//
// const generatePrivateKey = () => {
//     const keyPair = ec.genKeyPair();
//     const privateKey = keyPair.getPrivate();
//     return privateKey.toString(16);
// };
//
// const initWallet = () => {
//     // let's not override existing private keys
//     if (existsSync(privateKeyLocation)) {
//         return;
//     }
//     const newPrivateKey = generatePrivateKey();
//
//     writeFileSync(privateKeyLocation, newPrivateKey);
//     console.log('new wallet with private key created to : %s', privateKeyLocation);
// };
//
// const deleteWallet = () => {
//     if (existsSync(privateKeyLocation)) {
//         unlinkSync(privateKeyLocation);
//     }
// };
//
// const getBalance = (address, unspentTxOuts) => {
//     return _(findUnspentTxOuts(address, unspentTxOuts))
//         .map((uTxO) => uTxO.amount)
//         .sum();
// };
//
// const findUnspentTxOuts = (ownerAddress, unspentTxOuts) => {
//     return _.filter(unspentTxOuts, (uTxO) => uTxO.address === ownerAddress);
// };
//
// const findTxOutsForAmount = (amount, myUnspentTxOuts) => {
//     let currentAmount = 0;
//     const includedUnspentTxOuts = [];
//     for (const myUnspentTxOut of myUnspentTxOuts) {
//         includedUnspentTxOuts.push(myUnspentTxOut);
//         currentAmount = currentAmount + myUnspentTxOut.amount;
//         if (currentAmount >= amount) {
//             const leftOverAmount = currentAmount - amount;
//             return {includedUnspentTxOuts, leftOverAmount};
//         }
//     }
//
//     const eMsg = 'Cannot create transaction from the available unspent transaction outputs.' +
//         ' Required amount:' + amount + '. Available unspentTxOuts:' + JSON.stringify(myUnspentTxOuts);
//     throw Error(eMsg);
// };
//
// const createTxOuts = (receiverAddress, myAddress, amount, leftOverAmount) => {
//     const txOut1 = new TxOut();
//     txOut1.constructor(receiverAddress, amount);
//     if (leftOverAmount === 0) {
//         return [txOut1];
//     } else {
//         const leftOverTx = new TxOut();
//         leftOverTx.constructor(myAddress, leftOverAmount);
//         return [txOut1, leftOverTx];
//     }
// };
//
// const filterTxPoolTxs = (unspentTxOuts, transactionPool) => {
//     const txIns = _(transactionPool)
//         .map((tx) => tx.txIns)
//         .flatten()
//         .value();
//     const removable = [];
//     for (const unspentTxOut of unspentTxOuts) {
//         const txIn = _.find(txIns, (aTxIn) => {
//             return aTxIn.txOutIndex === unspentTxOut.txOutIndex && aTxIn.txOutId === unspentTxOut.txOutId;
//         });
//
//         if (txIn === undefined) {
//
//         } else {
//             removable.push(unspentTxOut);
//         }
//     }
//
//     return _.without(unspentTxOuts, ...removable);
// };
//
// const createTransaction = (receiverAddress, amount, privateKey, unspentTxOuts, txPool) => {
//     console.log('txPool: %s', JSON.stringify(txPool));
//     const myAddress = getPublicKey(privateKey);
//
//     const myUnspentTxOutsA = unspentTxOuts.filter((uTxO) => uTxO.address === myAddress);
//
//     const myUnspentTxOuts = filterTxPoolTxs(myUnspentTxOutsA, txPool);
//
//     // filter from unspentOutputs such inputs that are referenced in pool
//
//     const {includedUnspentTxOuts, leftOverAmount} = findTxOutsForAmount(amount, myUnspentTxOuts);
//
//     const toUnsignedTxIn = (unspentTxOut) => {
//         const txIn = new TxIn();
//         txIn.txOutId = unspentTxOut.txOutId;
//         txIn.txOutIndex = unspentTxOut.txOutIndex;
//         return txIn;
//     };
//
//     const unsignedTxIns = includedUnspentTxOuts.map(toUnsignedTxIn);
//
//     const tx = new Transaction();
//     tx.txIns = unsignedTxIns;
//     tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);
//     tx.id = getTransactionId(tx);
//
//     tx.txIns = tx.txIns.map((txIn, index) => {
//         txIn.signature = signTxIn(tx, index, privateKey, unspentTxOuts);
//         return txIn;
//     });
//
//     return tx;
// };