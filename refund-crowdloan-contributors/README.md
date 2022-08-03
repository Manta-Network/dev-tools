# A tool to refund parachain crowdloan contributors

## Build
```shell
git clone git@github.com:Manta-Network/Dev-Tools.git
cd refund-crowdloan-contributors
yarn
```

## Configure
Update `configuration.toml`'s `endpoint` to point to a running node. In the case of Calamari's crowdloan that would be a Kusama node.
Update `configuration.toml`'s `signer` with the correct mnemonic of an account that can pay transaction fees. Be careful to not push it to github.
Optionally you can update the `batch_size` and `para_id` but the defaults should be fine.
Make sure you have the `contributors.json` file with the list of all the contributors addresses.

## Run
```shell
node refund-crowdloan-contributors.js
```
Inspect the log to see if the `Finalized force_batch Txs Counter has been appropriately incremented` as per the concrete `batch_size` and total amount of contributors.
Concretely for the configuration defaults that would be `32`.
Additionally inspect the `unchanged_addresses.json` output file that indicates contributor balances have not been updated.