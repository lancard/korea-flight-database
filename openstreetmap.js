const dayjs = require('dayjs');
const fs = require('fs');

module.exports = {
    generateOpenstreetmap() {
        var nodeIndex = 140000;
        var wayIndex = 540000;
        var fileContents = [`<?xml version='1.0' encoding='UTF-8'?><osm version='0.6'>`];
        var fixToIdMap = {};

        navaidList.filter(e => e.navaidType == "VOR").forEach(e => {
            nodeIndex++;

            fixToIdMap[e.name] = nodeIndex;
            fileContents.push(`<node id='${nodeIndex}' lat='${e.latitudeDecimal}' lon='${e.longitudeDecimal}'><tag k='aeroway' v='${e.vorType.toLowerCase()}' /><tag k='name' v='${e.name}' /></node>`);
        });
        navaidList.filter(e => e.navaidType == "NDB").forEach(e => {
            nodeIndex++;

            fixToIdMap[e.name] = nodeIndex;
            fileContents.push(`<node id='${nodeIndex}' lat='${e.latitudeDecimal}' lon='${e.longitudeDecimal}'><tag k='aeroway' v='ndb' /><tag k='name' v='${e.name}' /></node>`);
        });
        navaidList.filter(e => e.navaidType == "FIX").forEach(e => {
            nodeIndex++;

            fixToIdMap[e.name] = nodeIndex;
            fileContents.push(`<node id='${nodeIndex}' lat='${e.latitudeDecimal}' lon='${e.longitudeDecimal}'><tag k='aeroway' v='fix' /><tag k='name' v='${e.name}' /></node>`);
        });

        airwayList.forEach(e => {
            wayIndex++;

            if(!fixToIdMap[e.fixStart] || !fixToIdMap[e.fixEnd]) {
                console.dir(`airway fix not exist: ${e.fixStart} / ${e.fixEnd}`);
            }

            fileContents.push(`<way id='${wayIndex}'><nd ref='${fixToIdMap[e.fixStart]}' /><nd ref='${fixToIdMap[e.fixEnd]}' /><tag k='aeroway' v='airway_${e.airwayType.toLowerCase()}' /><tag k='name' v='${e.name}' /></way>`);
        });

        fileContents.push(`</osm>`);
        fs.writeFileSync('openstreetmap/data.osm', fileContents.join("\n"));
    }
};