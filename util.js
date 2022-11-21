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
    }
}
