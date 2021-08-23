const express = require("express");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const cors = require('cors');

const app = express();

const authConfig = {
    domain: '<YOUR_AUTH0_DOMAIN>',
    clientId: '<YOUR_CLIENT_ID>',
    audience: '<YOUR_AUDIENCE>'
};

const corsOptions = {
    origin: 'http://localhost:8080',
    optionsSuccessStatus: 200
};

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
    }),

    audience: authConfig.audience,
    issuer: `https://${authConfig.domain}/`,
    algorithms: ["RS256"]
});

app.options('/api/message', cors(corsOptions));
app.get('/api/message', cors(corsOptions), checkJwt, (req, res) => {
    res.json({
        to: req.user?.sub,
        message: 'It\'s a secret from our classmates, okay?'
    });
});

app.get('/', (req, res) => {
    res.json({});
});

app.use(function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        return res.status(401).send({ msg: "Invalid token" });
    }
    next(err, req, res);
});

app.listen(3000, () => {
    console.log('Example app listening at http://localhost:3000');
});
