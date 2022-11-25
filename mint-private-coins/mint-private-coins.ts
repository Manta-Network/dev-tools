import { ApiPromise, WsProvider } from "@polkadot/api";
import { readFile } from "fs/promises";

async function createPromiseApi(nodeAddress: any) {
    const wsProvider = new WsProvider(nodeAddress);
    const api = await new ApiPromise({ 
        provider: wsProvider
    });
    await api.isReady;
    return api;
}

async function main() {
    let nodeAddress = "wss://c1.calamari.moonsea.systems";
    let precomputedMintsFile = "./precomputed_mints_v3";
    const api = await createPromiseApi(nodeAddress);

    const full_content = await readFile(precomputedMintsFile);
    const mints_offset = 2;
    const mints_content = full_content.subarray(mints_offset);
    let total_iterations = 5000;
    let mint_size = 552;
    let mint_transactions = [];
    for(let iter = 0; iter < total_iterations; ++iter){
        const mint = await api.tx.mantaPay.toPrivate(mints_content.subarray(mint_size * iter, mint_size * (iter + 1)));
        mint_transactions.push(mint);
    }

    console.log("Use the mint transactions...");
}

main().catch(console.error);
