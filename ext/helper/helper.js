String.prototype.endsWith = function (query){
    if ((this.charAt(this.length-1) != query.charAt(query.length-1)) || (query.length > this.length)) {
        return false;
    } else {
        for (let i = 0; i < this.length; i++) {
            if (this.charAt(this.length-(i+1)) != query.charAt(query.length-(i+1))) {
                return false;
            }
            if (i + 1 >= query.length) i = this.length;
        }
        return true;
    }
}

function getToday(separator = "-"){
    let date = new Date();
    
    let day = `0${date.getDate()}`.slice(-2);
    let month = `0${date.getMonth()+1}`.slice(-2);
    let year = date.getFullYear();
    return `${day}${separator}${month}${separator}${year}`
}

function getYesterday(today = getToday()){
    let day = `${today[0]}${today[1]}`
    let month = `${today[3]}${today[4]}`
    let year = `${today[6]}${today[7]}${today[8]}${today[9]}`
    
    if (day > 1){
        return `${`${(parseInt(day)-1 >= 10) ? parseInt(day)-1 : `0${parseInt(day)-1}`}`.slice(-2)}${today.slice(2)}`;
    } else {
        if (month == 1){
            return `31-12-${parseInt(year)-1}`;
        } else if (month == 03){
            if (year % 4 == 0){
                return `29-0${month-1}${today.slice(5)}`;
            } else {
                return `28-0${month-1}${today.slice(5)}`;
            }
        } else if (month == 05 || month == 07 || month == 08 || month == 10 || month == 12){
            return `30-${(month-1 < 10) ? `0${month-1}` : month-1}${today.slice(5)}`;
        } else {
            return `31-${(month-1 < 10) ? `0${month-1}` : month-1}${today.slice(5)}`;
        }
    } 
}

function getTomorrow(today){
    let day = `${today[0]}${today[1]}`
    let month = `${today[3]}${today[4]}`
    let year = `${today[6]}${today[7]}${today[8]}${today[9]}`
    
    if (month == 2){
        if (year % 4 == 0){
            if (day == 29){
                return `01-${(parseInt(month)+1 >= 10) ? parseInt(month)+1 : `0${parseInt(month)+1}`}-${year}`
            } else return `${(parseInt(day)+1 >= 10) ? parseInt(day)+1 : `0${parseInt(day)+1}`.slice(-2)}-${month}-${year}`
        } else {
            if (day == 28){
                return `01-0${parseInt(month)+1}-${year}`
            } else return `${(parseInt(day)+1 >= 10) ? parseInt(day)+1 : `0${parseInt(day)+1}`.slice(-2)}-${month}-${year}`
        }
    } else if (month == 1 ||month == 3 ||month == 5 ||month == 7 ||month == 8 ||month == 10 ||month == 12){
        if (day == 31){
            return `01-${(parseInt(month)+1 >= 10) ? parseInt(month)+1 : `0${parseInt(month)+1}`}-${year}`
        } else return `${(parseInt(day)+1 >= 10) ? parseInt(day)+1 : `0${parseInt(day)+1}`.slice(-2)}-${month}-${year}`
    } else {
        if (day == 30){
            return `01-${(parseInt(month)+1 >= 10) ? parseInt(month)+1 : `0${parseInt(month)+1}`.slice(-2)}-${year}`
        } else return `${(parseInt(day)+1 >= 10) ? parseInt(day)+1 : `0${parseInt(day)+1}`.slice(-2)}-${month}-${year}`
    }
}

function getEarliestDate(array){
    if (!Array.isArray(array)) return;
    
    var earliest = array[0].toString();
    for (let i = 1;i < array.length;i++){
        let early_day = `${earliest[0]}${earliest[1]}`
        let early_month = `${earliest[3]}${earliest[4]}`
        let early_year = `${earliest[6]}${earliest[7]}${earliest[8]}${earliest[9]}`
        
        let now = array[i].toString()
        let day = `${now[0]}${now[1]}`
        let month = `${now[3]}${now[4]}`
        let year = `${now[6]}${now[7]}${now[8]}${now[9]}`
        
        if (parseInt(early_year) > parseInt(year)){
            earliest = array[i].toString();
        } else if (parseInt(early_year) == parseInt(year)){
            if (parseInt(early_month) > parseInt(month)) {
                earliest = array[i].toString();
            } else if (parseInt(early_month) == parseInt(month)){
                if (parseInt(early_day) > parseInt(day)) {
                    earliest = array[i].toString();
                } else if (parseInt(early_day) == parseInt(day)){
                    earliest = [i].toString();
                }
            }
        }
    }
    return earliest;
}

