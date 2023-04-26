const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { blake2AsHex } = require("@polkadot/util-crypto");
const { XcmVersionedMultiLocation } = require("@polkadot/types/lookup");

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

    const xcmFee = "1000000000000";
    const transactWeight = "3000000000";
    const transact = "0x3c002a080000e803000000900100";
    const calamariSovereignAddress = "0x7061726124080000000000000000000000000000000000000000000000000000";

    const withdrawAssetInstruction = api.createType("XcmV2Instruction", {
      withdrawAsset: api.createType("XcmV1MultiassetMultiAssets", [{
          id: api.createType("XcmV1MultiassetAssetId", {
              concrete: api.createType("XcmV1MultiLocation", {
                  parents: 0,
                  interior: api.createType("XcmV1MultilocationJunctions", {
                      here: true
                  })
              })
          }),
          fun: api.createType("XcmV1MultiassetFungibility", {
              fungible: xcmFee
          })
      }])
    });
    const buyExecutionInstruction = api.createType("XcmV2Instruction", {
        buyExecution: {
            fees: api.createType("XcmV1MultiAsset", {
                id: api.createType("XcmV1MultiassetAssetId", {
                    concrete: api.createType("XcmV1MultiLocation", {
                        parents: 0,
                        interior: api.createType("XcmV1MultilocationJunctions", {
                            here: true,
                        }),
                    }),
                }),
                fun: api.createType("XcmV1MultiassetFungibility", {
                    fungible: xcmFee
                })
            }),
            weightLimit: api.createType("XcmV2WeightLimit", {
                unlimited: true,
            }),
        },
    });
    const transactInstruction = api.createType("XcmV2Instruction", {
        transact: {
            originType: api.createType("XcmV0OriginKind", { native: true }),
            requireWeightAtMost: transactWeight,
            call: api.createType("XcmDoubleEncoded", {
                encoded: transact,
            }),
        },
    });
    const refundSurplusInstruction = api.createType("XcmV2Instruction", {
        refundSurplus: true,
    });
    const depositAssetsInstruction = api.createType("XcmV2Instruction", {
        depositAsset: {
            assets: api.createType("XcmV1MultiassetMultiAssetFilter", { wild: true }),
            maxAssets: 1,
            beneficiary: api.createType("XcmV1MultiLocation", {
                parents: 0,
                interior: api.createType("XcmV1MultilocationJunctions", {
                    x1: api.createType("XcmV1Junction", {
                        accountId32: {
                            network: api.createType("XcmV0JunctionNetworkId", { any: true }),
                            id: calamariSovereignAddress,
                        },
                    }),
                }),
            }),
        },
    });

    const xcmV2 = api.createType("XcmV2Xcm", [
        withdrawAssetInstruction,
        buyExecutionInstruction,
        transactInstruction,
        refundSurplusInstruction,
        depositAssetsInstruction,
    ]);
    const message = api.createType("XcmVersionedXcm", {
        v2: xcmV2,
    });

    const dest = {
      "V1": {
        "parents": 1,
        "interior": {
          "Here": null
        }
      }
    };

    const sendXcmTx = await api.tx.polkadotXcm.send(dest, message);
    console.log(sendXcmTx);
    const encodedCallData = sendXcmTx.method.toHex();
    await api.tx.democracy.notePreimage(encodedCallData).signAndSend(aliceKey, {nonce: -1});
    let encodedCallDataHash = blake2AsHex(encodedCallData);
    console.log("preimage_hash: ", encodedCallDataHash);
}

main().catch(console.error);
