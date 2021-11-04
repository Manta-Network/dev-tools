const { Client } = require('pg');

const client = new Client({
user: 'block-data',
database: 'blocks',
password: 'pass',
})
client.connect()

const SELECT_QUERY = "select name,id,sum(skipped) as skipped,sum(processed) as processed,sum(total) as total,max(last_block) from blocks";

const oneHour = () => {
    let data = [];
    return client.query(SELECT_QUERY + " WHERE created > now() - interval '1 hour' group by name,id").then(res => {
            for (let row of res.rows) {
                data.push(row);
            }
        }).catch(err => console.error(err))
        .then(function (result) {
            return data;
        });
};

const sixHours = () => {
    let data = [];
    return client.query(SELECT_QUERY + " WHERE created > now() - interval '6 hours' group by name,id").then(res => {
            for (let row of res.rows) {
                data.push(row);
            }
        }).catch(err => console.error(err))
        .then(function (result) {
            return data;
        });
};

const getData = (req, res, next) => {
    let response = {};

    return oneHour().then(r => {
        response["One Hour"] = r;
    }).then(r => {
        return sixHours().then(r => {
            response["Six Hours"] = r;
        });
    }).then(r => {
        return res.status(200).json({body: response});
    });
};

module.exports.getData = getData;
