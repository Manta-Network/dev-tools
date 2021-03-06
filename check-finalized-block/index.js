const { ApiPromise, WsProvider } = require('@polkadot/api');
// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
  const wsProvider = new WsProvider(nodeAddress);
  const api = await new ApiPromise({ provider: wsProvider });
  await api.isReady;
  return api;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  
  let paraAddress = "ws://127.0.0.1:9944";
  const args = require('minimist')(process.argv.slice(2))
  if (args.hasOwnProperty('para_address')) {
    paraAddress = args['para_address'];
    console.log("Using passed parameter para_address: " + paraAddress);
  }

  let relayAddress = "ws://127.0.0.1:9945";
  if (args.hasOwnProperty('relay_address')) {
    relayAddress = args['relay_address'];
    console.log("Using passed parameter relay_address: " + relayAddress);
  }

  let targetBlockNum; 
  if (args.hasOwnProperty('target_block')) {
    targetBlockNum = args['target_block'];
    console.log("Using passed parameter target_block: " + targetBlockNum);
  }
  
  if(targetBlockNum) {
    const paraApi = await createPromiseApi(paraAddress);
    const relayApi = await createPromiseApi(relayAddress);
    let time = 20 * 60;

    while (time > 0) {
      const paraHeader = await paraApi.rpc.chain.getHeader();
      const paraBlockNum = paraHeader.number.toNumber();

      const relayHeader = await relayApi.rpc.chain.getHeader();
      const relayBlockNum = relayHeader.number.toNumber();

      if(paraBlockNum >= targetBlockNum && relayBlockNum >= targetBlockNum) {
        console.log("Successfully finalized para block number " + paraBlockNum);
        console.log("Successfully finalized relay block number " + relayBlockNum);
        process.exit(0);
      }
      time-=5;
      await delay(1000 * 5)
    }
   
    
    console.log("Failed to finalize the target block number " + targetBlockNum);
    process.exit(1);
  }

  console.log("target_block was not provided!");
  process.exit(1);
}

main().catch(console.error);