function date_to_ISO8601(date){
    if (typeof date !== "string") return;
    if (date[2] !== "-" || date[5] !== "-") return;

    let day = `${date[0]}${date[1]}`;
    let month = `${date[3]}${date[4]}`;
    let year = `${date[6]}${date[7]}${date[8]}${date[9]}`;

    return `${year}-${month}-${day}`;
}

function getPastDate(today, days){
    return (days == 0) ? today : getPastDate(getYesterday(today), days-1);
}

function getFutureDate(today, days){
    return (days == 0) ? today : getFutureDate(getTomorrow(today), days-1);
}

function getTime(){
    let date = new Date();
    let hours = date.getHours() >= 10 ? date.getHours() : `0${date.getHours()}`
    let minutes = date.getMinutes() >= 10 ? date.getMinutes() : `0${date.getMinutes()}`
    let seconds = date.getSeconds() >= 10 ? date.getSeconds() : `0${date.getSeconds()}`

    return `${hours}:${minutes}:${seconds}`;
}

//EXPORTS   
exports.getTime = function(){
    let date = new Date();
    let hours = date.getHours() >= 10 ? date.getHours() : `0${date.getHours()}`
    let minutes = date.getMinutes() >= 10 ? date.getMinutes() : `0${date.getMinutes()}`
    let seconds = date.getSeconds() >= 10 ? date.getSeconds() : `0${date.getSeconds()}`

    return `${hours}:${minutes}:${seconds}`;
}

exports.getToday = function (separator = "-"){
    let date = new Date();
    
    let day = `0${date.getDate()}`.slice(-2)
    let month = `0${date.getMonth()+1}`.slice(-2)
    let year = date.getFullYear()
    return `${day}${separator}${month}${separator}${year}`
}

exports.getYesterday = function (today = getToday()){
    let day = `${today[0]}${today[1]}`
    let month = `${today[3]}${today[4]}`
    let year = `${today[6]}${today[7]}${today[8]}${today[9]}`
    
    if (day > 1){
        return `${`${(parseInt(day)-1 >= 10) ? parseInt(day)-1 : `0${parseInt(day)-1}`}`.slice(-2)}${today.slice(2)}`;
    } else {
        if (month == 1){
            return `31-12-${parseInt(year)-1}`;
        } else if (month == 03){
            if (year % 4 == 0){
                return `29-0${month-1}${today.slice(5)}`;
            } else {
                return `28-0${month-1}${today.slice(5)}`;
            }
        } else if (month == 05 || month == 07 || month == 08 || month == 10 || month == 12){
            return `30-${(month-1 < 10) ? `0${month-1}` : month-1}${today.slice(5)}`;
        } else {
            return `31-${(month-1 < 10) ? `0${month-1}` : month-1}${today.slice(5)}`;
        }
    } 
}

exports.getTomorrow = function(today){
    let day = `${today[0]}${today[1]}`
    let month = `${today[3]}${today[4]}`
    let year = `${today[6]}${today[7]}${today[8]}${today[9]}`
    
    if (month == 2){
        if (year % 4 == 0){
            if (day == 29){
                return `01-${(parseInt(month)+1 >= 10) ? parseInt(month)+1 : `0${parseInt(month)+1}`}-${year}`
            } else return `${(parseInt(day)+1 >= 10) ? parseInt(day)+1 : `0${parseInt(day)+1}`.slice(-2)}-${month}-${year}`
        } else {
            if (day == 28){
                return `01-0${parseInt(month)+1}-${year}`
            } else return `${(parseInt(day)+1 >= 10) ? parseInt(day)+1 : `0${parseInt(day)+1}`.slice(-2)}-${month}-${year}`
        }
    } else if (month == 1 ||month == 3 ||month == 5 ||month == 7 ||month == 8 ||month == 10 ||month == 12){
        if (day == 31){
            return `01-${(parseInt(month)+1 >= 10) ? parseInt(month)+1 : `0${parseInt(month)+1}`}-${year}`
        } else return `${(parseInt(day)+1 >= 10) ? parseInt(day)+1 : `0${parseInt(day)+1}`.slice(-2)}-${month}-${year}`
    } else {
        if (day == 30){
            return `01-${(parseInt(month)+1 >= 10) ? parseInt(month)+1 : `0${parseInt(month)+1}`.slice(-2)}-${year}`
        } else return `${(parseInt(day)+1 >= 10) ? parseInt(day)+1 : `0${parseInt(day)+1}`.slice(-2)}-${month}-${year}`
    }
}

