const fs = require('fs');
const path = require('path');
const util = require('./util.js');

function getSidStarLatitudeLongitudeString(fixOrCoord) {
    if (fixOrCoord.length < 10) {
        return `${fixOrCoord.paddingRight(16)}${fixOrCoord.paddingRight(16)}`;
    }

    var arr = fixOrCoord.split(/\s+/);

    return `${arr[0].paddingRight(16)}${arr[1].paddingRight(16)}`;
}

const nearAirportFixRegExpression = /[A-Z][A-Z][0-9][0-9][0-9]/

function nearAirportFix(fix) {
    return nearAirportFixRegExpression.test(fix);
}

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

        for (var airport in airportObject) {
            for (obj in airportObject[airport]) {
                airportObject[airport][obj].lineList.forEach(e => {
                    ret.push(`${e.latitude1} ${e.longitude1} ${e.latitude2} ${e.longitude2} ${airportObject[airport][obj].colorProfile}`);
                });
            }
        }

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

        navaidList.filter(e => e.navaidType == "NDB" || e.navaidType == "VFR_REPORTING_POINT").forEach(e => {
            ret.push(`${e.name} ${e.frequency ? e.frequency : "000.000"} ${e.latitude} ${e.longitude}`);
        });

        // add fixes to ndb (near airport)
        navaidList.filter(e => e.navaidType == "FIX" && nearAirportFix(e.name) && e.isUsedByNavigation).forEach(e => {
            ret.push(`${e.name} ${e.frequency ? e.frequency : "000.000"} ${e.latitude} ${e.longitude}`);
        });

        return ret.join("\n");
    },
    getFix() {
        var ret = [];

        navaidList.filter(e => e.navaidType == "FIX" && !nearAirportFix(e.name) && e.isUsedByNavigation).forEach(e => {
            ret.push(`${e.name} ${e.latitude} ${e.longitude}`);
        });

        return ret.join("\n");
    },
    getAirport() {
        var ret = [];

        for (const airport in airportList) {
            const icaoCode = airportList[airport].icaoCode;

            if (!util.isNearestAirport(icaoCode))
                continue;

            ret.push(`${icaoCode} 000.000 ${airportList[airport].latitude} ${airportList[airport].longitude} C`);
        }

        return ret.join("\n");
    },
    getRunway() {
        var ret = [];

        runwayList.forEach(e => {
            var bearing = util.calculateBearing(
                e.startLatitudeDecimal,
                e.startLongitudeDecimal,
                e.endLatitudeDecimal,
                e.endLongitudeDecimal
            )
            var oppositeBearing = util.calculateBearing(
                e.endLatitudeDecimal,
                e.endLongitudeDecimal,
                e.startLatitudeDecimal,
                e.startLongitudeDecimal
            )

            // magnetic variation
            bearing = +bearing.toFixed(0) + 7;
            oppositeBearing = +oppositeBearing.toFixed(0) + 7;

            ret.push(`${e.runway} ${e.oppositeRunway} ${bearing} ${oppositeBearing} ${e.startLatitude} ${e.startLongitude} ${e.endLatitude} ${e.endLongitude} ${e.airport}`);
        });

        return ret.join("\n");
    },
    getArtcc() {
        var artcc = {};

        const geojson = require('./temp/boundaries.json');

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
        var ret = [];

        // get airport objects from directory
        fs.readdirSync('./database/airspace').forEach(e => {
            var fileInfo = path.parse(e);

            if (fileInfo.ext != ".geojson")
                return;

            var airportName = fileInfo.name;
            var tracon = JSON.parse(fs.readFileSync('./database/airspace/' + e)).geometry.coordinates[0][0];

            for (var b = 0; b < tracon.length - 1; b++) {
                ret.push(`${airportName}_APP ${util.convertDecimalToMinutes(tracon[b][1], "NS")} ${util.convertDecimalToMinutes(tracon[b][0], "EW")} ${util.convertDecimalToMinutes(tracon[b + 1][1], "NS")} ${util.convertDecimalToMinutes(tracon[b + 1][0], "EW")}`)
            }
        });

        return ret.join("\n");
    },
    getSid() {
        var ret = [];

        // SID only
        procedureList.filter(e => e.procedureType == "SID").forEach(e => {
            e.runway.forEach(r => {
                // first fix
                var name = `${e.name}(${r})`;
                ret.push(`${name.substring(0, 26).paddingRight(32)}` +
                    `${runwayOppositeMap[e.airport + "_" + r].latitude.paddingRight(16)}${runwayOppositeMap[e.airport + "_" + r].longitude.paddingRight(16)}` +
                    `${getSidStarLatitudeLongitudeString(e.fixList[0])}`
                );

                // other fix
                for (var a = 0; a < e.fixList.length - 1; a++) {
                    ret.push(`${' '.paddingRight(32)}` +
                        `${getSidStarLatitudeLongitudeString(e.fixList[a])}` +
                        `${getSidStarLatitudeLongitudeString(e.fixList[a + 1])}`
                    );
                }
            });
        });

        return ret.join("\n");
    },
    getStar() {
        var ret = [];

        // STAR only
        procedureList.filter(e => e.procedureType == "STAR").forEach(e => {
            var name = `${e.airport}-${e.name}`;

            for (var a = 0; a < e.fixList.length - 1; a++) {
                ret.push(`${name.substring(0, 26).paddingRight(32)}` +
                    `${getSidStarLatitudeLongitudeString(e.fixList[a])}` +
                    `${getSidStarLatitudeLongitudeString(e.fixList[a + 1])}`
                );

                name = ' ';
            }
        });

        // APPROACH only
        procedureList.filter(e => e.procedureType == "APPROACH").forEach(e => {
            var name = `${e.airport}-${e.name}`;

            // fix
            for (var a = 0; a < e.fixList.length - 1; a++) {
                ret.push(`${name.paddingRight(32)}` +
                    `${getSidStarLatitudeLongitudeString(e.fixList[a])}` +
                    `${getSidStarLatitudeLongitudeString(e.fixList[a + 1])}`
                );

                name = ' ';
            }

            const lastFix = e.fixList[e.fixList.length - 1];

            // other last + runway
            ret.push(`${' '.paddingRight(32)}` +
                `${getSidStarLatitudeLongitudeString(lastFix)}` +
                `${runwayMap[e.airport + "_" + e.runway].latitude.paddingRight(16)}${runwayMap[e.airport + "_" + e.runway].longitude.paddingRight(16)}`
            );
        });

        // STAR + APPROACH
        procedureList.filter(t => t.procedureType == "APPROACH").forEach(t => {
            procedureList.filter(e => e.procedureType == "STAR" && e.fixList.last() == t.fixList[0] && t.airport == e.airport).forEach(e => {
                // first fix
                var name = `${e.name}-${t.name}`;

                // print STAR first
                for (var a = 0; a < e.fixList.length - 1; a++) {
                    ret.push(`${name.paddingRight(32)}` +
                        `${getSidStarLatitudeLongitudeString(e.fixList[a])}` +
                        `${getSidStarLatitudeLongitudeString(e.fixList[a + 1])}`
                    );

                    name = ' ';
                }

                // print APPROACH last
                for (var a = 0; a < t.fixList.length - 1; a++) {
                    ret.push(`${' '.paddingRight(32)}` +
                        `${getSidStarLatitudeLongitudeString(t.fixList[a])}` +
                        `${getSidStarLatitudeLongitudeString(t.fixList[a + 1])}`
                    );
                }

                const lastFix = t.fixList[t.fixList.length - 1];

                // other last + runway
                ret.push(`${' '.paddingRight(32)}` +
                    `${getSidStarLatitudeLongitudeString(lastFix)}` +
                    `${runwayMap[t.airport + "_" + t.runway].latitude.paddingRight(16)}${runwayMap[t.airport + "_" + t.runway].longitude.paddingRight(16)}`
                );
            });
        });

        return ret.join("\n");
    },
    getLowAirway() {
        var ret = [];

        airwayList.filter(e => util.isLowAirway(e.name)).forEach(e => {
            ret.push(`${e.name} ${e.fixStart} ${e.fixStart} ${e.fixEnd} ${e.fixEnd}`);
        });

        return ret.join("\n");
    },
    getHighAirway() {
        var ret = [];

        airwayList.filter(e => !util.isLowAirway(e.name)).forEach(e => {
            ret.push(`${e.name} ${e.fixStart} ${e.fixStart} ${e.fixEnd} ${e.fixEnd}`);
        });

        return ret.join("\n");
    },
    getRegion() {
        var ret = [];

        regionList.forEach(r => {
            var color = r.colorProfile;
            r.fixList.forEach(e => {
                ret.push(`${color} ${e.split(" ")[0]} ${e.split(" ")[1]}`);
                color = '';
            });
        });

        return ret.join("\n");
    },
    getLabel() {
        var ret = [];

        labelList.forEach(e => {
            ret.push(`"${e.name}" ${e.latitude} ${e.longitude} ${e.colorProfile}`);
        });

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

        contents += "\n\n[SID]\n";
        contents += this.getSid();

        contents += "\n\n[STAR]\n";
        contents += this.getStar();

        contents += "\n\n[LOW AIRWAY]\n";
        contents += this.getLowAirway();

        contents += "\n\n[HIGH AIRWAY]\n";
        contents += this.getHighAirway();

        contents += "\n\n[GEO]\n";
        contents += this.getGeo();

        contents += "\n\n[REGIONS]\n";
        contents += this.getRegion();

        contents += "\n\n[LABELS]\n";
        contents += this.getLabel();

        fs.writeFileSync('vatsim/sector.sct2', contents.split("\n").join("\r\n"));
    }
};