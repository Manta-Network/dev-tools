const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const api = require('./routes/routes');

const app = express();
const port = process.env.PORT || 5000;

app.use((req, res, next) => {
    console.log(`Request Endpoint: ${req.method} ${req.url}`);
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors());
app.use('/api/v1/', api);

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
};

app.get('*', (req, res) => {
    res.status(200).json({
        msg: 'Catch all'
    });
});

app.listen(port, () => console.log(`Server listening on: ${port}`));
