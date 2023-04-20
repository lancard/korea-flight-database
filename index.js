const fs = require('fs');
const aircraft = require('./database/aircraft.json');
const airline = require('./database/airline.json');
const airport = require('./database/airport.json');

/*
var a = {};
airport.forEach(element => {
    a[element.name] = element;
});
console.log(JSON.stringify(a));
*/

const euroscope = {
    createEuroscopeAircraftFile() {
        let fileContent = [];

        for (const object in aircraft) {
            fileContent.push(
                [
                    object,
                    aircraft[object].aircraftType[0] + aircraft[object].wakeTurbulenceCategory[0] + aircraft[object].engineCount[0] + aircraft[object].engineType[0],
                    aircraft[object].manufacturer,
                    aircraft[object].description
                ].join("\t"))
        }

        fs.writeFileSync('euroscope/ICAO_aircraft.txt', fileContent.join("\n"));
    },
    createEuroscopeAirlineFile() {
        let fileContent = [];

        for (const object in airline) {
            fileContent.push(
                [
                    object,
                    airline[object],
                    airline[object]
                ].join("\t"))
        }

        fs.writeFileSync('euroscope/ICAO_airline.txt', fileContent.join("\n"));
    },
    createEuroscopeAirportFile() {
        let fileContent = [];

        for (const object in airport) {
            fileContent.push(
                [
                    airport[object].name,
                    airport[object].description,
                    airport[object].country
                ].join("\t"))
        }

        fs.writeFileSync('euroscope/ICAO_airport.txt', fileContent.join("\n"));
    }
};


// ----------------- run -------------------
euroscope.createEuroscopeAircraftFile();
euroscope.createEuroscopeAirlineFile();
euroscope.createEuroscopeAirportFile();