const fs = require('fs');
const path = require('path');
const util = require('./util.js');

const positionList = require('./database/position.json');
const handoffList = require('./database/handoff.json');

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

function getOwnerID(artccName) {
    if (artccName == "RKRR")
        return "";

    return ""
}

function getCtrALT(artccName) {
    if (artccName == "RKRR" || artccName == "RKRR_N" || artccName == "RKRR_S" || artccName == "RKDA" || artccName == "RKDA_W" || artccName == "RKDA_E" || artccName == "RKDA_C")
        return ":60000";

    return ":18500"
}

module.exports = {
    initialize() {
        if (!fs.existsSync('vatsim')) {
            fs.mkdirSync('vatsim');
        }
    },
    getCopx() {
        var ret = [];

        for (var copxname in handoffList) {
            var e = handoffList[copxname];

            ret.push([
                "COPX",
                e.departure,
                e.departureRunway,
                e.fix,
                e.arrival,
                e.arrivalRunway,
                e.from,
                e.to,
                e.climb,
                e.descend,
                e.fix
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
                e.squawkStart || '0000',
                e.squawkEnd || '7777'
            ].join(":"));
        }

        return ret.join("\n");
    },
    getSidStar() {
        var ret = [];

        // SID only
        procedureList.filter(e => e.procedureType == "SID").forEach(e => {
            e.runway.forEach(r => {
                ret.push(["SID", e.airport, r, e.name.split(".").join("t"), getRawCoordRemovedList(e.fixList).join(" ")].join(":"));
            });
        });

        // APPROACH only
        procedureList.filter(e => e.procedureType == "APPROACH").forEach(e => {
            ret.push(["STAR", e.airport, e.runway, e.name.split(".").join("t"), getRawCoordRemovedList(e.fixList).join(" ")].join(":"));
        });

        // STAR + APPROACH
        procedureList.filter(t => t.procedureType == "APPROACH").forEach(t => {
            procedureList.filter(e => e.procedureType == "STAR" && e.fixList.last() == t.fixList[0] && t.airport == e.airport).forEach(e => {
                ret.push(["STAR", t.airport, t.runway, `${e.name.split(".").join("t")}a${t.name.split(".").join("t")}`, getRawCoordRemovedList(e.fixList.concat(t.fixList)).join(" ")].join(":"));
            });
        });

        return ret.join("\n");
    },
    getAirspace() {
        var tracon = {
            "RKPC": undefined,
            "RKPK": undefined,
            "RKSS": undefined,
            "RKRR_N": undefined,
            "RKRR_S": undefined,
            "RKDA_W": undefined,
            "RKDA_E": undefined,
            "RKDA_C": undefined,
            "RKDA": undefined,
            "RKRR": undefined
        };

        // get tracon
        fs.readdirSync('./database/airspace').forEach(e => {
            var fileInfo = path.parse(e);

            if (fileInfo.ext != ".geojson")
                return;

            if (fileInfo.name == "FIR")
                return;

            if (fileInfo.name == "BravoAirspace")
                return;

            var airportName = fileInfo.name;
            var t = JSON.parse(fs.readFileSync('./database/airspace/' + e)).geometry.coordinates[0][0];
            tracon[airportName] = t;
        });

        // get fir
        var geojson = require('./temp/boundaries.json');

        geojson.features.forEach(e => {
            if (e.properties.id.startsWith("RK")) {
                tracon[e.properties.id.split("-").join("_")] = e.geometry.coordinates[0][0];
            }
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
                `SECTOR:${app}_TMA:0${getCtrALT(app)}\n` +
                `OWNER:${getInitialID(app)}${getOwnerID(app)}\n` +
                `BORDER:${app}_TMA_BORDER\n`
            )
        }

        return ret.join("\n") + additionalRet.join("\n");
    },
    generateEseFile() {
        var contents = "";

        contents += "[POSITIONS]\n";
        contents += this.getPosition();

        contents += "\n\n[SIDSSTARS]\n";
        contents += this.getSidStar();



        contents += "\n\n[AIRSPACE]\n";
        // sector manual input start by HJ due to sequence issues.
        contents += "CIRCLE_SECTORLINE:RKSI_TWR:RKSI:5\n";
        contents += "CIRCLE_SECTORLINE:RKSS_TWR:RKSS:5\n";
        contents += "CIRCLE_SECTORLINE:RKPK_TWR:RKPK:5\n";
        contents += "CIRCLE_SECTORLINE:RKPC_TWR:RKPC:5\n";

        contents += ";-MINOR CIRCLE TOWER\n";
        contents += "CIRCLE_SECTORLINE:ZKPY_TWR:ZKPY:5\n";
        contents += "CIRCLE_SECTORLINE:RKJB_TWR:RKJB:5\n";
        contents += "CIRCLE_SECTORLINE:RKJJ_TWR:RKJJ:5\n";
        contents += "CIRCLE_SECTORLINE:RKJK_TWR:RKJK:5\n";
        contents += "CIRCLE_SECTORLINE:RKJY_TWR:RKJY:5\n";
        contents += "CIRCLE_SECTORLINE:RKNW_TWR:RKNW:5\n";
        contents += "CIRCLE_SECTORLINE:RKNY_TWR:RKNY:5\n";
        contents += "CIRCLE_SECTORLINE:RKPD_TWR:RKPD:5\n";
        contents += "CIRCLE_SECTORLINE:RKPS_TWR:RKPS:5\n";
        contents += "CIRCLE_SECTORLINE:RKPU_TWR:RKPU:5\n";
        contents += "CIRCLE_SECTORLINE:RKSM_TWR:RKSM:5\n";
        contents += "CIRCLE_SECTORLINE:RKTH_TWR:RKTH:5\n";
        contents += "CIRCLE_SECTORLINE:RKTL_TWR:RKTL:5\n";
        contents += "CIRCLE_SECTORLINE:RKTN_TWR:RKTN:5\n";
        contents += "CIRCLE_SECTORLINE:RKTU_TWR:RKTU:5\n";
        contents += "CIRCLE_SECTORLINE:RKTU_TWR:RKTU:10\n";




        contents += ";-MINOR TOWER SECTOR\n";

        contents += "SECTOR:ZKPY_TWR:0:3000\n";
        contents += "OWNER:PYT:PYA:PY\n";
        contents += "BORDER:ZKPY_TWR\n";

        contents += "SECTOR:RKJB_TWR:0:3000\n";
        contents += "OWNER:JBT:JJA\n";
        contents += "BORDER:RKJB_TWR\n";

        contents += "SECTOR:RKJJ_TWR:0:4000\n";
        contents += "OWNER:JJT:JJA\n";
        contents += "BORDER:RKJJ_TWR\n";

        contents += "SECTOR:RKJK_TWR:0:5000\n";
        contents += "OWNER:JKT:JKA\n";
        contents += "BORDER:RKJK_TWR\n";

        contents += "SECTOR:RKJY_TWR:0:3000\n";
        contents += "OWNER:JYT:JYR:PSA\n";
        contents += "BORDER:RKJY_TWR\n";

        contents += "SECTOR:RKNW_TWR:0:5000\n";
        contents += "OWNER:NWT:NWA\n";
        contents += "BORDER:RKNW_TWR\n";

        contents += "SECTOR:RKNY_TWR:0:3000\n";
        contents += "OWNER:NYT:NNA\n";
        contents += "BORDER:RKNY_TWR\n";

        contents += "SECTOR:RKPD_TWR:0:3000\n";
        contents += "OWNER:PDT:PCA\n";
        contents += "BORDER:RKPD_TWR\n";

        contents += "SECTOR:RKPS_TWR:0:4000\n";
        contents += "OWNER:PST:PSA\n";
        contents += "BORDER:RKPS_TWR\n";

        contents += "SECTOR:RKPU_TWR:0:3000\n";
        contents += "OWNER:PUT:PUR:THA\n";
        contents += "BORDER:RKPU_TWR\n";

        contents += "SECTOR:RKSM_TWR:0:4000\n";
        contents += "OWNER:SMT:SSD:SSA\n";
        contents += "BORDER:RKSM_TWR\n";

        contents += "SECTOR:RKTH_TWR:0:3000\n";
        contents += "OWNER:THT:THA\n";
        contents += "BORDER:RKTH_TWR\n";

        contents += "SECTOR:RKTL_TWR:0:2500\n";
        contents += "OWNER:TLT:TLR:THA\n";
        contents += "BORDER:RKTL_TWR\n";

        contents += "SECTOR:RKTN_TWR:0:4000\n";
        contents += "OWNER:TNT:TNA\n";
        contents += "BORDER:RKTN_TWR\n";

        contents += "SECTOR:RKTU_TWR:0:5000\n";
        contents += "OWNER:TUT:TIA\n";
        contents += "BORDER:RKTU_TWR\n";


        contents += "SECTOR:RKSI_TWR:0:3000\n";
        contents += "OWNER:SIT:SSD:SSA:KRA\n";
        contents += "BORDER:RKSI_TWR\n";

        contents += "SECTOR:RKSS_TWR:0:3000\n";
        contents += "OWNER:SST:SSD:SSA:KRA\n";
        contents += "BORDER:RKSS_TWR\n";

        contents += "SECTOR:RKPC_TWR:0:3000\n";
        contents += "OWNER:PCT:PCA:KRA\n";
        contents += "BORDER:RKPC_TWR\n";

        contents += "SECTOR:RKPK_TWR:0:3000\n";
        contents += "OWNER:PKT:PKA:KRA\n";
        contents += "BORDER:RKPK_TWR\n";


        // sector manual input start





        contents += "\n\n";

        contents += "CIRCLE_SECTORLINE:ZKPY_TMA_BORDER:ZKPY:35\n";

        contents += "SECTOR:ZKPY_APP:0:14000\n";
        contents += "OWNER:PYA:PY\n";
        contents += "BORDER:ZKPY_TMA_BORDER\n";

        contents += "SECTORLINE:RKTH_TMA_T32_BORDER\n";
        contents += "COORD:N36.20.11.000:E128.39.52.000\n";
        contents += "COORD:N36.20.11.000:E129.50.52.000\n";
        contents += "COORD:N35.50.11.000:E129.49.52.000\n";
        contents += "COORD:N36.00.00.000:E129.15.00.000\n";
        contents += "COORD:N36.06.00.000:E129.05.00.000\n";
        contents += "COORD:N36.20.11.000:E128.39.52.000\n";

        contents += "SECTORLINE:RKTH_TMA_T33_BORDER\n";
        contents += "COORD:N36.00.00.000:E129.15.00.000\n";
        contents += "COORD:N35.50.11.000:E129.49.52.000\n";
        contents += "COORD:N35.25.11.000:E129.49.52.000\n";
        contents += "COORD:N35.25.11.000:E129.09.52.000\n";
        contents += "COORD:N35.39.00.000:E129.13.30.000\n";
        contents += "COORD:N35.45.00.000:E129.15.00.000\n";
        contents += "COORD:N36.00.00.000:E129.15.00.000\n";

        contents += "SECTORLINE:RKTH_TMA_T34_BORDER\n";
        contents += "COORD:N36.06.00.000:E129.05.00.000\n";
        contents += "COORD:N36.00.00.000:E129.15.00.000\n";
        contents += "COORD:N35.45.00.000:E129.15.00.000\n";
        contents += "COORD:N35.39.00.000:E129.13.30.000\n";
        contents += "COORD:N35.49.00.000:E129.10.00.000\n";
        contents += "COORD:N35.54.13.000:E129.04.52.000\n";
        contents += "COORD:N36.06.00.000:E129.05.00.000\n";

        contents += "SECTORLINE:RKTH_TMA_T42_BORDER\n";
        contents += "COORD:N037.07.10.000:E129.16.04.000\n";
        contents += "COORD:N037.07.10.000:E129.50.51.000\n";
        contents += "COORD:N036.20.11.000:E129.50.52.000\n";
        contents += "COORD:N036.20.11.000:E129.26.07.000\n";
        contents += "COORD:N036.35.30.000:E129.26.07.000\n";
        contents += "COORD:N036.56.31.000:E129.16.04.000\n";
        contents += "COORD:N037.07.10.000:E129.16.04.000\n";

        contents += "SECTORLINE:RKTY_TMA_T36_BORDER\n";
        contents += "COORD:N37.07.10.000:E128.40.52.000\n";
        contents += "COORD:N37.07.10.000:E129.16.04.000\n";
        contents += "COORD:N36.56.31.000:E129.16.04.000\n";
        contents += "COORD:N36.35.30.000:E129.26.07.000\n";
        contents += "COORD:N36.20.11.000:E129.26.07.000\n";
        contents += "COORD:N36.20.11.000:E128.39.52.000\n";
        contents += "COORD:N36.29.11.000:E128.23.52.000\n";
        contents += "COORD:N36.29.11.000:E128.09.52.000\n";
        contents += "COORD:N36.50.10.000:E128.09.52.000\n";
        contents += "COORD:N36.45.40.000:E128.17.52.000\n";
        contents += "COORD:N36.48.10.000:E128.27.52.000\n";
        contents += "COORD:N36.57.10.000:E128.40.52.000\n";
        contents += "COORD:N37.07.10.000:E128.40.52.000\n";

        contents += "SECTORLINE:RKPS_TMA_T30_BORDER\n";
        contents += "COORD:N35.09.11.000:E127.18.52.000\n";
        contents += "COORD:N35.13.11.000:E127.38.52.000\n";
        contents += "COORD:N34.44.11.000:E127.18.53.000\n";
        contents += "COORD:N35.09.11.000:E127.18.52.000\n";

        contents += "SECTORLINE:RKPS_TMA_T31_BORDER\n";
        contents += "COORD:N35.30.11.000:E127.49.52.000\n";
        contents += "COORD:N35.30.11.000:E128.29.52.000\n";
        contents += "COORD:N34.15.12.000:E128.29.52.000\n";
        contents += "COORD:N34.15.11.000:E126.59.53.000\n";
        contents += "COORD:N35.30.11.000:E127.49.52.000\n";

        contents += "SECTORLINE:RKTN_TMA_T35_BORDER\n";
        contents += "COORD:N36.29.11.000:E128.09.52.000\n";
        contents += "COORD:N36.29.11.000:E128.23.52.000\n";
        contents += "COORD:N36.20.11.000:E128.39.52.000\n";
        contents += "COORD:N36.06.00.000:E129.05.00.000\n";
        contents += "COORD:N35.54.13.000:E129.04.52.000\n";
        contents += "COORD:N35.49.00.000:E129.10.00.000\n";
        contents += "COORD:N35.39.00.000:E129.13.30.000\n";
        contents += "COORD:N35.25.11.000:E129.09.52.000\n";
        contents += "COORD:N35.25.11.000:E129.05.22.000\n";
        contents += "COORD:N35.30.11.000:E129.01.52.000\n";
        contents += "COORD:N35.30.12.000:E128.46.26.000\n";
        contents += "COORD:N35.28.47.000:E128.33.40.000\n";
        contents += "COORD:N35.30.11.000:E128.29.52.000\n";
        contents += "COORD:N35.30.11.000:E127.49.52.000\n";
        contents += "COORD:N35.45.11.000:E127.36.52.000\n";
        contents += "COORD:N36.12.11.000:E127.36.52.000\n";
        contents += "COORD:N36.07.11.000:E127.49.52.000\n";
        contents += "COORD:N36.23.11.000:E128.09.52.000\n";
        contents += "COORD:N36.29.11.000:E128.09.52.000\n";

        contents += "SECTORLINE:RKTI_TMA_T18_BORDER\n";
        contents += "COORD:N37.06.40.000:E127.39.52.000\n";
        contents += "COORD:N37.07.10.000:E127.50.52.000\n";
        contents += "COORD:N37.10.10.000:E127.54.52.000\n";
        contents += "COORD:N37.14.10.000:E128.03.52.000\n";
        contents += "COORD:N37.31.10.000:E128.18.52.000\n";
        contents += "COORD:N37.33.10.000:E128.36.22.000\n";
        contents += "COORD:N37.07.10.000:E128.40.52.000\n";
        contents += "COORD:N36.57.10.000:E128.40.52.000\n";
        contents += "COORD:N36.50.10.000:E128.09.52.000\n";
        contents += "COORD:N37.06.40.000:E127.39.52.000\n";

        contents += "SECTORLINE:RKTI_TMA_T19_BORDER\n";
        contents += "COORD:N37.06.40.000:E127.39.52.000\n";
        contents += "COORD:N36.50.10.000:E128.09.52.000\n";
        contents += "COORD:N36.44.58.000:E127.57.52.000\n";
        contents += "COORD:N36.29.11.000:E127.50.52.000\n";
        contents += "COORD:N36.29.11.000:E128.09.52.000\n";
        contents += "COORD:N36.23.11.000:E128.09.52.000\n";
        contents += "COORD:N36.07.11.000:E127.49.52.000\n";
        contents += "COORD:N36.12.11.000:E127.36.52.000\n";
        contents += "COORD:N36.23.11.000:E127.03.52.000\n";
        contents += "COORD:N36.50.10.000:E127.39.52.000\n";
        contents += "COORD:N37.06.40.000:E127.39.52.000\n";

        contents += "SECTORLINE:RKTI_TMA_T20_BORDER\n";
        contents += "COORD:N36.44.58.000:E127.57.52.000\n";
        contents += "COORD:N36.50.10.000:E128.09.52.000\n";
        contents += "COORD:N36.29.11.000:E128.09.52.000\n";
        contents += "COORD:N36.29.11.000:E127.50.52.000\n";
        contents += "COORD:N36.44.58.000:E127.57.52.000\n";

        contents += "SECTORLINE:RKTI_TMA_T17_BORDER\n";
        contents += "COORD:N37.02.10.000:E127.39.52.000\n";
        contents += "COORD:N36.50.10.000:E127.39.52.000\n";
        contents += "COORD:N36.23.11.000:E127.03.52.000\n";
        contents += "COORD:N36.40.10.000:E127.04.52.000\n";
        contents += "COORD:N37.02.10.000:E127.39.52.000\n";

        contents += "SECTORLINE:RKTI_TMA_T21_BORDER\n";
        contents += "COORD:N37.06.40.000:E127.39.52.000\n";
        contents += "COORD:N37.10.10.000:E127.45.52.000\n";
        contents += "COORD:N37.10.10.000:E127.54.52.000\n";
        contents += "COORD:N37.07.10.000:E127.50.52.000\n";
        contents += "COORD:N37.06.40.000:E127.39.52.000\n";

        contents += "SECTORLINE:RKTI_TMA_T22_BORDER\n";
        contents += "COORD:N36.50.10.000:E128.09.52.000\n";
        contents += "COORD:N36.57.10.000:E128.40.52.000\n";
        contents += "COORD:N36.48.10.000:E128.27.52.000\n";
        contents += "COORD:N36.45.40.000:E128.17.52.000\n";
        contents += "COORD:N36.50.10.000:E128.09.52.000\n";




        contents += ";-MINOR APPROACH SECTOR\n";
        contents += "SECTOR:RKTH_TMA:0:10500\n";
        contents += "OWNER:THR:THA\n";
        contents += "BORDER:RKTH_TMA_T32_BORDER\n";

        contents += "SECTOR:RKTH_TMA:0:10500\n";
        contents += "OWNER:PUR:THA\n";
        contents += "BORDER:RKTH_TMA_T33_BORDER\n";

        contents += "SECTOR:RKTH_TMA:0:7500\n";
        contents += "OWNER:THA\n";
        contents += "BORDER:RKTH_TMA_T34_BORDER\n";

        contents += "SECTOR:RKTH_TMA:0:9500\n";
        contents += "OWNER:TLR:THA\n";
        contents += "BORDER:RKTH_TMA_T42_BORDER\n";

        contents += "SECTOR:RKPS_TMA:0:13500\n";
        contents += "OWNER:PSA\n";
        contents += "BORDER:RKPS_TMA_T30_BORDER\n";

        contents += "SECTOR:RKPS_TMA:0:19500\n";
        contents += "OWNER:JYR:PSA\n";
        contents += "BORDER:RKPS_TMA_T31_BORDER\n";

        contents += "SECTOR:RKTY_TMA:0:18500\n";
        contents += "OWNER:TYA\n";
        contents += "BORDER:RKTY_TMA_T36_BORDER\n";

        contents += "SECTOR:RKTN_TMA:0:18500\n";
        contents += "OWNER:TNA\n";
        contents += "BORDER:RKTN_TMA_T35_BORDER\n";

        contents += "SECTOR:RKTI_TMA:0:17500\n";
        contents += "OWNER:TIA\n";
        contents += "BORDER:RKTI_TMA_T18_BORDER\n";

        contents += "SECTOR:RKTI_TMA:0:14500\n";
        contents += "OWNER:TIA\n";
        contents += "BORDER:RKTI_TMA_T19_BORDER\n";

        contents += "SECTOR:RKTI_TMA:0:14500\n";
        contents += "OWNER:TIA\n";
        contents += "BORDER:RKTI_TMA_T20_BORDER\n";

        contents += "SECTOR:RKTI_TMA:0:6500\n";
        contents += "OWNER:TIA\n";
        contents += "BORDER:RKTI_TMA_T17_BORDER\n";

        contents += "SECTOR:RKTI_TMA:0:3500\n";
        contents += "OWNER:TIA\n";
        contents += "BORDER:RKTI_TMA_T21_BORDER\n";

        contents += "SECTOR:RKTI_TMA:0:17500\n";
        contents += "OWNER:TIA\n";
        contents += "BORDER:RKTI_TMA_T22_BORDER\n";
        contents += "\n";
        //RKRR_A_TMA MANUAL INPUT START
        contents += "SECTORLINE:RKRR_A_TMA_BORDER\n"
        contents += "DISPLAY:RKRR_A_TMA:RKRR_A_TMA:RKRR_A_CTR\n"
        contents += "COORD:N038.00.00.000:E124.00.00.000\n";
        contents += "COORD:N038.00.00.000:E124.50.59.999\n";
        contents += "COORD:N037.57.09.999:E124.54.09.998\n";
        contents += "COORD:N037.52.30.000:E124.53.29.999\n";
        contents += "COORD:N037.45.29.998:E124.57.19.998\n";
        contents += "COORD:N037.37.00.000:E125.09.09.998\n";
        contents += "COORD:N037.36.59.981:E125.19.33.827\n";
        contents += "COORD:N037.38.07.432:E125.22.56.840\n";
        contents += "COORD:N037.41.11.141:E125.31.27.207\n";
        contents += "COORD:N037.43.07.873:E125.45.15.942\n";
        contents += "COORD:N037.39.50.768:E126.01.06.195\n";
        contents += "COORD:N037.43.34.664:E126.10.47.039\n";
        contents += "COORD:N037.48.54.422:E126.12.36.474\n";
        contents += "COORD:N037.50.49.998:E126.21.19.998\n";
        contents += "COORD:N037.50.49.998:E126.26.19.998\n";
        contents += "COORD:N037.46.19.999:E126.35.30.000\n";
        contents += "COORD:N037.48.29.998:E126.41.00.000\n";
        contents += "COORD:N037.57.09.999:E126.41.00.000\n";
        contents += "COORD:N037.58.00.000:E126.47.10.000\n";
        contents += "COORD:N038.02.29.998:E126.52.09.998\n";
        contents += "COORD:N038.06.00.000:E126.52.39.999\n";
        contents += "COORD:N038.08.40.000:E126.57.39.999\n";
        contents += "COORD:N038.13.00.000:E126.58.10.000\n";
        contents += "COORD:N038.19.09.998:E127.08.29.999\n";
        contents += "COORD:N038.20.30.000:E127.14.00.000\n";
        contents += "COORD:N038.19.20.000:E127.17.59.999\n";
        contents += "COORD:N038.20.00.000:E127.23.29.999\n";
        contents += "COORD:N038.18.09.997:E127.30.30.000\n";
        contents += "COORD:N038.20.00.000:E127.34.09.998\n";
        contents += "COORD:N038.20.19.999:E127.39.52.000\n";
        contents += "COORD:N038.20.49.998:E127.47.10.000\n";
        contents += "COORD:N038.19.09.998:E127.49.20.000\n";
        contents += "COORD:N038.20.00.000:E127.53.29.999\n";
        contents += "COORD:N038.19.00.000:E128.02.49.998\n";
        contents += "COORD:N038.20.19.998:E128.08.09.999\n";
        contents += "COORD:N038.24.40.000:E128.15.20.000\n";
        contents += "COORD:N038.28.19.998:E128.18.00.000\n";
        contents += "COORD:N038.35.49.998:E128.18.50.000\n";
        contents += "COORD:N038.37.59.999:E128.22.00.000\n";
        contents += "COORD:N038.38.09.959:E133.38.49.959\n";
        contents += "COORD:N038.00.10.000:E132.59.49.999\n";
        contents += "COORD:N037.30.10.000:E132.59.49.999\n";
        contents += "COORD:N035.31.41.628:E130.19.48.216\n";
        contents += "COORD:N034.40.00.001:E129.10.00.001\n";
        contents += "COORD:N032.30.00.000:E127.30.00.000\n";
        contents += "COORD:N032.30.00.000:E126.49.59.998\n";
        contents += "COORD:N030.00.00.000:E125.25.00.001\n";
        contents += "COORD:N030.00.00.000:E124.00.00.000\n";
        contents += "COORD:N036.21.35.999:E124.00.00.000\n";
        contents += "COORD:N038.00.00.000:E124.00.00.000\n";
        contents += "COORD:N038.00.00.000:E124.00.00.000\n";
        contents += "\n";
        //RKRR_A_TMA MANUAL INPUT END

        contents += this.getAirspace();
        contents += "\n";
        contents += "SECTOR:RKRR_A_TMA:0:60000\n"
        contents += "OWNER:KRA\n"
        contents += "BORDER:RKRR_A_TMA_BORDER\n"

        contents += "\n\n";
        contents += "SECTORLINE:ZKKP_TMA_BORDER\n";
        contents += "DISPLAY:ZKKP_TMA:ZKKP_TMA:ZKKP_CTR\n"
        contents += "COORD:N038.00.00.000:E124.00.00.000\n";
        contents += "COORD:N039.49.41.002:E124.10.05.988\n";
        contents += "COORD:N040.00.00.000:E124.20.60.000\n";
        contents += "COORD:N040.04.00.001:E124.19.59.988\n";
        contents += "COORD:N040.28.00.001:E124.54.00.000\n";
        contents += "COORD:N040.52.59.999:E125.46.59.988\n";
        contents += "COORD:N040.53.41.420:E125.59.24.371\n";
        contents += "COORD:N041.04.59.999:E126.06.59.976\n";
        contents += "COORD:N041.22.00.001:E126.30.59.976\n";
        contents += "COORD:N041.37.00.001:E126.35.60.000\n";
        contents += "COORD:N041.45.00.000:E126.42.00.000\n";
        contents += "COORD:N041.40.59.999:E126.46.59.988\n";
        contents += "COORD:N041.47.60.000:E126.55.59.988\n";
        contents += "COORD:N041.42.08.071:E127.03.51.890\n";
        contents += "COORD:N041.40.08.090:E127.02.51.900\n";
        contents += "COORD:N041.36.08.129:E127.10.51.859\n";
        contents += "COORD:N041.32.35.092:E127.05.58.819\n";
        contents += "COORD:N041.28.00.001:E127.31.59.988\n";
        contents += "COORD:N041.25.00.001:E127.39.00.000\n";
        contents += "COORD:N041.26.05.161:E127.55.06.532\n";
        contents += "COORD:N041.22.00.001:E128.06.59.976\n";
        contents += "COORD:N041.23.60.000:E128.12.59.976\n";
        contents += "COORD:N041.34.00.001:E128.18.59.976\n";
        contents += "COORD:N041.37.00.001:E128.18.00.000\n";
        contents += "COORD:N041.43.00.001:E128.10.59.988\n";
        contents += "COORD:N041.47.60.000:E128.04.59.988\n";
        contents += "COORD:N041.52.59.999:E128.04.59.988\n";
        contents += "COORD:N042.00.00.000:E128.01.59.988\n";
        contents += "COORD:N042.01.59.999:E128.18.00.000\n";
        contents += "COORD:N042.01.30.000:E128.56.60.000\n";
        contents += "COORD:N042.04.59.999:E128.57.59.976\n";
        contents += "COORD:N042.08.60.000:E129.04.59.988\n";
        contents += "COORD:N042.08.60.000:E129.09.00.000\n";
        contents += "COORD:N042.13.00.001:E129.12.59.976\n";
        contents += "COORD:N042.22.00.001:E129.13.59.988\n";
        contents += "COORD:N042.27.00.000:E129.24.59.976\n";
        contents += "COORD:N042.22.07.950:E129.33.50.872\n";
        contents += "COORD:N042.28.07.910:E129.37.50.830\n";
        contents += "COORD:N042.26.07.930:E129.39.50.821\n";
        contents += "COORD:N042.27.07.931:E129.43.50.801\n";
        contents += "COORD:N042.34.00.001:E129.45.00.000\n";
        contents += "COORD:N043.00.07.690:E129.52.50.660\n";
        contents += "COORD:N043.01.07.691:E129.57.50.630\n";
        contents += "COORD:N042.59.07.699:E129.57.50.630\n";
        contents += "COORD:N042.59.07.721:E130.07.50.570\n";
        contents += "COORD:N042.54.07.751:E130.06.50.591\n";
        contents += "COORD:N042.54.07.769:E130.16.20.528\n";
        contents += "COORD:N042.43.54.772:E130.14.27.611\n";
        contents += "COORD:N042.36.07.920:E130.25.50.520\n";
        contents += "COORD:N042.33.03.899:E130.25.48.439\n";
        contents += "COORD:N042.32.60.000:E130.28.30.000\n";
        contents += "COORD:N042.37.00.001:E130.28.59.988\n";
        contents += "COORD:N042.36.07.920:E130.30.50.490\n";
        contents += "COORD:N042.26.08.009:E130.34.50.491\n";
        contents += "COORD:N042.23.60.000:E130.39.00.000\n";
        contents += "COORD:N042.22.00.001:E130.40.00.001\n";
        contents += "COORD:N042.17.35.999:E130.41.48.001\n";
        contents += "COORD:N042.09.08.161:E130.52.50.419\n";
        contents += "COORD:N041.40.08.429:E131.30.50.260\n";
        contents += "COORD:N040.30.09.000:E135.55.49.001\n";
        contents += "COORD:N040.00.19.548:E135.19.19.056\n";
        contents += "COORD:N039.49.49.001:E135.05.13.999\n";
        contents += "COORD:N038.38.09.960:E133.38.49.960\n";
        contents += "COORD:N038.37.60.000:E128.22.00.000\n";
        contents += "COORD:N038.35.49.998:E128.18.50.000\n";
        contents += "COORD:N038.28.19.998:E128.18.00.000\n";
        contents += "COORD:N038.24.40.000:E128.15.20.000\n";
        contents += "COORD:N038.20.19.998:E128.08.10.000\n";
        contents += "COORD:N038.19.00.000:E128.02.49.998\n";
        contents += "COORD:N038.19.60.000:E127.53.29.999\n";
        contents += "COORD:N038.19.09.998:E127.49.20.000\n";
        contents += "COORD:N038.20.49.998:E127.47.10.000\n";
        contents += "COORD:N038.20.20.000:E127.39.52.000\n";
        contents += "COORD:N038.19.60.000:E127.34.09.999\n";
        contents += "COORD:N038.18.09.998:E127.30.30.000\n";
        contents += "COORD:N038.19.60.000:E127.23.29.999\n";
        contents += "COORD:N038.19.20.000:E127.17.59.999\n";
        contents += "COORD:N038.20.30.000:E127.13.60.000\n";
        contents += "COORD:N038.19.09.998:E127.08.29.999\n";
        contents += "COORD:N038.13.00.000:E126.58.10.000\n";
        contents += "COORD:N038.08.40.000:E126.57.39.999\n";
        contents += "COORD:N038.06.00.000:E126.52.40.000\n";
        contents += "COORD:N038.02.29.999:E126.52.09.999\n";
        contents += "COORD:N037.58.00.000:E126.47.10.000\n";
        contents += "COORD:N037.57.09.999:E126.40.60.000\n";
        contents += "COORD:N037.48.29.999:E126.40.60.000\n";
        contents += "COORD:N037.46.20.000:E126.35.30.000\n";
        contents += "COORD:N037.50.49.998:E126.26.19.998\n";
        contents += "COORD:N037.50.49.998:E126.21.19.999\n";
        contents += "COORD:N037.48.54.423:E126.12.36.475\n";
        contents += "COORD:N037.43.34.664:E126.10.47.040\n";
        contents += "COORD:N037.39.50.769:E126.01.06.196\n";
        contents += "COORD:N037.43.07.873:E125.45.15.943\n";
        contents += "COORD:N037.41.11.142:E125.31.27.207\n";
        contents += "COORD:N037.38.07.433:E125.22.56.841\n";
        contents += "COORD:N037.36.59.982:E125.19.33.828\n";
        contents += "COORD:N037.37.00.000:E125.09.09.998\n";
        contents += "COORD:N037.45.29.998:E124.57.19.998\n";
        contents += "COORD:N037.52.30.000:E124.53.29.999\n";
        contents += "COORD:N037.57.09.999:E124.54.09.998\n";
        contents += "COORD:N038.00.00.000:E124.50.60.000\n";
        contents += "COORD:N038.00.00.000:E124.00.00.000\n";
        contents += "\n\n";
        contents += "\nSECTOR:ZKKP_TMA:0:60000\n";
        contents += "OWNER:PY\n";
        contents += "BORDER:ZKKP_TMA_BORDER\n";



        ////Sector manual input END


        // COPX ADD LINE
        contents += "\n\n;-COPX START\n\n";
        contents += this.getCopx();
        contents += "\n\n;-COPX END\n\n";


        fs.writeFileSync('vatsim/sector.ese', contents.split("\n").join("\r\n"));
    }
};
