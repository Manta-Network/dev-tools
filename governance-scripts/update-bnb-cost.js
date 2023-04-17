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
    const newUnitsPerSec = "80590567679958737629347861126334";
    const bnbAssetId = 21;
    const updateUnitsSecTx = await api.tx.assetManager.setUnitsPerSecond(bnbAssetId, newUnitsPerSec);
    const encodedCallData = updateUnitsSecTx.method.toHex();
    await api.tx.democracy.notePreimage(encodedCallData).signAndSend(aliceKey, {nonce: -1});
    let encodedCallDataHash = blake2AsHex(encodedCallData);
    console.log("preimage_hash: ", encodedCallDataHash);
}

main().catch(console.error);
