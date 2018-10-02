"use strict";
var restify = require('restify');
var Util_1 = require("../Util");
var RouteHandler_1 = require('./RouteHandler');
var Server = (function () {
    function Server(port) {
        Util_1.default.info("Server::<init>( " + port + " )");
        this.port = port;
    }
    Server.prototype.stop = function () {
        Util_1.default.info('Server::close()');
        var that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    };
    Server.prototype.start = function () {
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Util_1.default.info('Server::start() - start');
                that.rest = restify.createServer({
                    name: 'insightUBC'
                });
                that.rest.get("/public/.*", restify.serveStatic({
                    directory: __dirname
                }));
                that.rest.get('/:id', RouteHandler_1.default.getHomepage);
                that.rest.put('/dataset/:id', RouteHandler_1.default.putDataset);
                that.rest.post('/query', restify.bodyParser(), RouteHandler_1.default.postQuery);
                that.rest.post('/scheduler', restify.bodyParser(), RouteHandler_1.default.postScheduler);
                that.rest.post('/history', restify.bodyParser(), RouteHandler_1.default.postHistory);
                that.rest.del('/dataset/:id', RouteHandler_1.default.deleteDatasets);
                that.rest.listen(that.port, function () {
                    Util_1.default.info('Server::start() - restify listening: ' + that.rest.url);
                    fulfill(true);
                });
                that.rest.on('error', function (err) {
                    Util_1.default.info('Server::start() - restify ERROR: ' + err);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.error('Server::start() - ERROR: ' + err);
                reject(err);
            }
        });
    };
    return Server;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Server;
//# sourceMappingURL=Server.js.map