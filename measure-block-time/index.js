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
    // const nodeAddress = 'wss://rpc.polkadot.io';
    const nodeAddress = 'ws://127.0.0.1:9944';
    
    const api = await createPromiseApi(nodeAddress);

    let count = 0;
    let all_block_time = 0;
    const unsub = await api.rpc.chain.subscribeNewHeads(async (lastHeader) => {  
        const lastBlockNum = lastHeader.number.toNumber();
        const momentCurrent = await api.query.timestamp.now.at(lastHeader.hash);
        const momentPrev = await api.query.timestamp.now.at(lastHeader.parentHash);
        const blockTime = momentCurrent - momentPrev;
        const block_author = await api.derive.chain.getHeader(lastHeader.hash);
        console.log("author: ", block_author.author.toHuman(), "#", lastBlockNum - 1, "-> #",lastBlockNum, ", block time: ", blockTime);
        
        all_block_time += blockTime;
        count += 1;
        console.log("average block time: ", all_block_time / count);
    });
}

main().catch(console.error);
