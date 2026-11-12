const fs = require('fs');
const https = require('https');
const csv = require('csvtojson');

if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp');
}

// download whole world airport
if (!fs.existsSync('temp/airports.json')) {
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
}

// download fir boundary
if (!fs.existsSync('temp/boundaries.json')) {
    https.get("https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/Boundaries.geojson", (response) => {
        response.pipe(fs.createWriteStream('temp/boundaries.json'));
    });
}




// download fir boundary and filter for Korea-adjacent airspace + FSS
if (!fs.existsSync('database/airspace')) {
    fs.mkdirSync('database/airspace', { recursive: true });
}
https.get("https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/Boundaries.geojson", (response) => {
    let data = '';
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
        const geojson = JSON.parse(data);
        const regionPrefixes = [
            'RJ',      // Japan
            'UHHH',    // Russia (Vladivostok)
            'PRC_FSS', // China FSS
            'ZBAA',    // China
            'ZYTL',    // China
            'ZYSH',    // China
            'ZSSS',    // China
            'ZSHA',    // China
            "VHHH",    // Hong Kong
            "RC"       // Taiwan
        ];
        const filtered = {
            type: "FeatureCollection",
            features: geojson.features.filter(f => {
                const id = f.properties.id || '';
                return regionPrefixes.some(prefix => id.startsWith(prefix));
            })
        };
        fs.writeFileSync('database/airspace/Boundaries.geojson', JSON.stringify(filtered, null, '\t'));
    });
});