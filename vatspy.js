const fs = require('fs');
const turf = require('@turf/turf');

function sectorToGeoJSON(sector) {
    var ret = [];
    sector.forEach(element => {
        ret.push([element.longitudeDecimal, element.latitudeDecimal]);
    });

    return turf.polygon([ret]);
}

function mergeSectorList(list) {
    var poly = sectorToGeoJSON(sectorList[list[0]]);

    for (var a = 1; a < list.length; a++) {
        poly = turf.union(poly, sectorToGeoJSON(sectorList[list[a]]));
    }

    return poly;
}

module.exports = {
    initialize() {
        if (!fs.existsSync('vatspy')) {
            fs.mkdirSync('vatspy');
        }
    },
    generateVatspyFile() {
        var ret;
        var lines = [];

        ret = mergeSectorList(["DAEGU AREA SECTOR", "EAST-SEA SECTOR", "GANGNEUNG AREA SECTOR", "GUNSAN EAST SECTOR", "GUNSAN WEST SECTOR",
            "GWANGJU EAST SECTOR", "GWANGJU WEST SECTOR", "JEJU NORTH SECTOR", "JEJU SOUTH SECTOR", "NAMHAE AREA SECTOR",
            "POHANG AREA SECTOR", "WEST-SEA NORTH SECTOR", "WEST-SEA SOUTH SECTOR"]);
        lines.push('RKRR_A_CTR: ' + JSON.stringify(ret.geometry.coordinates[0]));

        ret = mergeSectorList(["GUNSAN EAST SECTOR", "GUNSAN WEST SECTOR", "GWANGJU EAST SECTOR", "GWANGJU WEST SECTOR"]);
        lines.push('RKRR_N_CTR: ' + JSON.stringify(ret.geometry.coordinates[0]));

        ret = mergeSectorList(["JEJU NORTH SECTOR", "JEJU SOUTH SECTOR"]);
        lines.push('RKRR_S_CTR: ' + JSON.stringify(ret.geometry.coordinates[0]));

        ret = mergeSectorList(["WEST-SEA NORTH SECTOR", "WEST-SEA SOUTH SECTOR"]);
        lines.push('RKDA_W_CTR: ' + JSON.stringify(ret.geometry.coordinates[0]));

        ret = mergeSectorList(["EAST-SEA SECTOR", "GANGNEUNG AREA SECTOR", "POHANG AREA SECTOR"]);
        lines.push('RKDA_E_CTR: ' + JSON.stringify(ret.geometry.coordinates[0]));

        ret = mergeSectorList(["DAEGU AREA SECTOR", "NAMHAE AREA SECTOR"]);
        lines.push('RKDA_C_CTR: ' + JSON.stringify(ret.geometry.coordinates[0]));

        fs.writeFileSync('vatspy/geojson.txt', lines.join("\n"));
    }
};