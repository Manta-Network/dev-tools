# A tool for monitoring block skips.

## Build
```shell
git clone git@github.com:Manta-Network/Dev-Tools.git
cd monitor-block-authors
yarn
```

## Run
```shell
node index.js --address wss://falafel.calamari.systems/ # To start with most recent block
node index.js --address wss://falafel.calamari.systems/ --since 275100 # To start with a historical block
```
It should print log like this:
```
#275354: dmzbLejekGYZmfo5FoSznv5bBik7vGowuLxvzqFs2gZo2kANh (4)
#275355: dmxjZSec4Xj3xz3nBEwSHjQSnRGhvcoB4eRabkiw7pSDuv8fW (0)
#275356: dmu63DLez715hRyhzdigz6akxS2c9W6RQvrToUWuQ1hntcBwF (1)
#275357: dmxvivs72h11DBNyKbeF8KQvcksoZsK9uejLpaWygFHZ2fU9z (2)
#275358: dmyhGnuox8ny9R1efVsWKxNU2FevMxcPZaB66uEJqJhgC4a1W (3)
#275359: dmzbLejekGYZmfo5FoSznv5bBik7vGowuLxvzqFs2gZo2kANh (4)
#275360: dmxjZSec4Xj3xz3nBEwSHjQSnRGhvcoB4eRabkiw7pSDuv8fW (0)
#275361: dmu63DLez715hRyhzdigz6akxS2c9W6RQvrToUWuQ1hntcBwF (1)
Node skipped a block, from 1  to 3
#275362: dmyhGnuox8ny9R1efVsWKxNU2FevMxcPZaB66uEJqJhgC4a1W (3)
#275363: dmzbLejekGYZmfo5FoSznv5bBik7vGowuLxvzqFs2gZo2kANh (4)
#275364: dmxjZSec4Xj3xz3nBEwSHjQSnRGhvcoB4eRabkiw7pSDuv8fW (0)
Node skipped a block, from 0  to 2
#275365: dmxvivs72h11DBNyKbeF8KQvcksoZsK9uejLpaWygFHZ2fU9z (2)
#275366: dmyhGnuox8ny9R1efVsWKxNU2FevMxcPZaB66uEJqJhgC4a1W (3)
#275367: dmzbLejekGYZmfo5FoSznv5bBik7vGowuLxvzqFs2gZo2kANh (4)
#275368: dmxjZSec4Xj3xz3nBEwSHjQSnRGhvcoB4eRabkiw7pSDuv8fW (0)
```
