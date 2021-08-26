const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

const keyring = new Keyring({ type: 'sr25519' });

const fs = require('fs');

// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
    const wsProvider = new WsProvider(nodeAddress);
    const api = await new ApiPromise({ provider: wsProvider });
    await api.isReady;
    return api;
}

async function main() {
    const nodeAddress = 'ws://127.0.0.1:9801';
    const api = await createPromiseApi(nodeAddress);

    // Retrieve the upgrade key from the chain state
    const adminId = await api.query.sudo.key();

    // Some mnemonic phrase
    const PHRASE = fs.readFileSync('root_mnemonics').toString();

    // Add an account, straight mnemonic
    const newPair = keyring.addFromUri(PHRASE);

    // Retrieve the runtime to upgrade
    const code = fs.readFileSync('calamari.wasm').toString('hex');
    const proposal = api.tx.system && api.tx.system.setCode
        ? api.tx.system.setCode(`0x${code}`) // For newer versions of Substrate
        : api.tx.consensus.setCode(`0x${code}`); // For previous versions

    console.log(`Upgrading from ${adminId}, ${code.length / 2} bytes`);

    // Perform the actual chain upgrade via the sudo module
    api.tx.sudo.sudoUncheckedWeight(proposal, 1)
    .signAndSend(newPair, ({ events = [], status }) => {
    console.log('Proposal status:', status.type);

    if (status.isInBlock) {
      console.error('You have just upgraded your chain');

      console.log('Included at block hash', status.asInBlock.toHex());
      console.log('Events:');

      console.log(JSON.stringify(events, null, 2));
      events.toHuman();
    } else if (status.isFinalized) {
      console.log('Finalized block hash', status.asFinalized.toHex());
    }
  });
}

main().catch(console.error);
