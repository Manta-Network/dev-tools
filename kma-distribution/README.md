

## TS Generation
- Get metadata.
```sh
curl -H "Content-Type: application/json" -d '{"id":"1", "jsonrpc":"2.0", "method": "state_getMetadata", "params":[]}' http://localhost:8877 > calamari.json
```

## Build
```sh
yarn
yarn build
yarn tsc
```

## Configuration
Check `configuration.toml`.

## Run
```sh
yarn start
```