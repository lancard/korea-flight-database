const fs = require('fs');

module.exports = {
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
            "; ● all airway points (not ground) : by AIP coordination and by Google map coordination (WGS-84)\n" +
            "; ● airports runways and IF/FAF : by AIP coordination and by Google map coordination (WGS-84).\n" +
            "; ● airports and ground aids : by AIP coordination and by Google map coordination (WGS-84).\n" +
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
            ret.push(`${airportList[airport].name} 000.000 ${airportList[airport].latitude} ${airportList[airport].longitude} C`);
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

        contents += "\n\n[AIRPORT]\n";
        contents += this.getAirport();


        contents += "\n\n[GEO]\n";
        contents += this.getGeo();

        fs.writeFileSync('vatsim/sector.sct2', contents);
    }
};