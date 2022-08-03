const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const fs_promises = require('fs/promises');
const fs = require('fs');
const toml = require('toml');
const jsonFile = require('./contributors');

// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
    const wsProvider = new WsProvider(nodeAddress);
    try {
        const api = await new ApiPromise({ provider: wsProvider });
        await api.isReady;
        return api;
    } catch (error) {
        let message = "Failed to create client due to: " + error;
        console.log(message);
    }
}

function createBatchCalls(api, batch=[], para_id) {
    let txs = []
    for (const contributor of batch) {
        let address = contributor['address'];
        let tx = api.tx.crowdloan.withdraw(address, para_id);
        txs.push(tx);
    }

    return txs;
}


async function queryBalances(api, batch=[]) {
    let balances = []
    for (const contributor of batch) {
        let address = contributor['address'];
        let { data: { free: free } } = await api.query.system.account(address);
        balances.push(free);
    }

    return balances;
}

async function readProjectConfiguration(configPath) {
    const content = await fs_promises.readFile(configPath, null, { encoding: 'utf-8' })
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

    let balancesBefore = queryBalances(api, jsonFile);

    let lengthJson = jsonFile.length;
    let batchSize = config['node']['batch_size'];
    let iterations = parseInt(lengthJson / batchSize);
    console.log("Broadcasting " + iterations + " batches of size: " + batchSize);
    const nonce = await api.rpc.system.accountNextIndex(sender.address);
    let finalizedTxCounter = 0;
    for (var i = 0; i <= iterations; ++i) {
        let start = i * batchSize;
        let end = start + batchSize;
        if (end > lengthJson) {
            end = lengthJson;
        }

        let currentBatch = jsonFile.slice(start, end);
        const txs = createBatchCalls(api, currentBatch, config['node']['para_id']);

        let nextNonce = parseInt(nonce.toHuman()) + i;
        console.log("Next nonce: ", nextNonce);
        api.tx.utility.forceBatch(txs).signAndSend(sender, { nonce: nextNonce }, ({ events = [], status }) => {
            console.log('Transaction status:', status.type);

            if (status.isFinalized) {
                console.log('Finalized block hash', status.asFinalized.toHex());
                console.log('Finalized force_batch Txs Counter:', finalizedTxCounter);
                finalizedTxCounter++;
                if(finalizedTxCounter == iterations) {
                    let balancesAfter = queryBalances(api, jsonFile);
                    let unchanged = [];
                    for (var addressIndex = 0; addressIndex < jsonFile.length; ++addressIndex) {
                        if(balancesBefore[addressIndex] == balancesAfter[addressIndex]) {
                            unchanged.push(jsonFile[addressIndex]['address']);
                        }
                    }
                    fs.writeFileSync("./unchanged_contributors.json", JSON.stringify(unchanged));
                    process.exit(0);
                }
            }
        });
    }
}

main().catch(console.error);
