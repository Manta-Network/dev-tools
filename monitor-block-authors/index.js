const { ApiPromise, WsProvider } = require('@polkadot/api');

// Create a promise API instance of the passed in node address.
async function createPromiseApi(nodeAddress) {
    const wsProvider = new WsProvider(nodeAddress);
    const api = await new ApiPromise({ 
        provider: wsProvider
    });
    await api.isReady;
    return api;
}

const calamari_names = {
    "dmxjZSec4Xj3xz3nBEwSHjQSnRGhvcoB4eRabkiw7pSDuv8fW": "crispy",
    "dmu63DLez715hRyhzdigz6akxS2c9W6RQvrToUWuQ1hntcBwF": "crunchy",
    "dmxvivs72h11DBNyKbeF8KQvcksoZsK9uejLpaWygFHZ2fU9z": "hotdog",
    "dmyhGnuox8ny9R1efVsWKxNU2FevMxcPZaB66uEJqJhgC4a1W": "tasty",
    "dmzbLejekGYZmfo5FoSznv5bBik7vGowuLxvzqFs2gZo2kANh": "tender"
};

const calamari_nodes = [
    "dmxjZSec4Xj3xz3nBEwSHjQSnRGhvcoB4eRabkiw7pSDuv8fW",
    "dmu63DLez715hRyhzdigz6akxS2c9W6RQvrToUWuQ1hntcBwF",
    "dmxvivs72h11DBNyKbeF8KQvcksoZsK9uejLpaWygFHZ2fU9z",
    "dmyhGnuox8ny9R1efVsWKxNU2FevMxcPZaB66uEJqJhgC4a1W",
    "dmzbLejekGYZmfo5FoSznv5bBik7vGowuLxvzqFs2gZo2kANh"
];

class SkipChecker {
    constructor(names, nodes) {
        this.names = names;
        this.nodes = nodes;
        this.last_author = null;
        var counts = {};
        nodes.forEach(function (value) {
            counts[value] = 0;
        });
        var skips = {};
        nodes.forEach(function (value) {
            skips[value] = 0;
        });
        this.counts = counts;
        this.skips = skips;
    }

    check(hash) {
        const index = this.nodes.indexOf(hash);
        const last = this.last_author;
        const should_be = (last + 1) % this.nodes.length;

        if (last != null && index != should_be) {
            let skipped = this.nodes[should_be];
            let name = this.names[skipped];
            console.log(`Node ${skipped} (${name}) skipped a block.`);
            this.skips[skipped] += 1;
        }

        this.counts[hash] += 1;
        this.last_author = index;
        return index;
    }

    stats() {
        console.log("Index, ID, Name, Skipped, Processed");
        var names = this.names;
        var skips = this.skips;
        var counts = this.counts;

        var total_skips = 0;
        var total_counted = 0;

        this.nodes.forEach(function (node, index) {
            total_skips += skips[node];
            total_counted += counts[node];
            console.log(`${index}, ${node}, ${names[node]}, ${skips[node]}, ${counts[node]}`);
        });

        console.log(`${total_skips} skipped. ${total_counted} blocks processed.`);
    }
}

var last_author = null;
async function main() {
    let nodeAddress = "ws://127.0.0.1:9988";
    let fromBlock = null;
    let toBlock = null;

    const args = require('minimist')(process.argv.slice(2))
    if (args.hasOwnProperty('address')) {
        nodeAddress = args['address'];
    }
    if (args.hasOwnProperty('from')) {
        fromBlock = parseInt(args['from'], 10);
    } else {
        throw new Error("--from option is required");
    }
    if (args.hasOwnProperty('to')) {
        toBlock = parseInt(args['to'], 10);
    }

    
    const api = await createPromiseApi(nodeAddress);
    const checker = new SkipChecker(calamari_names, calamari_nodes);

    toBlock = toBlock || await api.derive.chain.bestNumber();

    console.log(`Checking blocks ${fromBlock} to ${toBlock}`);

    while (fromBlock < toBlock) {
        const hash = await api.rpc.chain.getBlockHash(fromBlock);
        const { author, _num } = await api.derive.chain.getHeader(hash);
        let idx = checker.check(author.toHuman());
        console.log(`#${fromBlock}: ${author} (${calamari_names[author]})  (${idx})`);
        fromBlock += 1;
    }

    checker.stats();
}

main().catch(console.error);
