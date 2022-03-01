# A tool to check last finalzied block number.

## Build
```shell
git clone git@github.com:Manta-Network/Dev-Tools.git
cd Dev-Tools/check-finalized-block
yarn
```

## Run
```shell
node index.js --address=some_address --target_block=some_block
```
It should print log like this:
```
Using passed parameter address: some_address
Using passed parameter target_block: some_block
Successfully finalized block number 69
```
