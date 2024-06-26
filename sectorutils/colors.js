
module.exports = {

    /**
     * 직관적으로 인식 가능한 RGB 색상을 유로스코프의 십진수 BGR로 변환합니다.
     * @param {*} r 빨강 채널(10진수)
     * @param {*} g 초록 채널(10진수)
     * @param {*} b 파랑 채널(10진수)
     */
    rgb2BgrInt(r, g, b){
        return r + g * 0x01_00 + b * 0x01_00_00;
    },
    
    /**
     * 유로스코프의 색상 정의 문자열을 생성합니다.
     * @param {*} name 색상의 이름은 무엇입니까?
     * @param {*} colorInt 이 색상의 BGR 10진수 정수 값은 무엇입니까?
     * @returns 
     */
    makeColorDefine(name, colorInt){
        return "#define " + name + " " + colorInt;
    }
}