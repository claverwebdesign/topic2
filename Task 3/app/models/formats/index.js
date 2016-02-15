var fs = require("fs");
var formats = {};

function formatFilesWithPath(dir) {
    var formatDir = __dirname + '/' + dir;
    return fs.readdirSync(formatDir).map(function(formatFile) {
        return formatDir + '/' + formatFile;
    });
}

var formatFilesPaths = []
    .concat(formatFilesWithPath('ogr'))
    .concat(formatFilesWithPath('pg'));

formatFilesPaths.forEach(function(file) {
    var format = require(file);
    formats[format.prototype.id] = format;
});

module.exports = formats;
