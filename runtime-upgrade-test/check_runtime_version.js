const { ApiPromise, WsProvider } = require('@polkadot/api');
// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
  const wsProvider = new WsProvider(nodeAddress);
  const api = await new ApiPromise({ provider: wsProvider });
  await api.isReady;
  return api;
}
async function main() {
  
  let nodeAddress = "ws://127.0.0.1:9801";
  const args = require('minimist')(process.argv.slice(2))
  if (args.hasOwnProperty('address')) {
    nodeAddress = args['address'];
  }
  let old_spec_version; 
  if (args.hasOwnProperty('compare_to')) {
      old_spec_version = args['compare_to'];
  }
  
  if(old_spec_version) {
    const api = await createPromiseApi(nodeAddress);

    const runtime_version = await api.rpc.state.getRuntimeVersion();
    const spec_version = +runtime_version["specVersion"].words;

    if(spec_version > old_spec_version) {
      process.exit(1);
    }
  }

  process.exit(0);
}

main().catch(console.error);
