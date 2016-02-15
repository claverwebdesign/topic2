require('../../helper');
require('../../support/assert');


var app = require(global.settings.app_root + '/app/app')();
var assert = require('assert');
var querystring = require('querystring');

// allow lots of emitters to be set to silence warning
app.setMaxListeners(0);

describe('export.arraybuffer', function() {

it('GET /api/v1/sql as arraybuffer ', function(done){
    assert.response(app, {
        url: '/api/v1/sql?' + querystring.stringify({
          q: 'SELECT cartodb_id,name,1::integer,187.9 FROM untitle_table_4',
          format: 'arraybuffer'
        }),
        headers: {host: 'vizzuality.cartodb.com'},
        method: 'GET'
    },{ }, function(res){
        assert.equal(res.statusCode, 200, res.body);
        assert.equal(res.headers['content-type'], "application/octet-stream");
        done();
    });
});

it('GET /api/v1/sql as arraybuffer does not support geometry types ', function(done){
    assert.response(app, {
        url: '/api/v1/sql?' + querystring.stringify({
          q: 'SELECT cartodb_id, the_geom FROM untitle_table_4',
          format: 'arraybuffer'
        }),
        headers: {host: 'vizzuality.cartodb.com'},
        method: 'GET'
    },{ }, function(res){
        assert.equal(res.statusCode, 400, res.body);
        var result = JSON.parse(res.body);
        assert.equal(result.error[0], "geometry types are not supported");

        done();
    });
});

});
