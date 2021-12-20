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
  let old_spec_version; 
  if (args.hasOwnProperty('compare_to')) {
    old_spec_version = args['compare_to'];
    console.log("Using passed parameter compare_to: " + old_spec_version);
  }
  
  if(old_spec_version) {
    const api = await createPromiseApi(nodeAddress);

    const runtime_version = await api.rpc.state.getRuntimeVersion();
    const spec_version = +runtime_version["specVersion"].words;

    if(spec_version > old_spec_version) {
      console.log("Spec version is successfully bumped to " + spec_version);
      process.exit(1);
    }
  }

  console.log("Spec version was not bumped!");
  process.exit(0);
}

main().catch(console.error);
