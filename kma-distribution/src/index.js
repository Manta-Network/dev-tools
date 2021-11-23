"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./interfaces/augment-api");
require("./interfaces/augment-types");
const api_1 = require("@polkadot/api");
const { Keyring, decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex, BN } = require('@polkadot/util');
const fs = require('fs/promises');
const toml = require('toml');
const winston = require('winston');
// const jsonFile = require('../token-distribution-list.json');
const jsonFile = require('../rewards_kma.json');
const MIN_DEPOSIT = 1;
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'token-distribution' },
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});
async function readProjectConfiguration(configPath) {
    const content = await fs.readFile(configPath, { encoding: 'utf-8' });
    const config = toml.parse(content);
    return config;
}
// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
    const wsProvider = new api_1.WsProvider(nodeAddress);
    try {
        const api = await new api_1.ApiPromise({
            provider: wsProvider,
            types: {
                "Address": "MultiAddress",
                "LookupSource": "MultiAddress",
                "BalanceOf": "Balance",
                "Balance": "u128"
            }
        });
        await api.isReady;
        return api;
    }
    catch (error) {
        let message = "Failed to create client due to: " + error;
        logger.log({
            level: 'error',
            message: message
        });
    }
}
// Ensure address is valid.
function isValidAddress(address) {
    try {
        encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
        return true;
    }
    catch (error) {
        return false;
    }
}
// Create batch calls
function createBatchCalls(api, start, end, batch = []) {
    let txs = [];
    for (const reward of batch) {
        let address = reward['address'];
        if (isValidAddress(address)) {
            let to_issue = parseFloat(reward['total_reward']);
            if (to_issue < MIN_DEPOSIT) {
                logger.log({
                    level: 'error',
                    message: address + "'s total_reward is less than " + to_issue + " KMA."
                });
            }
            let decimal = api.registry.chainDecimals;
            const factor = new BN(10).pow(new BN(decimal));
            const amount = new BN(to_issue).mul(factor);
            let tx = api.tx.calamariVesting.vestedTransfer(address, amount);
            txs.push(tx);
            logger.log({
                level: 'info',
                message: address + " is going to receive " + to_issue + " KMA."
            });
        }
        else {
            logger.log({
                level: 'error',
                message: address + " is invalid address who is not going to receive KMA tokens."
            });
        }
    }
    // Push a remark tx to current bacth
    let batch_remark = "Current batch starts from " + start + " to " + end;
    let remark_tx = api.tx.system.remark(batch_remark);
    txs.push(remark_tx);
    return txs;
}
function parseVestingEvent(events = []) {
}
async function checkBalanceAfterSendVesting(api, batch = []) {
    for (const reward of batch) {
        let address = reward['address'];
        if (isValidAddress(address)) {
            let to_issue = parseInt(reward['total_reward']);
            if (to_issue < MIN_DEPOSIT) {
                logger.log({
                    level: 'error',
                    message: address + "'s total_reward is less than " + to_issue + " KMA."
                });
            }
            let decimal = api.registry.chainDecimals;
            const factor = new BN(10).pow(new BN(decimal));
            const amount = new BN(to_issue).mul(factor);
            let { data: { free: onchainBalance } } = await api.query.system.account(address);
            const currentFree = new BN(onchainBalance);
            // console.log("current free: ", currentFree);
            if (!currentFree.eq(amount)) {
                // if (currentFree !== amount) {
                logger.log({
                    level: 'error',
                    message: address + "'s total_reward is not equal to onchain balance,  to_issue: " + amount + ", onchain balance: " + currentFree + "."
                });
            }
        }
        else {
            logger.log({
                level: 'error',
                message: address + " is invalid address who doesn't have KMA tokens."
            });
        }
    }
}
async function main() {
    console.log("address: ", jsonFile[0]['address']);
    console.log("total_reward: ", jsonFile[9]['total_reward']);
    let valid = 'FiUWDC3eUDp5JevJHPTvP8uMAp4oRb6m8iFjxDRC5e3Cegr';
    let invalid = 'FiUWDC3eUDp5JevJHPTvP8uMAp4oRb6m8iFjxDRC5e3Ceg';
    console.log(isValidAddress(valid));
    console.log(isValidAddress(invalid));
    let configPath = "configuration.toml";
    let config = await readProjectConfiguration(configPath);
    const nodeAddress = config['node']['endpoint'];
    const api = await createPromiseApi(nodeAddress);
    let seed = config['node']['signer'];
    const keyring = new Keyring({ type: 'sr25519' });
    const sender = keyring.addFromUri(seed);
    let lengthJson = jsonFile.length;
    let batchSize = config['node']['batch_size'];
    let times = Math.floor(lengthJson / batchSize);
    const nonce = await api.rpc.system.accountNextIndex(sender.address);
    let sum = 0.0;
    for (const reward of jsonFile) {
        sum += parseFloat(reward['total_reward']);
    }
    console.log("sum: ", 2 !== 2);
    console.log("sum: ", sum);
    // await checkBalanceAfterSendVesting(api, jsonFile);
    for (var i = 0; i < times; ++i) {
        logger.log({
            level: 'info',
            message: "--------------------------------------------------------------------------------------------"
        });
        let start = i * batchSize;
        let end = i * batchSize + batchSize;
        if (end > lengthJson) {
            end = lengthJson;
        }
        let currentBatch = jsonFile.slice(start, end);
        // add log to tell which batch is started
        logger.log({
            level: 'info',
            message: "this batch is started from " + start + "(" + jsonFile[start]['address'] + ")" + " to " + end + "(" + jsonFile[end]['address'] + ")"
        });
        const txs = createBatchCalls(api, start, end, currentBatch);
        console.log("current nonce: ", nonce.toHuman());
        let next_nonce = parseInt(nonce.toHuman()) + i;
        console.log("next nonce: ", next_nonce);
        const isFinished = await api.tx.utility.batch(txs).signAndSend(sender, { nonce: next_nonce }, ({ events = [], status }) => {
            console.log('Transaction status:', status.type);
            if (status.isInBlock) {
                console.log('Included at block hash', status.asInBlock.toHex());
                console.log('Events:');
                events.forEach(({ event: { data, method, section }, phase }) => {
                    console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
                });
                console.log(`included in ${status.asInBlock}`);
                logger.log({
                    level: 'info',
                    message: `included in ${status.asInBlock}`
                });
            }
            else if (status.isFinalized) {
                let block_hash = status.asFinalized.toHex();
                console.log('Finalized block hash', block_hash);
                // return block_hash;
                // isFinished();
                // process.exit(0);
            }
            // Ensure all txs in a batch are submitted successfully.
            // Parse event, check balances storage.
            // checkBalanceAfterSendVesting(api, currentBatch);
        });
        console.log("isFinished: ", isFinished);
        // Promise.resolve(isFinished).then((res) => {
        //     console.log("resovel promise with hash: ", res);
        // });
    }
}
main().catch(console.error);
// export default function getFailedExtrinsicError(events, api) {
//     let errorMessage = null;
//     events
//       .filter(
//         ({ event }) =>
//           api.events.system.ExtrinsicFailed.is(event) ||
//           api.events.utility.BatchInterrupted.is(event)
//       )
//       .forEach(
//         ({
//           event: {
//             data: [error, info],
//           },
//         }) => {
//           if (error.isModule) {
//             // for module errors, we have the section indexed, lookup
//             const decoded = api.registry.findMetaError(error.asModule);
//             const { documentation = [], method, section } = decoded;
//             errorMessage = `${section}.${method}: ${documentation.join(' ')}`;
//           } else {
//             // Other, CannotLookup, BadOrigin, no extra info
//             errorMessage = error.toString();
//           }
//         }
//       );
//     return errorMessage;
//   }
// export function makeTxResHandler(
//     api,
//     onSuccess = () => null,
//     onFailure = () => null,
//     onUpdate = () => null
//   ) {
//     return ({ status, events }) => {
//       let error;
//       if (status.isInBlock || status.isFinalized) {
//         error = getFailedExtrinsicError(events, api);
//       }
//       if (status.isInBlock && error) {
//         onFailure();
//       } else if (status.isFinalized && error) {
//         onFailure();
//       } else if (status.isFinalized) {
//         onSuccess();
//       } else {
//         onUpdate();
//       }
//     };
//   }
// const onPrivateTransferSuccess = async (block) => {
//     console.log('you can do the next batch here')
//   };
//   const onPrivateTransferFailure = (block, error) => {
//      console.log('bacth failed')
//   };
//   const onPrivateTransferUpdate = (message) => {
//     console.log("I don't think you need to do anything here")
//   };
// const txResHandler = makeTxResHandler(
//     api,
//     onPrivateTransferSuccess,
//     onPrivateTransferFailure,
//     onPrivateTransferUpdate
//   );
//   api.tx.utility
//     .batch(transactions)
//     .signAndSend(currentExternalAccount, txResHandler);
