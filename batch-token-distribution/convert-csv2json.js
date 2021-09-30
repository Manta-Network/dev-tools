const csvtojsonV2 = require("csvtojson");
const { ApiPromise, WsProvider } = require('@polkadot/api');
const fs = require('fs');
const { blake2AsHex, xxhashAsHex } = require('@polkadot/util-crypto');
const { crowdloan } = require('@polkadot/api-derive')

// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
    const wsProvider = new WsProvider(nodeAddress);
    try {
        const api = await new ApiPromise({ provider: wsProvider });
        await api.isReady;
        return api;
    } catch (error) {
        let message = "Failed to create client due to: " + error;
        add_logger('error', message);
    }
}

async function convertCSVToJson(csvPath, jsonPath) {
    const jsonArray = await csvtojsonV2().fromFile(csvPath);
    console.log("length: ", jsonArray.length);
    writeJsonToFile(jsonArray, jsonPath);
}

function writeJsonToFile(jsonArray, fileName) {
    const jsonString = JSON.stringify(jsonArray);
    fs.writeFile(fileName, jsonString, err => {
        if (err) {
          console.log('Error writing file', err);
        } else {
          console.log('Successfully wrote file');
        }
    });
}

// Crowdloan is saved as child trie, so the only way to get each contributor's info 
// is to create a childKey
// pe: https://github.com/polkadot-js/api/pull/3704/files
// crowdloan related code: https://github.com/paritytech/polkadot/blob/master/runtime/common/src/crowdloan.rs#L703-L723
async function checkUserContribution(api, address, target) {

}

async function main() {
    let csvPath = "/home/jamie/Downloads/rewards_kma.csv";
    let jsonPath = "/home/jamie/Downloads/rewards_kma.json";
    // let jsonArray = await convertCSVToJson(csvPath, jsonPath);
    let hash = blake2AsHex('crowdloan27', 256);
    console.log(hash);
    crowdloan.childKey;
}

main().catch(console.error);