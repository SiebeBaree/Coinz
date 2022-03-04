module.exports.msToTime = duration => {
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    let days = Math.floor((duration / (1000 * 60 * 60 * 24)));

    let str = "";
    str += days > 0 ? days + "d " : "";
    str += hours > 0 ? hours + "h " : "";
    str += minutes > 0 ? minutes + "m " : "";
    str += seconds > 0 ? seconds + "s" : "";

    return str || "0s";
}

// Not 100% accurate but it doesn't need to be very accurate.
module.exports.roundNumber = (n, places = 2) => {
    let x = Math.pow(10, places);
    return Math.round(n * x) / x;
}

module.exports.getLevel = (experience) => {
    return parseInt(experience / 100);
}