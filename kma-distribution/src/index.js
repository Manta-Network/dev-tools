"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require("./interfaces/augment-api");
require("./interfaces/augment-types");
var api_1 = require("@polkadot/api");
var _a = require('@polkadot/keyring'), Keyring = _a.Keyring, decodeAddress = _a.decodeAddress, encodeAddress = _a.encodeAddress;
var _b = require('@polkadot/util'), hexToU8a = _b.hexToU8a, isHex = _b.isHex, BN = _b.BN;
var fs = require('fs/promises');
var toml = require('toml');
var winston = require('winston');
var jsonFile = require('../token-distribution-list.json');
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'token-distribution' },
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ]
});
function readProjectConfiguration(configPath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, config;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readFile(configPath, { encoding: 'utf-8' })];
                case 1:
                    content = _a.sent();
                    config = toml.parse(content);
                    return [2 /*return*/, config];
            }
        });
    });
}
// Create a promise API instance of the passed in node address.
function createPromiseApi(nodeAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var wsProvider, api, error_1, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    wsProvider = new api_1.WsProvider(nodeAddress);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, new api_1.ApiPromise({
                            provider: wsProvider,
                            types: {
                                "Address": "MultiAddress",
                                "LookupSource": "MultiAddress",
                                "BalanceOf": "Balance",
                                "Balance": "u128"
                            }
                        })];
                case 2:
                    api = _a.sent();
                    return [4 /*yield*/, api.isReady];
                case 3:
                    _a.sent();
                    return [2 /*return*/, api];
                case 4:
                    error_1 = _a.sent();
                    message = "Failed to create client due to: " + error_1;
                    logger.log({
                        level: 'error',
                        message: message
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Ensure address is valid.
function isValidAddress(address) {
    try {
        encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
        return true;
    }
    catch (error) {
        return false;
    }
}
// Create batch calls
function createBatchCalls(api, batch) {
    if (batch === void 0) { batch = []; }
    var txs = [];
    for (var _i = 0, batch_1 = batch; _i < batch_1.length; _i++) {
        var reward = batch_1[_i];
        var address = reward['address'];
        if (isValidAddress(address)) {
            var to_issue = reward['total_reward'];
            var decimal = api.registry.chainDecimals;
            var factor = new BN(10).pow(new BN(decimal));
            var amount = new BN(to_issue).mul(factor);
            var tx = api.tx.calamariVesting.vestedTransfer(address, amount);
            txs.push(tx);
            logger.log({
                level: 'info',
                message: address + " is going to receive " + to_issue + " KMA."
            });
        }
        else {
            logger.log({
                level: 'error',
                message: address + " is invalid address who is not going to receive KMA tokens."
            });
        }
    }
    return txs;
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var valid, invalid, configPath, config, nodeAddress, api, seed, keyring, sender, lengthJson, batchSize, times, i, start, end, currentBatch, txs, nonce, next_nonce;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("address: ", jsonFile[0]['address']);
                    console.log("total_reward: ", jsonFile[9]['total_reward']);
                    valid = 'FiUWDC3eUDp5JevJHPTvP8uMAp4oRb6m8iFjxDRC5e3Cegr';
                    invalid = 'FiUWDC3eUDp5JevJHPTvP8uMAp4oRb6m8iFjxDRC5e3Ceg';
                    console.log(isValidAddress(valid));
                    console.log(isValidAddress(invalid));
                    configPath = "configuration.toml";
                    return [4 /*yield*/, readProjectConfiguration(configPath)];
                case 1:
                    config = _a.sent();
                    nodeAddress = config['node']['endpoint'];
                    return [4 /*yield*/, createPromiseApi(nodeAddress)];
                case 2:
                    api = _a.sent();
                    seed = config['node']['signer'];
                    keyring = new Keyring({ type: 'sr25519' });
                    sender = keyring.addFromUri(seed);
                    lengthJson = jsonFile.length;
                    batchSize = config['node']['batch_size'];
                    times = Math.floor(lengthJson / batchSize);
                    i = 0;
                    _a.label = 3;
                case 3:
                    if (!(i < times)) return [3 /*break*/, 6];
                    start = i * batchSize;
                    end = i * batchSize + batchSize;
                    if (end > lengthJson) {
                        end = lengthJson;
                    }
                    currentBatch = jsonFile.slice(start, end);
                    txs = createBatchCalls(api, currentBatch);
                    return [4 /*yield*/, api.rpc.system.accountNextIndex(sender.address)];
                case 4:
                    nonce = _a.sent();
                    console.log("current nonce: ", nonce.toHuman());
                    next_nonce = parseInt(nonce.toHuman()) + i;
                    console.log("next nonce: ", next_nonce);
                    api.tx.utility.batch(txs).signAndSend(sender, { nonce: next_nonce }, function (_a) {
                        var _b = _a.events, events = _b === void 0 ? [] : _b, status = _a.status;
                        console.log('Transaction status:', status.type);
                        if (status.isInBlock) {
                            console.log('Included at block hash', status.asInBlock.toHex());
                            console.log('Events:');
                            events.forEach(function (_a) {
                                var _b = _a.event, data = _b.data, method = _b.method, section = _b.section, phase = _a.phase;
                                console.log('\t', phase.toString(), ": " + section + "." + method, data.toString());
                            });
                            console.log("included in " + status.asInBlock);
                            logger.log({
                                level: 'info',
                                message: "included in " + status.asInBlock
                            });
                        }
                        else if (status.isFinalized) {
                            console.log('Finalized block hash', status.asFinalized.toHex());
                            process.exit(0);
                        }
                    });
                    _a.label = 5;
                case 5:
                    ++i;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/];
            }
        });
    });
}
main()["catch"](console.error);
