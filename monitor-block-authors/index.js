const { Client } = require('pg');
const axios = require('axios');

const client = new Client({
user: process.env['DB_USER'],
database: 'postgres',
password: process.env['DB_PASSWORD'],
host: process.env['DB_HOST'],
});
client.connect();


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

    set_last_author(last_author) {
        console.log(`Last author was ${last_author}`);
        this.last_author = this.nodes.indexOf(last_author);
    }

    check(hash, last_block) {
        const index = this.nodes.indexOf(hash);
        const last = this.last_author;
        const should_be = (last + 1) % this.nodes.length;
        this.last_block = last_block;

        if (last != null && index != should_be) {
            var i = should_be;
            while (i != index) {
                let skipped = this.nodes[i];
                let name = this.names[skipped];
                console.log(`Node ${skipped} (${name}) skipped a block.`);
                this.skips[skipped] += 1;

                i = (i + 1) % this.nodes.length;
            }
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
async function handler() {
    let nodeAddress = process.env['SUBSCAN_ENDPOINT'];
    let fromBlock = null;
    let toBlock = null;

    let calamari_names = {};
    let calamari_nodes = [];

    const node_data = await client.query("SELECT * from nodes order by index")
        .then(result => {
            result.rows.forEach(function (value) {
                calamari_names[value.id] = value.name;
                calamari_nodes.push(value.id);
            });
        });

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
        } else if (block.block_num == last_processed_block) {
            checker.set_last_author(block.validator);
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
    return client.query(query);
}

exports.handler = handler;
