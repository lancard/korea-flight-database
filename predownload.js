const fs = require('fs');
const https = require('https');
const csv = require('csvtojson');

if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp');
}

// download whole world airport
https.get("https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv", (response) => {
    response.on('end', function () {
        csv()
            .fromFile('temp/airports.csv')
            .then((jsonObj) => {
                fs.writeFileSync('temp/airports.json', JSON.stringify(jsonObj, null, '\t'));
            })
    });
    response.pipe(fs.createWriteStream('temp/airports.csv'));
});

// download fir boundary
https.get("https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/Boundaries.geojson", (response) => {
    response.pipe(fs.createWriteStream('temp/boundaries.json'));
});

// download vatsim tracon boundaries
https.get("https://raw.githubusercontent.com/vatsimnetwork/simaware-tracon-project/main/TRACONBoundaries.geojson", (response) => {
    response.pipe(fs.createWriteStream('temp/tracons.json'));
});
