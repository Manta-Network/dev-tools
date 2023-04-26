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
    const nodeAddress = 'ws://127.0.0.1:9801';
    const api = await createPromiseApi(nodeAddress);
    const aliceKey = keyring.addFromMnemonic("bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice");

    const location = {
        parents: 1,
        interior: {
          X2: [
            {
              parachain: 2090
            },
            {
              generalIndex: 0
            }
          ]
        }
      };
    const metadata = { metadata: { name: "Basillisk", symbol: "BSX", decimals: 12, isFrozen: false }, minBalance: 1, isSufficient: true };
    const asset_id = await api.query.assetManager.nextAssetId();
    const unitsPerSec = "68493150684931506";

    const registerAssetTx = await api.tx.assetManager.registerAsset({V1: location}, metadata);
    const setUnitsPerSecTx = await api.tx.assetManager.setUnitsPerSecond(asset_id, unitsPerSec);
    const batchTx = await api.tx.utility.batch([registerAssetTx, setUnitsPerSecTx]);

    const encodedCallData = batchTx.method.toHex();
    await api.tx.democracy.notePreimage(encodedCallData).signAndSend(aliceKey, {nonce: -1});
    let encodedCallDataHash = blake2AsHex(encodedCallData);
    console.log("preimage_hash: ", encodedCallDataHash);
}

main().catch(console.error);
