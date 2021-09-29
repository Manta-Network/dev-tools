const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring, decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
const { levels } = require('logform');
const winston = require('winston');
const BigNumber = require('bignumber.js');
const jsonFile = require('./token-distribution-list.json');

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

// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
    const wsProvider = new WsProvider(nodeAddress);
    const api = await new ApiPromise({ provider: wsProvider });
    await api.isReady;
    return api;
}

// Create batch calls
function createBatchCalls(api, batch=[]) {
    let txs = []
    for (const reward of batch) {
        console.log(reward);
        let address = reward['address'];
        if (isValidAddress(address)) {
            let sum = reward['rewards'] + reward['referrals_rewards'];
            // let big_num_sum = new BigNumber(sum);
            // let r = new BigNumber(10);
            // let tx = api.tx.balances.transfer(address, big_num_sum * r.pow(12));
            console.log(typeof sum);
            let tx = api.tx.balances.transfer(address, 100);
            txs.push(tx);
            logger.log({
                level: 'info',
                message: address + " is going to receive " + sum + "KMA."
            });
        } else {
            logger.log({
                level: 'error',
                message: address + " is invalid address who is not going to receive KMA tokens."
            });
        }
    }

    return txs;
}

// Ensure address is valid.
function isValidAddress(address) {
    try {
        encodeAddress(isHex(address) ? hexToU8a(address): decodeAddress(address));
        return true;  
    } catch (error) {
        return false;
    }
}

async function verifyBatchCalls(api) {

}

async function main() {
    // let path = "token-distribution-list.json";
    // let data = readTokenList(path);
    console.log("Data: ", jsonFile[0]['address']);
    console.log("Data: ", jsonFile[10]['rewards'] + jsonFile[10]['referrals_rewards']);
    let valid = 'FiUWDC3eUDp5JevJHPTvP8uMAp4oRb6m8iFjxDRC5e3Cegr';
    let invalid = 'FiUWDC3eUDp5JevJHPTvP8uMAp4oRb6m8iFjxDRC5e3Ceg';
    console.log(isValidAddress(valid));
    console.log(isValidAddress(invalid));
    // const nodeAddress = 'wss://rpc.polkadot.io';
    const nodeAddress = 'ws://127.0.0.1:9944';
    const api = await createPromiseApi(nodeAddress);

    let seed = '//Alice';
    const keyring = new Keyring({ type: 'sr25519' });
    const sender = keyring.addFromUri(seed);

    const txs = createBatchCalls(api, jsonFile);

    api.tx.utility
        .batch(txs)
        .signAndSend(sender, ({ status }) => {
            if (status.isInBlock) {
                // if (status.isInBlock || status.isFinalized) {
                console.log(`included in ${status.asInBlock}`);
                logger.log({
                    level: 'info',
                    message: `included in ${status.asInBlock}`
                });
            }
        });
}

main().catch(console.error);
