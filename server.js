require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
const jsonParser = bodyParser.json();

const visionApiUrl = 'https://' + process.env.VISION_API_HOST + '/vision/v1.0';
const visionApiKey = process.env.VISION_API_KEY;

function validateRequest(req, res, next) {
    if (!req.body.url) return res.sendStatus(400);
    if (!req.body.secret) return res.sendStatus(401);

    next();
}

function asText(responseBody) {
    var text = [];
    responseBody.regions.forEach((region) => {
        if (region.lines) region.lines.forEach((line) => {
            if (line.words) line.words.forEach((word) => {
                text.push(word.text);
            });
        });
    });

    return text.join(" ");
}

function imageToText(url) {
    return new Promise((resolve, reject) => {
        const requestOptions = {
            url: visionApiUrl + '/ocr?language=en',
            method: 'POST',
            json: true,
            headers: { 'Ocp-Apim-Subscription-Key': visionApiKey },
            body: { url: url }
        };

        return request(requestOptions, (err, httpResponse, body) => {
            return (!err && httpResponse.statusCode == 200)
                ? resolve(asText(httpResponse.body))
                : reject(err);
        });
    });
}

app.post('/image-to-text', jsonParser, validateRequest, (req, res) => {
    return imageToText(req.body.url)
        .then((text) => res.send(text))
        .catch((err) => res.sendStatus(404));
});

app.post('/image-to-id', jsonParser, validateRequest, (req, res) => {
    return imageToText(req.body.url)
        .then((text) => {
            const matched = text.match(/\d{3}-?\d{7}-?\d{7}/g);
            return (matched)
                ? res.send(matched[0])
                : res.sendStatus(404);
        }).catch((err) => res.sendStatus(400));
})

app.listen(process.env.PORT || 8080);