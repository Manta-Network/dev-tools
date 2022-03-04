import { createPromiseApi } from './utils';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Metadata } from '@polkadot/types';
import { assert } from 'console';

/*
transaction_version: The version of the extrinsics interface. 
This number must be updated in the following circumstances: 
extrinsic parameters (number, order, or types) have been changed; 
extrinsics or pallets have been removed; 
or the pallet order in the construct_runtime! macro or extrinsic order in 
a pallet has been changed. If this number is updated, 
then the spec_version must also be updated
*/

async function getMetadata(api: ApiPromise) {
    const metadata = await api.rpc.state.getMetadata();
    return metadata
}

function diffMetadata(oldMetadata: Metadata, newMetadata: Metadata) {
    // check magic number, this magic number is hardcoded as `meta`(1635018093),
    // not like the msgic number in wasm `asm`.
    assert(oldMetadata.magicNumber.toString() === "meta");
    assert(newMetadata.magicNumber.toString() === "meta");
    const magicNumber = oldMetadata.magicNumber.toString() === newMetadata.magicNumber.toString();
    console.log("Checking magic number: ", magicNumber);

    // check metadata version, currently this version is V14.
    console.log("Old metadata version: ", oldMetadata.version);
    console.log("New metadata version: ", newMetadata.version);

    if (oldMetadata.version !== newMetadata.version) {
        console.log("Both metadata's version is not equal");
        return;
    }

    // check pallet order, it must stay as previous.
    const oldV14 = oldMetadata.asV14;
    const newV14 = newMetadata.asV14;

    console.log(`There're ${oldV14.pallets.length} pallets in old metadata`);
    console.log(`There're ${newV14.pallets.length} pallets in new metadata`);

    if (oldV14.pallets.length !== newV14.pallets.length) {
        console.log("Seems there're pallets added or removed.");
    }

    // pallet name and index
    for (let i = 0; i < oldV14.pallets.length; ++i) {
        const pallet = oldV14.pallets[i];
        const pallet_name = pallet.name;
        const pallet_index = pallet.index;

        let found = false;
        for (const p of newV14.pallets) {
            if (p.name === pallet_name && p.index === pallet_index) {
                found = true;
                break;
            }
        }

        if (!found) {
            console.log(
                `This pallet ${pallet_name} has been renamed or removed,
                or the index ${pallet_index} has been updated.
                Please bump transaction_version.`
            );
        }
    }

    // compare pallet order
    const oldPallets = oldV14.pallets;
    const newPallets = newV14.pallets;

    // any pallet removed

    // whether extrinsic parameters (number, order, or types) have been changed
}

async function main() {
    const node = "ws://127.0.0.1:9988";
    const api = await createPromiseApi(node);

    const metadata = await api.rpc.state.getMetadata();
    console.log(metadata.toHuman());
}

main().catch(console.error);
