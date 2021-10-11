# A tool for measuring block time

## Build
```shell
git clone git@github.com:Manta-Network/measure-block-time.git
cd measure-block-time
yarn
```

## Run
```shell
node index.js --address=ws://127.0.0.1:9988
```
It should print log like this:
```
# 350 -> # 351 , block time:  11999
average block time:  11999
# 351 -> # 352 , block time:  12000
average block time:  11999.5
# 352 -> # 353 , block time:  11997
average block time:  11998.666666666666
# 353 -> # 354 , block time:  12008
average block time:  12001
# 354 -> # 355 , block time:  11991
average block time:  11999
# 355 -> # 356 , block time:  12004
average block time:  11999.833333333334
# 356 -> # 357 , block time:  11999
average block time:  11999.714285714286
```
