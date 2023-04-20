module.exports = {
    convertMinutesToDecimal(str) {
        function MinutesToDecimal(d, m, s) {
            y = parseFloat(d) + parseFloat(m) / 60 + parseFloat(s) / 3600;
            return y;
        };

        var prefix = str[0];

        str = str.substr(1);

        var tokens = str.split(".");

        var ret = MinutesToDecimal(tokens[0], tokens[1], +(tokens[2] + "." + tokens[3]));
        if (prefix == 'S' || prefix == 'W')
            ret = -ret;

        return ret;
    },
    convertDecimalToMinutes(a, sign) {
        function leadingZeros(n, digits) {
            var zero = '';
            n = n.toString();

            if (n.length < digits) {
                for (var i = 0; i < digits - n.length; i++)
                    zero += '0';
            }
            return zero + n;
        }

        var result = sign[0];

        if (a < 0) {
            result = sign[1];
            a = -a;
        }

        var rr;
        var remain = a;

        rr = Math.floor(remain);
        result += leadingZeros(rr, 3);
        remain = remain - rr;

        remain *= 60;
        rr = Math.floor(remain);
        result += "." + leadingZeros(rr, 2);
        remain = remain - rr;


        remain *= 60;
        rr = Math.floor(remain);
        result += "." + leadingZeros(rr, 2);
        remain = remain - rr;

        remain *= 1000;
        rr = Math.floor(remain);
        result += "." + leadingZeros(rr, 3);

        return result;
    },
    calculateBearing(lat1, lon1, lat2, lon2) {
        function convertDegreesToRadians(deg) {
            return (deg * Math.PI / 180.0);
        }

        function convertRadiansToDegrees(rad) {
            return (rad / Math.PI * 180.0);
        }

        lat1 = convertDegreesToRadians(lat1);
        lat2 = convertDegreesToRadians(lat2);
        var delta_lon = convertDegreesToRadians(lon2 - lon1);

        var y = Math.sin(delta_lon) * Math.cos(lat2);
        var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(delta_lon);
        var bearing = Math.atan2(y, x);
        bearing = ((360 + convertRadiansToDegrees(bearing)) % 360);

        return bearing;
    },
    isLowAirway(name) {
        if (name.indexOf("Corridor") >= 0)
            return true;

        if (name.indexOf("VFR") >= 0)
            return true;

        if (name[0] == "Y" || name[0] == "Z" || name[0] == "L")
            return false;

        return true;
    },
    isNearestAirport(icaoCode) {
        if (icaoCode.length != 4)
            return false;

        if (!icaoCode.startsWith('RK') && !icaoCode.startsWith('Z') && !icaoCode.startsWith('RJ'))
            return false;

        return true;
    }
}