exports.getPastDate = function (today, days){
    return (days == 0) ? today : getPastDate(getYesterday(today), days-1);
}

exports.getFutureDate = function (today, days){
    return (days == 0) ? today : getFutureDate(getTomorrow(today), days-1);
}

exports.getMonthAgo = function (today){
    let target = `${today[0]}${today[1]}`
    let date = getYesterday(today);
    for (let i = 0;i < 31;i++){
        let day = `${date[0]}${date[1]}`
        if (day == target){
            return date;
        } else {
            date = getYesterday(date);
        }
    }
    return;
}

exports.getEarliestDate = function (array){
    if (!Array.isArray(array)) return;
    
    var earliest = array[0].toString();
    for (let i = 1;i < array.length;i++){
        let early_day = `${earliest[0]}${earliest[1]}`
        let early_month = `${earliest[3]}${earliest[4]}`
        let early_year = `${earliest[6]}${earliest[7]}${earliest[8]}${earliest[9]}`
        
        let now = array[i].toString()
        let day = `${now[0]}${now[1]}`
        let month = `${now[3]}${now[4]}`
        let year = `${now[6]}${now[7]}${now[8]}${now[9]}`
        
        if (parseInt(early_year) > parseInt(year)){
            earliest = array[i].toString();
        } else if (parseInt(early_year) == parseInt(year)){
            if (parseInt(early_month) > parseInt(month)) {
                earliest = array[i].toString();
            } else if (parseInt(early_month) == parseInt(month)){
                if (parseInt(early_day) > parseInt(day)) {
                    earliest = array[i].toString();
                } else if (parseInt(early_day) == parseInt(day)){
                    earliest = [i].toString();
                }
            }
        }
    }
    return earliest;
}

exports.getLatestDate = function (array){
    if (!Array.isArray(array)) return;
    
    var latest = array[0].toString();
    for (let i = 1;i < array.length;i++){
        if (getEarliestDate([latest, array[i]]) === latest) latest = array[i];
    }
    return latest;
}

exports.date_to_ISO8601 = function(date){
    if (typeof date !== "string") return;
    if (date[2] !== "-" || date[5] !== "-") return;

    let day = `${date[0]}${date[1]}`;
    let month = `${date[3]}${date[4]}`;
    let year = `${date[6]}${date[7]}${date[8]}${date[9]}`;

    return `${year}-${month}-${day}`;
}

exports.ISO8601_to_date = function(date){
    if (typeof date !== "string") return;
    if (date[4] !== "-" || date[7] !== "-") return;

    let year = `${date[0]}${date[1]}${date[2]}${date[3]}`;
    let month = `${date[5]}${date[6]}`;
    let day = `${date[8]}${date[9]}`;

    return `${day}-${month}-${year}`;
}

exports.daysSince = function(date){
    let today = getToday();
    if (date === today || getEarliestDate([date, today]) === today) return

    let counter = 0;
    let stop = false;
    while (!stop){
        today = getYesterday(today);
        counter++;
        if (date === today) stop = true;
    }
    return counter;
}

exports.getUNIXStamp = function(date){
    if (!date) return Math.floor(new Date()/1000);
    let stamp = Math.floor(new Date(date_to_ISO8601(date))/1000);
    
    let time = getTime(date).split(":").map(elem => parseInt(elem));
    stamp += time[0]*3600 + time[1]*60 + time[2];
    return stamp;
}

exports.intToChar = function(int){
    const code = 'A'.charCodeAt(0);
    return String.fromCharCode(code + int);
}

exports.randomPick = function(array) {
    return array[Math.floor(Math.random() * array.length)];
}

exports.numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
exports.roundToNearest10 = function(num) {
    return Math.round(num / 10) * 10;
}