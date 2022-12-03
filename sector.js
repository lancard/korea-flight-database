const fs = require('fs');
const downloadFileSync = require('download-file-sync');

const util = require('./util.js');

module.exports = {
    initialize() {
        if (!fs.existsSync('vatsim')) {
            fs.mkdirSync('vatsim');
        }
    },
    getLicenseAndComment() {
        return "; Korea RKRR FIR ACC - All right reserved, VATSIM Korea division\n" +
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
            "; - all airway points (not ground) : by AIP coordination and by Google map coordination (WGS-84)\n" +
            "; - airports runways and IF/FAF : by AIP coordination and by Google map coordination (WGS-84).\n" +
            "; - airports and ground aids : by AIP coordination and by Google map coordination (WGS-84).\n" +
            ";\n" +
            "; magnetic variation ref: WMM-2015 (http://www.ngdc.noaa.gov/geomag-web/) - CSV download\n";
    },
    getColorDefinition() {
        return "#define Airport-ApronCenterLine 8344832\n" +
            "#define Airport-BlastPad 65535\n" +
            "#define Airport-Border 16755370\n" +
            "#define Airport-Building 6316128\n" +
            "#define Airport-Building-Label 3486976\n" +
            "#define Airport-GateNumber 128\n" +
            "#define Airport-GroundMarkPaints 16777215\n" +
            "#define Airport-Helipad 65535\n" +
            "#define Airport-HoldPositionMark 255\n" +
            "#define Airport-Jetway 255\n" +
            "#define Airport-LeadInLight 2302755\n" +
            "#define Airport-Runway 5592405\n" +
            "#define Airport-TaxiwayCenterLine 8344958\n" +
            "#define Airport-Taxiway-Label 128\n" +
            "#define Airway-DmeArc 2302755\n" +
            "#define Airway-VfrReportingPoint 20560\n" +
            "#define Area-DangerArea 5263472\n" +
            "#define Area-DangerArea-Label 5263472\n" +
            "#define Area-MOA 8192\n" +
            "#define Area-ProhibitedArea 128\n" +
            "#define Area-RestrictedArea 64\n" +
            "#define CoastLine 2302755\n" +
            "#define FIR-Label 7360592\n" +
            "#define Test-White 16777215\n" +
            "#define Test-Yellow 65535\n"
    },
    getInfo() {
        return `Incheon vACC (${gitHeadDateTime.format("YYYYMMDD_HHmmss")})\n` +
            `RKRR_A_CTR (${gitHeadDateTime.format("YYYYMMDD_HHmmss")})\n` +
            `RKSI\n` +
            `N037.28.08.669\n` +
            `E126.27.01.861\n` +
            `60.000\n` +
            `49.000\n` +
            `7.5\n` +
            `1.000\n`;
    },
    getGeo() {
        var ret = [];

        coastlineList.forEach(e => {
            ret.push(`${e.latitude1} ${e.longitude1} ${e.latitude2} ${e.longitude2} CoastLine`);
        });

        return ret.join("\n");
    },
    getVor() {
        var ret = [];

        navaidList.filter(e => e.navaidType == "VOR").forEach(e => {
            ret.push(`${e.name} ${e.frequency} ${e.latitude} ${e.longitude}`);
        });

        return ret.join("\n");
    },
    getNdb() {
        var ret = [];

        navaidList.filter(e => e.navaidType == "NDB").forEach(e => {
            ret.push(`${e.name} ${e.frequency} ${e.latitude} ${e.longitude}`);
        });

        // add fixes to ndb (near airport)
        navaidList.filter(e => e.navaidType == "FIX" && e.extraType == "NEAR_AIRPORT_FIX").forEach(e => {
            ret.push(`${e.name} ${e.frequency} ${e.latitude} ${e.longitude}`);
        });

        return ret.join("\n");
    },
    getFix() {
        var ret = [];

        navaidList.filter(e => e.navaidType == "FIX" && e.isUsedByNavigation).forEach(e => {
            ret.push(`${e.name} ${e.latitude} ${e.longitude}`);
        });

        return ret.join("\n");
    },
    getAirport() {
        var ret = [];

        for (const airport in airportList) {
            ret.push(`${airportList[airport].icaoCode} 000.000 ${airportList[airport].latitude} ${airportList[airport].longitude} C`);
        }

        return ret.join("\n");
    },
    getRunway() {
        var ret = [];

        for (const runway in runwayList) {
            var bearing = util.calculateBearing(
                runwayList[runway].startLatitudeDecimal,
                runwayList[runway].startLongitudeDecimal,
                runwayList[runway].endLatitudeDecimal,
                runwayList[runway].endLongitudeDecimal
            )
            var oppositeBearing = util.calculateBearing(
                runwayList[runway].endLatitudeDecimal,
                runwayList[runway].endLongitudeDecimal,
                runwayList[runway].startLatitudeDecimal,
                runwayList[runway].startLongitudeDecimal
            )

            // magnetic variation
            bearing = +bearing.toFixed(0) + 7;
            oppositeBearing = +oppositeBearing.toFixed(0) + 7;

            ret.push(`${runwayList[runway].runway} ${runwayList[runway].oppositeRunway} ${bearing} ${oppositeBearing} ${runwayList[runway].startLatitude} ${runwayList[runway].startLongitude} ${runwayList[runway].endLatitude} ${runwayList[runway].endLongitude} ${runwayList[runway].airport}`);
        }

        return ret.join("\n");
    },
    getArtcc() {
        // download vatspy boundaries
        const contents = downloadFileSync("https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/Boundaries.geojson");

        var artcc = {};

        const geojson = JSON.parse(contents);
        geojson.features.forEach(e => {
            if (
                e.properties.id.startsWith("RK") ||
                e.properties.id.startsWith("RJ") ||
                e.properties.id.startsWith("RORG") ||
                e.properties.id.startsWith("ZSHA") ||
                e.properties.id.startsWith("ZYSH") ||
                e.properties.id.startsWith("UHHH") ||
                e.properties.id.startsWith("ZKKP")
            ) {
                artcc[e.properties.id] = e.geometry.coordinates[0][0];
            }
        });

        var ret = [];

        for (var ctr in artcc) {
            for (var b = 0; b < artcc[ctr].length - 1; b++) {
                ret.push(`${ctr} ${util.convertDecimalToMinutes(artcc[ctr][b][1], "NS")} ${util.convertDecimalToMinutes(artcc[ctr][b][0], "EW")} ${util.convertDecimalToMinutes(artcc[ctr][b + 1][1], "NS")} ${util.convertDecimalToMinutes(artcc[ctr][b + 1][0], "EW")}`)
            }
        }

        return ret.join("\n");
    },
    getTracon() {
        // download vatsim tracon boundaries
        const contents = downloadFileSync("https://raw.githubusercontent.com/vatsimnetwork/simaware-tracon-project/main/TRACONBoundaries.geojson");

        var tracon = {};

        const geojson = JSON.parse(contents);
        geojson.features.forEach(e => {
            if (e.properties.id.startsWith("RK")) {
                tracon[e.properties.id] = e.geometry.coordinates[0][0];
            }
        });

        var ret = [];

        for (var app in tracon) {
            for (var b = 0; b < tracon[app].length - 1; b++) {
                ret.push(`${app}_APP ${util.convertDecimalToMinutes(tracon[app][b][1], "NS")} ${util.convertDecimalToMinutes(tracon[app][b][0], "EW")} ${util.convertDecimalToMinutes(tracon[app][b + 1][1], "NS")} ${util.convertDecimalToMinutes(tracon[app][b + 1][0], "EW")}`)
            }
        }

        return ret.join("\n");
    },
    generateSectorFile() {
        var contents = "";

        contents += this.getLicenseAndComment();

        contents += this.getColorDefinition();

        contents += "\n\n[INFO]\n";
        contents += this.getInfo();

        contents += "\n\n[VOR]\n";
        contents += this.getVor();

        contents += "\n\n[NDB]\n";
        contents += this.getNdb();

        contents += "\n\n[FIXES]\n";
        contents += this.getFix();

        contents += "\n\n[RUNWAY]\n";
        contents += this.getRunway();

        contents += "\n\n[AIRPORT]\n";
        contents += this.getAirport();

        contents += "\n\n[ARTCC]\n";
        contents += this.getArtcc();

        contents += "\n\n[ARTCC HIGH]\n";
        contents += this.getTracon();

        contents += "\n\n[GEO]\n";
        contents += this.getGeo();

        fs.writeFileSync('vatsim/sector.sct2', contents.split("\n").join("\r\n"));
    }
};