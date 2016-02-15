'use strict';

// jshint ignore:start
function pad(n) {
    return n < 10 ? '0' + n : n;
}

Date.prototype.toJSON = function() {
    var s = this.getFullYear() + '-' + pad(this.getMonth() + 1) + '-' + pad(this.getDate()) + 'T' +
        pad(this.getHours()) + ':' + pad(this.getMinutes()) + ':' + pad(this.getSeconds());
    var offset = this.getTimezoneOffset();
    if (offset === 0) {
        s += 'Z';
    } else {
        s += ( offset < 0 ? '+' : '-' ) + pad(Math.abs(offset / 60)) + pad(Math.abs(offset % 60));
    }
    return s;
};
// jshint ignore:end
