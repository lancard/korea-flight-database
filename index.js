const fs = require('fs');
const util = require('./util.js');
const aircraftList = require('./database/aircraft.json');
const airlineList = require('./database/airline.json');
const airportList = require('./database/airport.json');
const navaidList = require('./database/navaid.json');

function initialize() {
    // minutes to decimal conversion
    for (var a = 0; a < navaidList.length; a++) {
        navaidList[a].latitudeDecimal = util.convertMinutesToDecimal(navaidList[a].latitude);
        navaidList[a].longitudeDecimal = util.convertMinutesToDecimal(navaidList[a].longitude);
    }

    // minutes to decimal conversion
    for (var a in airportList) {
        airportList[a].latitudeDecimal = util.convertMinutesToDecimal(airportList[a].latitude);
        airportList[a].longitudeDecimal = util.convertMinutesToDecimal(airportList[a].longitude);
    }

    // console.log(JSON.stringify(airportList, null, '\t'));
}

const euroscope = {
    createEuroscopeAircraftFile() {
        let fileContent = [];

        for (const aircraft in aircraftList) {
            fileContent.push(
                [
                    aircraft,
                    aircraftList[aircraft].aircraftType[0] + aircraftList[aircraft].wakeTurbulenceCategory[0] + aircraftList[aircraft].engineCount + aircraftList[aircraft].engineType[0],
                    aircraftList[aircraft].manufacturer,
                    aircraftList[aircraft].description
                ].join("\t"))
        }

        fs.writeFileSync('euroscope/ICAO_aircraft.txt', fileContent.join("\n"));
    },
    createEuroscopeAirlineFile() {
        let fileContent = [];

        for (const airline in airlineList) {
            fileContent.push(
                [
                    airline,
                    airlineList[airline],
                    airlineList[airline]
                ].join("\t"))
        }

        fs.writeFileSync('euroscope/ICAO_airline.txt', fileContent.join("\n"));
    },
    createEuroscopeAirportFile() {
        let fileContent = [];

        for (const airport in airportList) {
            fileContent.push(
                [
                    airportList[airport].name,
                    airportList[airport].description,
                    airportList[airport].country
                ].join("\t"))
        }

        fs.writeFileSync('euroscope/ICAO_airport.txt', fileContent.join("\n"));
    }
};


// ----------------- run -------------------
initialize();
euroscope.createEuroscopeAircraftFile();
euroscope.createEuroscopeAirlineFile();
euroscope.createEuroscopeAirportFile();