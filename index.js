const util = require('./util.js');
const euroscope = require('./euroscope.js');
const sector = require('./sector.js');
const openstreetmap = require('./openstreetmap.js');

global.aircraftList = require('./database/aircraft.json');
global.airlineList = require('./database/airline.json');
global.airportList = require('./database/airport.json');
global.airwayList = require('./database/airway.json');
global.navaidList = require('./database/navaid.json');
global.coastlineList = require('./database/coastline.json');

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

// ----------------- run -------------------
initialize();
sector.generateSectorFile();
euroscope.createEuroscopeAircraftFile();
euroscope.createEuroscopeAirlineFile();
euroscope.createEuroscopeAirportFile();
openstreetmap.generateOpenstreetmap();