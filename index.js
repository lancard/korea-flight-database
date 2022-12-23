const fs = require('fs');
const dayjs = require('dayjs');
const path = require('path');

const util = require('./util.js');
const euroscope = require('./euroscope.js');
const sector = require('./sector.js');
const ese = require('./ese.js');
const openstreetmap = require('./openstreetmap.js');

global.aircraftList = require('./database/aircraft.json');
global.airlineList = require('./database/airline.json');
global.airportList = {};
global.airwayList = require('./database/airway.json');
global.navaidList = require('./database/navaid.json');
global.runwayList = require('./database/runway.json');
global.coastlineList = require('./database/coastline.json');
global.procedureList = require('./database/procedure.json');
global.labelList = require('./database/label.json');
global.regionList = require('./database/region.json');
global.airportObject = {};
global.runwayMap = {};
global.runwayOppositeMap = {};

String.prototype.paddingRight = function (paddingValue) {
    return this + (new Array(paddingValue - this.length + 1)).join(' ');
};

Array.prototype.last = function () {
    return this[this.length - 1];
}

function initialize() {
    // check all fix in navaids
    procedureList.forEach(p => {
        p.fixList.forEach(e => {
            if (e.length > 10)
                return;

            var exist = false;
            navaidList.forEach(n => {
                if (n.name == e)
                    exist = true;
            });
            if (!exist) {
                console.log("fix not exist in navaid.json: " + e);
            }
        });
    });

    // get world airport
    const airports = require('./temp/airports.json');
    airports.forEach((e) => {
        if (e.type == 'closed')
            return;

        if (e.type == "small_airport" || e.type == 'seaplane_base' || e.type == 'balloonport' || e.type == 'heliport') {
            if (!util.isNearestAirport(e.ident))
                return;
        }

        global.airportList[e.ident] = {
            "continent": e.continent,
            "municipality": e.municipality,
            "description": e.name,
            "type": e.type,
            "latitude": util.convertDecimalToMinutes(e.latitude_deg, "NS"),
            "longitude": util.convertDecimalToMinutes(e.longitude_deg, "EW"),
            "country": e.iso_country,
            "iataCode": e.iata_code,
            "icaoCode": e.ident,
            "elevationInFeet": +e.elevation_ft
        };
    });

    // write to temp directory for debug
    fs.writeFileSync('temp/airport.json', JSON.stringify(global.airportList, null, '\t'));

    // get airport objects from directory
    fs.readdirSync('./database/airport').forEach(e => {
        var airportName = path.parse(e).name;
        airportObject[airportName] = require('./database/airport/' + e);
    });

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
        runwayOppositeMap[`${runwayList[r].airport}_${runwayList[r].oppositeRunway}`] = { latitude: runwayList[r].startLatitude, longitude: runwayList[r].startLongitude };
        runwayOppositeMap[`${runwayList[r].airport}_${runwayList[r].runway}`] = { latitude: runwayList[r].endLatitude, longitude: runwayList[r].endLongitude };
    }

    // print duplicated && unused fixes
    var navaidMap = {};
    navaidList.filter(e => e.navaidType == 'FIX' && e.extraType != "ILS" && !e.isUsedByNavigation).forEach(e => {
        // console.log("unused fix: " + e.name + (e.airport ? " / " + e.airport : ""));
        if (navaidMap[e.name]) {
            console.log("duplicated fix: " + e.name);
            return;
        }
        navaidMap[e.name] = true;
    });


}

// ----------------- run -------------------
initialize();

sector.initialize();
sector.generateSectorFile();

ese.generateEseFile();

euroscope.initialize();
euroscope.createEuroscopeAircraftFile();
euroscope.createEuroscopeAirlineFile();
euroscope.createEuroscopeAirportFile();

openstreetmap.initialize();
openstreetmap.generateOpenstreetmap();
