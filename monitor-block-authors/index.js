const { Client } = require('pg');
const axios = require('axios');

const client = new Client({
user: 'block-data',
database: 'blocks',
password: 'pass',
})
client.connect()

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

    check(hash, last_block) {
        const index = this.nodes.indexOf(hash);
        const last = this.last_author;
        const should_be = (last + 1) % this.nodes.length;
        this.last_block = last_block;

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
        let array = [];
        let skips = this.skips;
        let counts = this.counts;
        let names = this.names;
        let last_block = this.last_block;
        let created = new Date(Date.now()).toISOString();

        this.nodes.forEach(function (node) {
            let skip = skips[node];
            let count = counts[node];
            let total = skip + count;
            array.push({
                name: names[node],
                id: node,
                skipped: skip,
                processed: count,
                total: total,
                last_block: last_block,
                created: created,
                })
        });
        return array;
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
    
    const checker = new SkipChecker(calamari_names, calamari_nodes);
    const endpoint = nodeAddress + '/api/scan/blocks';
    const query_res = await client.query("SELECT max(last_block) from blocks");
    const last_processed_block = query_res.rows[0].max;

    const res = await axios.post(endpoint, { row: 100, page: 0 });
    console.log(`Starting from block ${last_processed_block}`);

    const blocks = res.data.data.blocks;
    for (let block of blocks.reverse()) {
        if (block.block_num < last_processed_block) {
            continue;
        }

        const author = block.validator;
        let idx = checker.check(author, block.block_num);
        console.log(`#${block.block_num}: ${author} (${calamari_names[author]})  (${idx})`);
    }
    const last_block = blocks[0].block_num;

    let data = checker.stats();
    let stringified = JSON.stringify(data);
    let query = "with cte as (SELECT * from json_populate_recordset(NULL::blocks, '" + stringified + "')) insert into blocks select * from cte;";
    let resp = await client.query(query);
}

main().catch(console.error);
