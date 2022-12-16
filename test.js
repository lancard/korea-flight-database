const fs = require('fs');
const path = require('path');

const raw = require('./database/airport/all.json');

var airportAndName = {};

raw.forEach(e => {
    if (!airportAndName[e.airport]) airportAndName[e.airport] = {};

    if (!airportAndName[e.airport][e.name])
        airportAndName[e.airport][e.name] = {
            airport: e.airport,
            name: e.name,
            description: e.description,
            lineList: []
        };

    airportAndName[e.airport][e.name].lineList.push({ latitude1: e.latitude1, longitude1: e.longitude1, latitude2: e.latitude2, longitude2: e.longitude2 });
});

for (airport in airportAndName) {
    var obj = airportAndName[airport];

    fs.writeFileSync(`./database/airport/${airport}.json`, JSON.stringify(obj, null, '\t'));
}

// console.log(JSON.stringify(airportAndName, null, '\t'));