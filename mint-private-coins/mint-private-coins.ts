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
    const api = await createPromiseApi(nodeAddress);

    let total_iterations = 10;

    let precomputedMintsFile = "./precomputed_mints_v3";
    const full_content = await readFile(precomputedMintsFile);
    const mints_offset = 1;
    const mints_content = full_content.subarray(mints_offset);
    let mint_size = 552;
    let mint_transactions = [];
    for(let iter = 0; iter < total_iterations; ++iter){
        const mint = await api.tx.mantaPay.toPrivate(mints_content.subarray(mint_size * iter, mint_size * (iter + 1)));
        mint_transactions.push(mint);
    }

    console.log("Use the mint transactions...");

    let precomputed_transfers_file = "./precomputed_transfers_v3";
    const transfers_full_content = await readFile(precomputed_transfers_file);
    const transfers_offset = 1;
    const transfers_content = transfers_full_content.subarray(transfers_offset);
    let transfer_size = 1290;
    let transfers_batch_transactions = [];
    for(let iter = 0; iter < total_iterations; ++iter){
        let transfers_start = iter * (2 * mint_size + transfer_size);
        const transfer_mint_1 = await api.tx.mantaPay.toPrivate(transfers_content.subarray(transfers_start, transfers_start + mint_size));
        const transfer_mint_2 = await api.tx.mantaPay.toPrivate(transfers_content.subarray(transfers_start + mint_size, transfers_start + 2 * mint_size));
        const transfer = await api.tx.mantaPay.privateTransfer(transfers_content.subarray(transfers_start + 2 * mint_size, transfers_start + 2 * mint_size + transfer_size));
        
        const batch = await api.tx.utility.forceBatch([transfer_mint_1, transfer_mint_2, transfer]);

        transfers_batch_transactions.push(batch);
    }

    console.log("Use the transfers batch transactions...");
}

main().catch(console.error);
