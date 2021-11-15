CREATE TABLE IF NOT EXISTS blocks (
    name varchar,
    id varchar,
    skipped bigint,
    processed bigint,
    total bigint,
    last_block bigint,
    created timestamp default now()
);

CREATE TABLE IF NOT EXISTS nodes (
    name varchar,
    id varchar,
    index int
)

