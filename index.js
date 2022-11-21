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

const vatsim = {
    generateSectorFile() {
        var contents =
            "; Korea RKRR FIR ACC - All right reserved, VATSIM Korea division\n" +
            "; \n" +
            "; used only VATSIM airtraffic controlling\n" +
            "; DO NOT used for sale or commercial use.\n" +
            "; \n" +
            "; contact point: vatkor10@vatkor.net\n" +
            ";\n" +
            ";\n" +
            "; < Revision History >\n" +
            ";\n" +
            ";  First made : SeokHwan Kim, JoonBeom Lee, Youngho Seo\n" +
            "; 2013 ~ 2015 : Hyunjae Lee\n" +
            "; 2016 ~ now  : Sungho Kim\n" +
            ";\n" +
            ";\n" +
            "; < coordination general rule >\n" +
            ";\n" +
            "; ● all airway points (not ground) : by AIP coordination and by Google map coordination (WGS-84)\n" +
            "; ● airports runways and IF/FAF : by AIP coordination and by Google map coordination (WGS-84).\n" +
            "; ● airports and ground aids : by AIP coordination and by Google map coordination (WGS-84).\n" +
            ";\n" +
            "; magnetic variation ref: WMM-2015 (http://www.ngdc.noaa.gov/geomag-web/) - CSV download\n"

        fs.writeFileSync('vatsim/sector.sct2', contents);
    }
}


// ----------------- run -------------------
initialize();
vatsim.generateSectorFile();
euroscope.createEuroscopeAircraftFile();
euroscope.createEuroscopeAirlineFile();
euroscope.createEuroscopeAirportFile();