const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring, decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex, BN } = require('@polkadot/util');
const fs = require('fs/promises');
const toml = require('toml');

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

async function readProjectConfiguration(configPath) {
    const content = await fs.readFile(configPath, { encoding: 'utf-8' })
    const config = toml.parse(content)
    return config;
}

async function main() {
    let configPath = "configuration.toml";
    let config = await readProjectConfiguration(configPath);

    const nodeAddress = config['node']['endpoint'];
    const api = await createPromiseApi(nodeAddress);

    let seed = config['node']['signer'];
    const keyring = new Keyring({ type: 'sr25519' });
    const sender = keyring.addFromUri(seed);

    let vesting_amount = 10000;
    let decimal = api.registry.chainDecimals;
    const factor = new BN(10).pow(new BN(decimal));
    const locked = new BN(vesting_amount).mul(factor);
    const perBlock = new BN(10).mul(factor);
    const startingBlock = 1000;

    let schedule = {
        "locked":locked,
        "perBlock":perBlock,
        "startingBlock":startingBlock
    };

    let target = "5GKKAvzxAd8ou3KU3qoCGvVUKR7oPmJVK16Babr5yg2iQ3VM";
    api.tx.vesting.vestedTransfer(target, schedule).signAndSend(sender, ({ events = [], status }) => {
        console.log('Transaction status:', status.type);

        if (status.isInBlock) {
            console.log('Included at block hash', status.asInBlock.toHex());
            console.log('Events:');
            events.forEach(({ event: { data, method, section }, phase }) => {
                console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
            });
            console.log(`included in ${status.asInBlock}`);
        } else if (status.isFinalized) {
            console.log('Finalized block hash', status.asFinalized.toHex());
            process.exit(0);
        }
    });
}

main().catch(console.error);
