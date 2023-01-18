const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

const keyring = new Keyring({ type: 'sr25519' });

const fs = require('fs');

const { MantaPrivateWallet, Environment, Network } = require('manta.js');


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

    const privateWalletConfig = {
      environment: Environment.Production,
      network: Network.Calamari
    }

    const privateWallet = await MantaPrivateWallet.init(privateWalletConfig);
    await privateWallet.initalWalletSync();

    api.disconnect();
}

main().catch(console.error);
