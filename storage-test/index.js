const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { waitReady } = require('@polkadot/wasm-crypto');
const { u8aToHex } = require('@polkadot/util');


const URL = process.env.WS_ENDPOINT;
const key = '0xa66d1aecfdbd14d785a4d1d8723b4beba97ed1f827296bb679b464ff1290ddc1000100000000000000';
//const key = '0xa66d1aecfdbd14d785a4d1d8723b4bebb6cfced5b427b05359bd1b81d317bd660000000000000000000000000000000000000000000000000000000000000000';

const types = {
    voidNumberSet: 'Vec<u8>'
};


(async () => {
    await waitReady();
    const provider = new WsProvider(URL);
    const api = await ApiPromise.create({provider, types});
    await api.isReady;

    console.log(`INFO: connected to ${URL}`);

    const keyring = new Keyring({ type: 'sr25519' });
    const sudoSigner = keyring.addFromUri('//Alice');

    const set = Array.apply(null, Array(32)).map( (i, j) => j );
    const voidSet = api.createType('voidNumberSet', set);
    console.log(`TJDEBUG: ${u8aToHex(voidSet.toU8a())}`);


    //const sh = api.query.mantaPay.shards;
    //console.log(`INFOZE: ${Object.keys(api)}`);
    let set_storage_tx = api.tx.system.setStorage([
        //[key, u8aToHex(voidSet.toU8a())]
        [key, '0x83590b405cf760cb1660fc295f7810d428fb27d946f2bba38cb9ca5b7d4ed643c5e56ae65158f96c93573210b6a0f36eadf01166b77dbe49247947f669daa1225e11b47dd076bf70568bd8d9ceb93a90e49ba1ce0a651f2a0107364da1d2f018776494b592a8eb26b8af06fb56e681e3efadd4d23f12eedac960fdeb455f66fbeb0967bf']
    ]);


    api.tx.sudo.sudoUncheckedWeight(set_storage_tx, 1).signAndSend(sudoSigner, ({events, status}) => {
        console.log(`INFO: status ${status.type}`);

        if (status.isInBlock) {
            console.log(`INFO: included in block ${status.asInBlock.toHex()}`);
        } else if (status.isFinalized) {
            console.log(`INFO: finalized ${status.asFinalized.toHex()}`);
        } else {
            console.log("Something else");
        }
    });
})();
