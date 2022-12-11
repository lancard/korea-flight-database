const fs = require('fs');
const dayjs = require('dayjs');
const path = require('path');

const util = require('./util.js');
const euroscope = require('./euroscope.js');
const sector = require('./sector.js');
const openstreetmap = require('./openstreetmap.js');

global.aircraftList = require('./database/aircraft.json');
global.airlineList = require('./database/airline.json');
global.airportList = require('./database/airport.json');
global.airwayList = require('./database/airway.json');
global.navaidList = require('./database/navaid.json');
global.runwayList = require('./database/runway.json');
global.coastlineList = require('./database/coastline.json');
global.procedureList = require('./database/procedure.json');
global.labelList = require('./database/label.json');
global.runwayMap = {};

String.prototype.paddingRight = function (paddingValue) {
    return this + (new Array(paddingValue - this.length + 1)).join(' ');
};

Array.prototype.last = function () {
    return this[this.length - 1];
}

function initialize() {
    // get last version (git)
    global.gitHeadVersion = fs.readFileSync('.git/logs/HEAD').toString().trim().split("\n").pop().split(" ")[1];
    global.gitHeadDateTime = dayjs.unix(fs.readFileSync('.git/logs/HEAD').toString().trim().split("\n").pop().split(">")[1].split("\t")[0].trim().split(" ")[0]);

    // minutes to decimal conversion
    for (var a = 0; a < navaidList.length; a++) {
        navaidList[a].latitudeDecimal = util.convertMinutesToDecimal(navaidList[a].latitude);
        navaidList[a].longitudeDecimal = util.convertMinutesToDecimal(navaidList[a].longitude);

        // check used marker by airways
        for (var b = 0; b < airwayList.length; b++) {
            if (airwayList[b].fixStart == navaidList[a].name || airwayList[b].fixEnd == navaidList[a].name) {
                navaidList[a].isUsedByNavigation = true;
            }
        }

        // check used marker by sid / star / approach and transitions
        procedureList.forEach(p => {
            p.fixList.forEach(e => {
                if (e == navaidList[a].name) {
                    navaidList[a].isUsedByNavigation = true;
                }
            });
        });
    }

    // minutes to decimal conversion
    for (var a = 0; a < labelList.length; a++) {
        labelList[a].latitudeDecimal = util.convertMinutesToDecimal(labelList[a].latitude);
        labelList[a].longitudeDecimal = util.convertMinutesToDecimal(labelList[a].longitude);
    }

    // minutes to decimal conversion
    for (var a in airportList) {
        airportList[a].latitudeDecimal = util.convertMinutesToDecimal(airportList[a].latitude);
        airportList[a].longitudeDecimal = util.convertMinutesToDecimal(airportList[a].longitude);
    }

    // minutes to decimal conversion
    for (var r = 0; r < runwayList.length; r++) {
        runwayList[r].startLatitudeDecimal = util.convertMinutesToDecimal(runwayList[r].startLatitude);
        runwayList[r].startLongitudeDecimal = util.convertMinutesToDecimal(runwayList[r].startLongitude);
        runwayList[r].endLatitudeDecimal = util.convertMinutesToDecimal(runwayList[r].endLatitude);
        runwayList[r].endLongitudeDecimal = util.convertMinutesToDecimal(runwayList[r].endLongitude);

        runwayMap[`${runwayList[r].airport}_${runwayList[r].runway}`] = { latitude: runwayList[r].startLatitude, longitude: runwayList[r].startLongitude };
        runwayMap[`${runwayList[r].airport}_${runwayList[r].oppositeRunway}`] = { latitude: runwayList[r].endLatitude, longitude: runwayList[r].endLongitude };
    }

    // console.log(JSON.stringify(navaidList, null, '\t'));
}

// ----------------- run -------------------
initialize();

sector.initialize();
sector.generateSectorFile();

euroscope.initialize();
euroscope.createEuroscopeAircraftFile();
euroscope.createEuroscopeAirlineFile();
euroscope.createEuroscopeAirportFile();

openstreetmap.initialize();
openstreetmap.generateOpenstreetmap();
