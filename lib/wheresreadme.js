// builtin
var fs = require('fs');
var path = require('path');

// locate a readme file in a directory
module.exports = function wheresreadme(dir) {
    var files = fs.readdirSync(dir);
    for (var i=0 ; i<files.length ; ++i) {
        if (/^readme/i.test(files[i])) {
            return path.join(dir, files[i]);
        }
    }

    return null;
}
