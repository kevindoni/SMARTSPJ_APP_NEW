/**
 * Terbilang Helper
 * Converts number to Indonesian string representation
 */

const sat = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

function terbilang(n) {
    if (n === null || n === undefined) return '';
    n = Math.abs(parseFloat(n));

    let str = '';
    if (n < 12) {
        str = ' ' + sat[Math.floor(n)];
    } else if (n < 20) {
        str = terbilang(n - 10) + ' belas';
    } else if (n < 100) {
        str = terbilang(n / 10) + ' puluh' + terbilang(n % 10);
    } else if (n < 200) {
        str = ' seratus' + terbilang(n - 100);
    } else if (n < 1000) {
        str = terbilang(n / 100) + ' ratus' + terbilang(n % 100);
    } else if (n < 2000) {
        str = ' seribu' + terbilang(n - 1000);
    } else if (n < 1000000) {
        str = terbilang(n / 1000) + ' ribu' + terbilang(n % 1000);
    } else if (n < 1000000000) {
        str = terbilang(n / 1000000) + ' juta' + terbilang(n % 1000000);
    } else if (n < 1000000000000) {
        str = terbilang(n / 1000000000) + ' milyar' + terbilang(n % 1000000000);
    } else if (n < 1000000000000000) {
        str = terbilang(n / 1000000000000) + ' trilyun' + terbilang(n % 1000000000000);
    }

    return str; // Leading space is handled by recursive calls
}

module.exports = function make(n) {
    if (n === 0) return 'nol rupiah';
    const result = terbilang(n).trim() + ' rupiah';
    // Capitalize first letter of each word
    return result.replace(/\b\w/g, l => l.toUpperCase());
};
