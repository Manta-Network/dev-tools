import { ApiPromise, WsProvider } from '@polkadot/api';
import * as fs from 'fs';

async function createPromiseApi(nodeAddress: string) {
    const wsProvider = new WsProvider(nodeAddress);
    const api = new ApiPromise({ provider: wsProvider });
    await api.isReady;
    return api;
}

function readConfiguration(configPath: string) {
    const content = fs.readFileSync(configPath, { encoding: 'utf-8' })
    const config = JSON.parse(content)
    return config;
}

function saveReceiversToJsonFile(filePath: string, content: Object) {
    const json = JSON.stringify(content);
    fs.writeFileSync(filePath, json, 'utf8');
}

function readReceiversFromJsonFile(filePath: string) {
    const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
    const config = JSON.parse(content)
    return config;
}

export { 
    createPromiseApi,
    readConfiguration,
    saveReceiversToJsonFile,
    readReceiversFromJsonFile
};
