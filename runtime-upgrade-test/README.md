# A tool for measuring block time

## Build
```shell
git clone git@github.com:Manta-Network/Dev-Tools.git
cd Dev-Tools/runtime-upgrade-test
yarn
```

## Configure
Change this line of code, point to the running node.
```
const nodeAddress = 'ws://127.0.0.1:9921';
```
You will need to copy a `root_mnemonics` file, which includes the mnemonics phrase for the sudo account that will send the TX.
Moreover you will need to copy a `calamari.wasm` file to be sent as a payload of the TX.

## Run
```shell
node index.js
```
It should print log like this:
```
Upgrading from dmyBqgFxMPZs1wKz8vFjv7nD4RBu4HeYhZTsGxSDU1wXQV15R, 391481 bytes

Proposal status: Ready
Proposal status: Broadcast
Proposal status: InBlock
You have just upgraded your chain
Included at block hash 0x8396cd8580f89bc4fd2dcbe554a839d528634ba0b9569f5b3aa21ee0745aac3a
Events:
[
  {
    "phase": {
      "applyExtrinsic": 2
    },
    "event": {
      "index": "0x0100",
      "data": [
        120
      ]
    },
    "topics": []
  },
  {
    "phase": {
      "applyExtrinsic": 2
    },
    "event": {
      "index": "0x0002",
      "data": []
    },
    "topics": []
  },
  {
    "phase": {
      "applyExtrinsic": 2
    },
    "event": {
      "index": "0x2a00",
      "data": [
        {
          "ok": []
        }
      ]
    },
    "topics": []
  },
  {
    "phase": {
      "applyExtrinsic": 2
    },
    "event": {
      "index": "0x0000",
      "data": [
        {
          "weight": 1,
          "class": "Operational",
          "paysFee": "Yes"
        }
      ]
    },
    "topics": []
  }
]
Proposal status: Finalized
Finalized block hash 0x8396cd8580f89bc4fd2dcbe554a839d528634ba0b9569f5b3aa21ee0745aac3a
```
