const fs = require('fs');
const path = require('path');
const util = require('./util.js');

const positionList = require('./database/position.json');


function getRawCoordRemovedList(arr) {
    var ret = [];
    var beforeElement = "asfgajslkgjasklga";

    arr.forEach(e => {
        if (e.length > 10)
            return;

        if (beforeElement == e)
            return;

        beforeElement = e;

        ret.push(e);
    });

    return ret;
}

function getInitialID(artccName) {
    if (positionList[artccName + "_APP"])
        return positionList[artccName + "_APP"].initialID;

    if (positionList[artccName + "_CTR"])
        return positionList[artccName + "_CTR"].initialID;

    return null;
}

module.exports = {
    initialize() {
        if (!fs.existsSync('vatsim')) {
            fs.mkdirSync('vatsim');
        }
    },
    getPosition() {
        var ret = [];

        for (var callsign in positionList) {
            var e = positionList[callsign];

            ret.push([
                callsign,
                e.name,
                e.frequency,
                e.initialID,
                e.middleFix,
                e.prefix,
                e.position,
                '-',
                '-',
                '0000',
                '7777'
            ].join(":"));
        }

        return ret.join("\n");
    },
    getSidStar() {
        var ret = [];

        // SID only
        procedureList.filter(e => e.procedureType == "SID").forEach(e => {
            e.runway.forEach(r => {
                ret.push(["SID", e.airport, r, e.name, getRawCoordRemovedList(e.fixList).join(" ")].join(":"));
            });
        });

        // APPROACH only
        procedureList.filter(e => e.procedureType == "APPROACH").forEach(e => {
            ret.push(["STAR", e.airport, e.runway, e.name, getRawCoordRemovedList(e.fixList).join(" ")].join(":"));
        });

        // STAR + APPROACH
        procedureList.filter(t => t.procedureType == "APPROACH").forEach(t => {
            procedureList.filter(e => e.procedureType == "STAR" && e.fixList.last() == t.fixList[0] && t.airport == e.airport).forEach(e => {
                ret.push(["STAR", t.airport, t.runway, `${e.name}.${t.name}`, getRawCoordRemovedList(e.fixList.concat(t.fixList)).join(" ")].join(":"));
            });
        });

        return ret.join("\n");
    },
    getAirspace() {
        var tracon = {};

        // get fir
        var geojson = require('./temp/boundaries.json');

        geojson.features.forEach(e => {
            if (e.properties.id.startsWith("RK")) {
                tracon[e.properties.id.split("-").join("_")] = e.geometry.coordinates[0][0];
            }
        });

        // get tracon
        fs.readdirSync('./database/airspace').forEach(e => {
            var fileInfo = path.parse(e);

            if (fileInfo.ext != ".geojson")
                return;

            var airportName = fileInfo.name;
            var t = JSON.parse(fs.readFileSync('./database/airspace/' + e)).geometry.coordinates[0][0];
            tracon[airportName] = t;
        });

        // -------------------------------------
        var ret = [];
        var additionalRet = [];

        for (var app in tracon) {
            ret.push(`SECTORLINE:${app}_TMA_BORDER`);
            ret.push(`DISPLAY:${app}_TMA:${app}_TMA:RKRR_A_CTR`);

            tracon[app].forEach(e => {
                ret.push(`COORD:${util.convertDecimalToMinutes(e[1], "NS")}:${util.convertDecimalToMinutes(e[0], "EW")}`)
            });
            ret.push(`COORD:${util.convertDecimalToMinutes(tracon[app][0][1], "NS")}:${util.convertDecimalToMinutes(tracon[app][0][0], "EW")}`)

            ret.push("\n");

            additionalRet.push(
                `SECTOR:${app}_TMA:0:18500\n` +
                `OWNER:${getInitialID(app)}:KA\n` +
                `BORDER:${app}_TMA_BORDER\n`
            )
        }

        return ret.join("\n") + additionalRet.join("\n");
    },
    generateEseFile() {
        var contents = "";

        contents += "\n\n[POSITIONS]\n";
        contents += this.getPosition();

        contents += "\n\n[SIDSSTARS]\n";
        contents += this.getSidStar();

        contents += "\n\n[AIRSPACE]\n";
        contents += this.getAirspace();

        fs.writeFileSync('vatsim/sector.ese', contents.split("\n").join("\r\n"));
    }
};
