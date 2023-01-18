import pkg from 'manta.js';
const { MantaPrivateWallet, Environment, Network } = pkg;

// import { MantaPrivateWallet, Environment, Network } from 'manta.js';
// const { MantaPrivateWallet, Environment, Network } = require('manta.js');


async function main() {

    const privateWalletConfig = {
      environment: Environment.Production,
      network: Network.Calamari
    }

    const privateWallet = await MantaPrivateWallet.init(privateWalletConfig);
    await privateWallet.initalWalletSync();

}

main().catch(console.error);
