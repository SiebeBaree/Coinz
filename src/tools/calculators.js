module.exports.msToTime = ms => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 60));
    const hours = Math.floor(ms / (1000 * 60 * 60) % 60);
    const minutes = Math.floor(ms / (1000 * 60) % 60);
    const seconds = Math.floor(ms / (1000) % 60);

    let str = "";
    if (days) str = str + days + "d ";
    if (hours) str = str + hours + "h ";
    if (minutes) str = str + minutes + "m ";
    if (seconds) str = str + seconds + "s";

    return str || "0s";
};

// Not 100% accurate but it doesn't need to be very accurate.
module.exports.roundNumber = (n, places = 2) => {
    let x = Math.pow(10, places);
    return Math.round(n * x) / x;
}