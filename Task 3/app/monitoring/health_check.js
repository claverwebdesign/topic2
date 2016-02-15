var step = require('step'),
    fs   = require('fs');

function HealthCheck(disableFile) {
    this.disableFile = disableFile;
}

module.exports = HealthCheck;

HealthCheck.prototype.check = function(callback) {
    var self = this;

    step(
        function getManualDisable() {
          fs.readFile(self.disableFile, this);
        },
        function handleDisabledFile(err, data) {
          var next = this;
          if (err) {
            return next();
          }
          if (!!data) {
            err = new Error(data);
            err.http_status = 503;
            throw err;
          }
        },
        function handleResult(err) {
          callback(err);
        }
    );
};
