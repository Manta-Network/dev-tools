# Diff-Manta-Metadata
Just for diff manta's metadata to see whether `transaction_version` needs to be bumped.

## Build

```shell
yarn
yarn build
```

## Diff

```
yarn diff-metadata --old=ws://127.0.0.1:9944 --new=ws://127.0.0.1:9945
```
