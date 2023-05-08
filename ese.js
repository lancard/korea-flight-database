const fs = require('fs');
const path = require('path');
const util = require('./util.js');

const positionList = require('./database/position.json');
const copxList = require('./database/copx.json');


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
    getCopx() {
        var ret = [];

        for (var copxname in copxList) {
            var e = copxList[copxname];

            ret.push([
                e.COPX,
                e.DEP,
                e.DEPRWY,
                e.FIX,
                e.ARR,
                e.ARRRWY,
                e.FROM,
                e.TO,
                e.CLB,
                e.DES,
                e.FIX
            ].join(":"));
        }

        return ret.join("\n");
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

            if (fileInfo.name == "FIR")
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
                `OWNER:${getInitialID(app)}:KRA\n` +
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
        
        //Sector manual input start
        contents +="\n\n"
        contents += "SECTORLINE:RKTH_TMA_T32_BORDER\n"
        contents += "COORD:N36.20.11.000:E128.39.52.000\n"
        contents += "COORD:N36.20.11.000:E129.50.52.000\n"
        contents += "COORD:N35.50.11.000:E129.49.52.000\n"
        contents += "COORD:N36.0.0.000:E129.15.0.000\n"
        contents += "COORD:N36.6.0.000:E129.5.0.000\n"
        contents += "COORD:N36.20.11.000:E128.39.52.000\n"

        contents += "SECTORLINE:RKTH_TMA_T33_BORDER\n"
        contents += "COORD:N36.0.0.000:E129.15.0.000\n"
        contents += "COORD:N35.50.11.000:E129.49.52.000\n"
        contents += "COORD:N35.25.11.000:E129.49.52.000\n"
        contents += "COORD:N35.25.11.000:E129.9.52.000\n"
        contents += "COORD:N35.39.0.000:E129.13.30.000\n"
        contents += "COORD:N35.45.0.000:E129.15.0.000\n"
        contents += "COORD:N36.0.0.000:E129.15.0.000\n"

        contents += "SECTORLINE:RKTH_TMA_T34_BORDER\n"
        contents += "COORD:N36.6.0.000:E129.5.0.000\n"
        contents += "COORD:N36.0.0.000:E129.15.0.000\n"
        contents += "COORD:N35.45.0.000:E129.15.0.000\n"
        contents += "COORD:N35.39.0.000:E129.13.30.000\n"
        contents += "COORD:N35.49.0.000:E129.10.0.000\n"
        contents += "COORD:N35.54.13.000:E129.4.52.000\n"
        contents += "COORD:N36.6.0.000:E129.5.0.000\n"

        contents += "SECTORLINE:RKTH_TMA_T42_BORDER\n"
        contents += "COORD:N037.07.10.000:E129.16.04.000\n"
        contents += "COORD:N037.07.10.000:E129.50.51.000\n"
        contents += "COORD:N036.20.11.000:E129.50.52.000\n"
        contents += "COORD:N036.20.11.000:E129.26.07.000\n"
        contents += "COORD:N036.35.30.000:E129.26.07.000\n"
        contents += "COORD:N036.56.31.000:E129.16.04.000\n"
        contents += "COORD:N037.07.10.000:E129.16.04.000\n"

        contents += "SECTORLINE:RKTY_TMA_T36_BORDER\n"
        contents += "COORD:N37.7.10.000:E128.40.52.000\n"
        contents += "COORD:N37.7.10.000:E129.16.4.000\n"
        contents += "COORD:N36.56.31.000:E129.16.4.000\n"
        contents += "COORD:N36.35.30.000:E129.26.7.000\n"
        contents += "COORD:N36.20.11.000:E129.26.7.000\n"
        contents += "COORD:N36.20.11.000:E128.39.52.000\n"
        contents += "COORD:N36.29.11.000:E128.23.52.000\n"
        contents += "COORD:N36.29.11.000:E128.9.52.000\n"
        contents += "COORD:N36.50.10.000:E128.9.52.000\n"
        contents += "COORD:N36.45.40.000:E128.17.52.000\n"
        contents += "COORD:N36.48.10.000:E128.27.52.000\n"
        contents += "COORD:N36.57.10.000:E128.40.52.000\n"
        contents += "COORD:N37.7.10.000:E128.40.52.000\n"

        contents += "SECTORLINE:RKPS_TMA_T30_BORDER\n"
        contents += "COORD:N35.9.11.000:E127.18.52.000\n"
        contents += "COORD:N35.13.11.000:E127.38.52.000\n"
        contents += "COORD:N34.44.11.000:E127.18.53.000\n"
        contents += "COORD:N35.9.11.000:E127.18.52.000\n"

        contents += "SECTORLINE:RKPS_TMA_T31_BORDER\n"
        contents += "COORD:N35.30.11.000:E127.49.52.000\n"
        contents += "COORD:N35.30.11.000:E128.29.52.000\n"
        contents += "COORD:N34.15.12.000:E128.29.52.000\n"
        contents += "COORD:N34.15.11.000:E126.59.53.000\n"
        contents += "COORD:N35.30.11.000:E127.49.52.000\n"




        contents += "CIRCLE_SECTORLINE:RKSI_TWR:RKSI:5\n"
        contents += "CIRCLE_SECTORLINE:RKSS_TWR:RKSS:5\n"
        contents += "CIRCLE_SECTORLINE:RKPK_TWR:RKPK:5\n"
        contents += "CIRCLE_SECTORLINE:RKPC_TWR:RKPC:5\n"

        contents += ";-MINOR CIRCLE TOWER\n"
        contents += "CIRCLE_SECTORLINE:RKJB_TWR:RKJB:5\n"
        contents += "CIRCLE_SECTORLINE:RKJJ_TWR:RKJJ:5\n"
        contents += "CIRCLE_SECTORLINE:RKJK_TWR:RKJK:5\n"
        contents += "CIRCLE_SECTORLINE:RKJY_TWR:RKJY:5\n"
        contents += "CIRCLE_SECTORLINE:RKNW_TWR:RKNW:5\n"
        contents += "CIRCLE_SECTORLINE:RKNY_TWR:RKNY:5\n"
        contents += "CIRCLE_SECTORLINE:RKPD_TWR:RKPD:5\n"
        contents += "CIRCLE_SECTORLINE:RKPS_TWR:RKPS:5\n"
        contents += "CIRCLE_SECTORLINE:RKPU_TWR:RKPU:5\n"
        contents += "CIRCLE_SECTORLINE:RKSM_TWR:RKSM:5\n"
        contents += "CIRCLE_SECTORLINE:RKTH_TWR:RKTH:5\n"
        contents += "CIRCLE_SECTORLINE:RKTL_TWR:RKTL:5\n"
        contents += "CIRCLE_SECTORLINE:RKTN_TWR:RKTN:5\n"
        contents += "CIRCLE_SECTORLINE:RKTU_TWR:RKTU:5\n"




        contents += ";-MINOR TOWER SECTOR\n"
        contents += "SECTOR:RKJB_TWR:0:3000\n"
        contents += "OWNER:JBT\n"
        contents += "BORDER:RKJB_TWR\n"

        contents += "SECTOR:RKJJ_TWR:0:4000\n"
        contents += "OWNER:JJT\n"
        contents += "BORDER:RKJJ_TWR\n"

        contents += "SECTOR:RKJK_TWR:0:5000\n"
        contents += "OWNER:JKT\n"
        contents += "BORDER:RKJK_TWR\n"

        contents += "SECTOR:RKJY_TWR:0:3000\n"
        contents += "OWNER:JYT\n"
        contents += "BORDER:RKJY_TWR\n"

        contents += "SECTOR:RKNW_TWR:0:5000\n"
        contents += "OWNER:NWT\n"
        contents += "BORDER:RKNW_TWR\n"

        contents += "SECTOR:RKNY_TWR:0:3000\n"
        contents += "OWNER:NYT\n"
        contents += "BORDER:RKNY_TWR\n"

        contents += "SECTOR:RKPD_TWR:0:3000\n"
        contents += "OWNER:PDT\n"
        contents += "BORDER:RKPD_TWR\n"

        contents += "SECTOR:RKPS_TWR:0:4000\n"
        contents += "OWNER:PST\n"
        contents += "BORDER:RKPS_TWR\n"

        contents += "SECTOR:RKPU_TWR:0:3000\n"
        contents += "OWNER:PUT\n"
        contents += "BORDER:RKPU_TWR\n"

        contents += "SECTOR:RKSM_TWR:0:4000\n"
        contents += "OWNER:SMT\n"
        contents += "BORDER:RKSM_TWR\n"

        contents += "SECTOR:RKTH_TWR:0:3000\n"
        contents += "OWNER:THT\n"
        contents += "BORDER:RKTH_TWR\n"

        contents += "SECTOR:RKTL_TWR:0:2500\n"
        contents += "OWNER:TLT\n"
        contents += "BORDER:RKTL_TWR\n"

        contents += "SECTOR:RKTN_TWR:0:4000\n"
        contents += "OWNER:TNT\n"
        contents += "BORDER:RKTN_TWR\n"

        contents += "SECTOR:RKTU_TWR:0:5000\n"
        contents += "OWNER:TUT\n"
        contents += "BORDER:RKTU_TWR\n"


        contents += "SECTOR:RKSI_TWR:0:3000\n"
        contents += "OWNER:SIT:SSD:SSA:KRA\n"
        contents += "BORDER:RKSI_TWR\n"

        contents += "SECTOR:RKSS_TWR:0:3000\n"
        contents += "OWNER:SST:SSD:SSA:KRA\n"
        contents += "BORDER:RKSS_TWR\n"

        contents += "SECTOR:RKPC_TWR:0:3000\n"
        contents += "OWNER:PCT:PCA:KRA\n"
        contents += "BORDER:RKPC_TWR\n"

        contents += "SECTOR:RKPK_TWR:0:3000\n"
        contents += "OWNER:PKT:PKA:KRA\n"
        contents += "BORDER:RKPK_TWR\n"


        contents += ";-MINOR APPROACH SECTOR\n"
        contents += "SECTOR:RKTH_TMA:0:10500\n"
        contents += "OWNER:THR:THA:DGE:DG:KRA\n"
        contents += "BORDER:RKTH_TMA_T32_BORDER\n"
        contents += 
        contents += "SECTOR:RKTH_TMA:0:10500\n"
        contents += "OWNER:PUR:THA:DGE:DG:KRA\n"
        contents += "BORDER:RKTH_TMA_T33_BORDER\n"

        contents += "SECTOR:RKTH_TMA:0:7500\n"
        contents += "OWNER:THA:DGE:DG:KRA\n"
        contents += "BORDER:RKTH_TMA_T34_BORDER\n"

        contents += "SECTOR:RKTH_TMA:0:9500\n"
        contents += "OWNER:TLR:THA:DGE:DG:KRA\n"
        contents += "BORDER:RKTH_TMA_T42_BORDER\n"

        contents += "SECTOR:RKPS_TMA:0:13500\n"
        contents += "OWNER:PSA\n"
        contents += "BORDER:RKPS_TMA_T30_BORDER\n"

        contents += "SECTOR:RKPS_TMA:0:19500\n"
        contents += "OWNER:JYR\n"
        contents += "BORDER:RKPS_TMA_T31_BORDER\n"


        contents += "SECTOR:RKTY_TMA:0:18500\n"
        contents += "OWNER:TYA\n"
        contents += "BORDER:RKTY_TMA_T36_BORDER\n"

        ////Sector manual input END


        // COPX ADD LINE
        contents += "\n\n;-COPX START\n\n"
        contents += this.getCopx();
        contents += "\n\n;-COPX END\n\n"


        fs.writeFileSync('vatsim/sector.ese', contents.split("\n").join("\r\n"));
    }
};
