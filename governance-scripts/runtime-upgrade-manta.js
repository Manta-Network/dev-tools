const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { blake2AsHex } = require("@polkadot/util-crypto");

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
    const nodeAddress = 'wss://a1.calamari.systems';
    const api = await createPromiseApi(nodeAddress);
    const aliceKey = keyring.addFromMnemonic("bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice");
    const code = fs.readFileSync('manta.wasm').toString('hex');
    const authorizeUpgradeTx = await api.tx.parachainSystem.authorizeUpgrade(`0x${code}`);
    const encodedCallData = authorizeUpgradeTx.method.toHex();
    await api.tx.democracy.notePreimage(encodedCallData).signAndSend(aliceKey, {nonce: -1});
    let encodedCallDataHash = blake2AsHex(encodedCallData);
    console.log("preimage_hash: ", encodedCallDataHash);
}

main().catch(console.error);
