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

const calamari_nodes = [
    "dmxjZSec4Xj3xz3nBEwSHjQSnRGhvcoB4eRabkiw7pSDuv8fW",
    "dmu63DLez715hRyhzdigz6akxS2c9W6RQvrToUWuQ1hntcBwF",
    "dmxvivs72h11DBNyKbeF8KQvcksoZsK9uejLpaWygFHZ2fU9z",
    "dmyhGnuox8ny9R1efVsWKxNU2FevMxcPZaB66uEJqJhgC4a1W",
    "dmzbLejekGYZmfo5FoSznv5bBik7vGowuLxvzqFs2gZo2kANh"
];

class SkipChecker {
    constructor(nodes) {
        this.nodes = nodes;
        this.last_author = null;
    }

    check(hash) {
        const index = this.nodes.indexOf(hash);
        const last = this.last_author;
        const should_be = (last + 1) % this.nodes.length;

        if (last != null && index != should_be) {
            console.log(`Node skipped a block, from ${last}  to ${index}`);
        }
        this.last_author = index;
        return index;
    }
}

var last_author = null;
async function main() {
    let nodeAddress = "ws://127.0.0.1:9988";
    let sinceBlock = null;

    const args = require('minimist')(process.argv.slice(2))
    if (args.hasOwnProperty('address')) {
        nodeAddress = args['address'];
    }
    if (args.hasOwnProperty('since')) {
        sinceBlock = parseInt(args['since'], 10);
    }
    
    const api = await createPromiseApi(nodeAddress);
    const checker = new SkipChecker(calamari_nodes);

    if (sinceBlock != null) {
        let bh = await api.rpc.chain.getBlockHash();
        let { _author, number } = await api.derive.chain.getHeader(bh);

        console.log(`${sinceBlock} sintZ ${number}`);
        while (sinceBlock < number) {
            const hash = await api.rpc.chain.getBlockHash(sinceBlock);
            const { author, _num } = await api.derive.chain.getHeader(hash);
            let idx = checker.check(author.toHuman());
            console.log(`# ${sinceBlock}: ${author} (${idx})`);
            let bh = await api.rpc.chain.getBlockHash();
            let { _author, number } = await api.derive.chain.getHeader(bh);
            sinceBlock += 1;
        }
    }

    api.derive.chain.subscribeNewHeads((header) => {
      const h = header.author.toHuman();
      const index = checker.check(h);
      console.log(`#${header.number}: ${header.author} (${index})`);
    });
}

main().catch(console.error);
