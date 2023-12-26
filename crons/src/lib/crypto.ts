import process from 'node:process';
import Bitvavo from 'bitvavo';

const crypto = new Bitvavo().options({
    APIKEY: process.env.BITVAVO_APIKEY!,
    APISECRET: process.env.BITVAVO_APISECRET!,
    ACCESSWINDOW: 10000,
    RESTURL: 'https://api.bitvavo.com/v2',
    WSURL: 'wss://ws.bitvavo.com/v2/',
    DEBUGGING: false,
});

export default crypto;
