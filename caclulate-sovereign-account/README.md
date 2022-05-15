# A tool to calculate your parachain's sovereign account on Rococo.

## Build
```shell
git clone git@github.com:Manta-Network/Dev-Tools.git
cd Dev-Tools/calculate-sovereign-account
yarn
```

## Run
```shell
ts-node calculateSovereignAddress --paraid ID
```
It should print log like this:
```
Sovereign Account Address on Relay: 0x7061726124080000000000000000000000000000000000000000000000000000
Sovereign Account Address on other Parachains (Generic): 0x7369626c24080000000000000000000000000000000000000000000000000000
Sovereign Account Address on Dolphin: 0x7369626c24080000000000000000000000000000
```
