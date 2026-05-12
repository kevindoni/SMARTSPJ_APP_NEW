const sat = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

function terbilang(n) {
    if (n === null || n === undefined) return '';
    n = Math.abs(Math.round(Number(n) || 0));

    let str = '';
    if (n < 12) {
        str = ' ' + sat[n];
    } else if (n < 20) {
        str = terbilang(n - 10) + ' belas';
    } else if (n < 100) {
        str = terbilang(Math.floor(n / 10)) + ' puluh' + terbilang(n % 10);
    } else if (n < 200) {
        str = ' seratus' + terbilang(n - 100);
    } else if (n < 1000) {
        str = terbilang(Math.floor(n / 100)) + ' ratus' + terbilang(n % 100);
    } else if (n < 2000) {
        str = ' seribu' + terbilang(n - 1000);
    } else if (n < 1000000) {
        str = terbilang(Math.floor(n / 1000)) + ' ribu' + terbilang(n % 1000);
    } else if (n < 1000000000) {
        str = terbilang(Math.floor(n / 1000000)) + ' juta' + terbilang(n % 1000000);
    } else if (n < 1000000000000) {
        str = terbilang(Math.floor(n / 1000000000)) + ' milyar' + terbilang(n % 1000000000);
    } else if (n < 1000000000000000) {
        str = terbilang(Math.floor(n / 1000000000000)) + ' trilyun' + terbilang(n % 1000000000000);
    }

    return str;
}

module.exports = function make(n) {
    if (n === 0) return 'nol rupiah';
    const result = terbilang(n).trim() + ' rupiah';
    return result.replace(/\b\w/g, l => l.toUpperCase());
};
