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
    const nodeAddress = 'ws://127.0.0.1:9806';
    const api = await createPromiseApi(nodeAddress);

    // Retrieve the upgrade key from the chain state
    const adminId = await api.query.sudo.key();

    // Some mnemonic phrase
    const PHRASE = fs.readFileSync('root_mnemonics').toString().trimEnd();

    // Add an account, straight mnemonic
    const newPair = keyring.addFromUri(PHRASE);

    // Retrieve the runtime to upgrade
    //const code = fs.readFileSync('calamari.wasm').toString('hex');
    const proposal =  api.tx.system.setStorage([
      [ `0xa66d1aecfdbd14d785a4d1d8723b4beba97ed1f827296bb679b464ff1290ddc1000500000000000000`,
        `0x83590b405cf760cb1660fc295f7810d428fb27d946f2bba38cb9ca5b7d4ed643c5e56ae65158f96c93573210b6a0f36eadf01166b77dbe49247947f669daa1225e11b47dd076bf70568bd8d9ceb93a90e49ba1ce0a651f2a0107364da1d2f018776494b592a8eb26b8af06fb56e681e3efadd4d23f12eedac960fdeb455f66fbeb0967bf`]
    ]);

    //console.log(`Upgrading from ${adminId}, ${code.length / 2} bytes`);

    // Perform the actual chain upgrade via the sudo module
    api.tx.sudo.sudoUncheckedWeight(proposal, 1)
    .signAndSend(newPair, ({ events = [], status }) => {
    console.log('Proposal status:', status.type);

    if (status.isInBlock) {
      console.error('You have just upgraded your chain');

      console.log('Included at block hash', status.asInBlock.toHex());
      console.log('Events:');

      console.log(JSON.stringify(events, null, 2));
    } else if (status.isFinalized) {
      console.log('Finalized block hash', status.asFinalized.toHex());
    }
  });
}

main().catch(console.error);
