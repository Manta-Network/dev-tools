const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring, decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex, BN } = require('@polkadot/util');
const fs = require('fs/promises');
const toml = require('toml');
const winston = require('winston');
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
    try {
        const api = await new ApiPromise({ provider: wsProvider });
        await api.isReady;
        return api;
    } catch (error) {
        let message = "Failed to create client due to: " + error;
        add_logger('error', message);
    }
}

// Create batch calls
function createBatchCalls(api, batch=[]) {
    let txs = []
    for (const reward of batch) {
        let address = reward['address'];
        if (isValidAddress(address)) {
            let to_issue = reward['total_reward'];
            let decimal = api.registry.chainDecimals;
            const factor = new BN(10).pow(new BN(decimal));
            const amount = new BN(to_issue).mul(factor);
            let tx = api.tx.balances.transfer(address, amount);
            txs.push(tx);
            logger.log({
                level: 'info',
                message: address + " is going to receive " + to_issue + " KMA."
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

async function parseBatchCallEvent(event) {

}

function add_logger(level, message) {
    logger.log({
        level,
        message
    });
}

async function checkAccountInfoAfterIssue(api, who, target) {
    let { data: { free: previousFree } } = await api.query.system.account(who);
    return target == previousFree;
}

async function readProjectConfiguration(configPath) {
    const content = await fs.readFile(configPath, { encoding: 'utf-8' })
    const config = toml.parse(content)
    return config;
}

async function main() {
    console.log("Data: ", jsonFile[0]['address']);
    console.log("Data: ", jsonFile[10]['rewards'] + jsonFile[10]['referrals_rewards']);
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
    let times = parseInt(lengthJson / batchSize);
    for (var i = 0; i <= times; ++i) {
        let start = i * batchSize;
        let end = i * batchSize + batchSize;
        if (end > lengthJson) {
            end = lengthJson;
        }
        let currentBatch = jsonFile.slice(start, end);

        const txs = createBatchCalls(api, currentBatch);
        const nonce = await api.rpc.system.accountNextIndex(sender.address);
        console.log("nonce: ", nonce.toNumber() + i);
        api.tx.utility.batch(txs).signAndSend(sender, { nonce: nonce.toNumber() + i }, ({ events = [], status }) => {
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
            } else if (status.isFinalized) {
                console.log('Finalized block hash', status.asFinalized.toHex());
                process.exit(0);
            }
        });
    }
}

main().catch(console.error);
