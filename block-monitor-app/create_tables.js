const { Client } = require('pg');

const client = new Client({
user: 'block-data',
database: 'blocks',
password: 'pass',
})
client.connect()

const CREATE = "CREATE TABLE blocks ( name varchar, id varchar, skipped bigint, processed bigint, total bigint, last_block bigint, created timestamp default now())"

async function main() {
    await client.query(CREATE).then(console.log)
}

main().catch(console.error)
