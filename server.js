require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
const jsonParser = bodyParser.json();

const visionApiUrl = 'https://' + process.env.VISION_API_HOST + '/vision/v1.0';
const visionApiKey = process.env.VISION_API_KEY;

app.post('/ocr', jsonParser, function (req, res) {
    if (!req.body && req.body.url) return res.sendStatus(400);
    if (!req.body.secret) return res.sendStatus(401);

    const requestOptions = {
        url: visionApiUrl + '/ocr?language=en',
        method: 'POST',
        json: true,
        headers: {
            'Ocp-Apim-Subscription-Key': visionApiKey
        },
        body: {
            url: req.body.url
        }
    };

    request(requestOptions, (err, httpResponse, body) => {
        if (!err && httpResponse.statusCode == 200) {
            let text = [];
            httpResponse.body.regions.forEach((region) => {
                if (region.lines)
                region.lines.forEach((line) => {
                    if (line.words)
                    line.words.forEach((word) => {
                        text.push(word.text);
                    });
                });
            });

            return res.send(text.join(" "));
        } else return res.sendStatus(400);
    });
});

app.listen(process.env.PORT || 8080);