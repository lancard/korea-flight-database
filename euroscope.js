const fs = require('fs');

module.exports = {
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