const { ApiPromise, WsProvider } = require('@polkadot/api');
// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
  const wsProvider = new WsProvider(nodeAddress);
  const api = await new ApiPromise({ provider: wsProvider });
  await api.isReady;
  return api;
}
async function main() {
  
  let nodeAddress = "ws://127.0.0.1:9999";
  const args = require('minimist')(process.argv.slice(2))
  if (args.hasOwnProperty('address')) {
    nodeAddress = args['address'];
    console.log("Using passed parameter address: " + nodeAddress);
  }
  let targetBlockNum; 
  if (args.hasOwnProperty('target_block')) {
    targetBlockNum = args['target_block'];
    console.log("Using passed parameter target_block: " + targetBlockNum);
  }
  
  if(targetBlockNum) {
    const api = await createPromiseApi(nodeAddress);

    const header = await api.rpc.chain.getHeader();
    const blockNum = header.number.toNumber();
    if(blockNum >= targetBlockNum) {
      console.log("Successfully finalized block number " + blockNum);
      process.exit(0);
    }
    console.log("Failed to finalize the target block number " + targetBlockNum);
    process.exit(1);
  }

  console.log("target_block was not provided!");
  process.exit(1);
}

main().catch(console.error);
