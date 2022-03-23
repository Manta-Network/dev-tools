const { ApiPromise, WsProvider } = require('@polkadot/api');

// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
    const wsProvider = new WsProvider(nodeAddress);
    const api = await new ApiPromise({ 
        provider: wsProvider
    });
    await api.isReady;
    return api;
}

async function main() {
    let nodeAddress = "ws://127.0.0.1:9988";
    const args = require('minimist')(process.argv.slice(2))
    if (args.hasOwnProperty('address')) {
        nodeAddress = args['address'];
    }
    
    const api = await createPromiseApi(nodeAddress);

    let lastHeader = await api.rpc.chain.getFinalizedHead();
    console.log(lastHeader.hash.toHuman());
    process.exit(0);
}

main().catch(console.error);
