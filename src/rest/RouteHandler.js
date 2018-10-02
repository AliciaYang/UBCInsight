"use strict";
var fs = require('fs');
var DatasetController_1 = require('../controller/DatasetController');
var Util_1 = require('../Util');
var InsightFacade_1 = require("../controller/InsightFacade");
var RouteHandler = (function () {
    function RouteHandler() {
    }
    RouteHandler.getHomepage = function (req, res, next) {
        Util_1.default.trace('RoutHandler::getHomepage(..)');
        Util_1.default.trace(req.params.id);
        var page = req.params.id || "index.html";
        fs.readFile('./src/rest/views/' + page, 'utf8', function (err, file) {
            if (err) {
                res.send(404);
                Util_1.default.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    };
    RouteHandler.putDataset = function (req, res, next) {
        Util_1.default.trace('RouteHandler::postDataset(..) - params: ' + JSON.stringify(req.params));
        try {
            var id = req.params.id;
            var buffer_1 = [];
            req.on('data', function onRequestData(chunk) {
                Util_1.default.trace('RouteHandler::postDataset(..) on data; chunk length: ' + chunk.length);
                buffer_1.push(chunk);
            });
            req.once('end', function () {
                var concated = Buffer.concat(buffer_1);
                req.body = concated.toString('base64');
                Util_1.default.trace('RouteHandler::postDataset(..) on end; total length: ' + req.body.length);
                var facade = RouteHandler.myInsightFacade;
                facade.addDataset(id, req.body).then(function (result) {
                    Util_1.default.trace('RouteHandler::postDataset(..) - processed');
                    res.json(result.code, { success: result.body });
                }).catch(function (err) {
                    Util_1.default.trace('RouteHandler::postDataset(..) - ERROR: ' + err.message);
                    res.json(400, { err: err.message });
                });
            });
        }
        catch (err) {
            Util_1.default.error('RouteHandler::postDataset(..) - ERROR: ' + err.message);
            res.send(400, { err: err.message });
        }
        return next();
    };
    RouteHandler.postHistory = function (req, res, next) {
        Util_1.default.trace('RouteHandler::postHistory(..) - params: ' + JSON.stringify(req.params));
        try {
            var facade = RouteHandler.myInsightFacade;
            var id = req.params;
            facade.performHistory(id).then(function (result) {
                res.json(result.code, result.body);
            }).catch(function (err) {
                Util_1.default.trace('RouteHandler::postHistory(..) - ERROR: ' + err.message);
                res.json(403, { err: err.message });
            });
        }
        catch (err) {
            Util_1.default.error('RouteHandler::postHistory(..) - ERROR: ' + err);
            res.send(403);
        }
        return next();
    };
    RouteHandler.postQuery = function (req, res, next) {
        Util_1.default.trace('RouteHandler::postQuery(..) - params: ' + JSON.stringify(req.params));
        try {
            var facade = RouteHandler.myInsightFacade;
            var query = req.params;
            if (Object.keys(query).length == 0) {
                res.json(400, { error: 'invalid query' });
            }
            facade.performQuery(query).then(function (result) {
                res.json(result.code, result.body);
            }).catch(function (err) {
                Util_1.default.trace('RouteHandler::postDataset(..) - ERROR: ' + err.message);
                res.json(403, { err: err.message });
            });
        }
        catch (err) {
            Util_1.default.error('RouteHandler::postQuery(..) - ERROR: ' + err);
            res.send(403);
        }
        return next();
    };
    RouteHandler.postScheduler = function (req, res, next) {
        Util_1.default.trace('RouteHandler::postScheduler(..) - params: ' + JSON.stringify(req.params));
        try {
            var facade = RouteHandler.myInsightFacade;
            var scheduler = req.params;
            facade.performSchedule(scheduler).then(function (result) {
                res.json(result.code, result.body);
                Util_1.default.trace('RouteHandler::postDataset(..) - finished');
            }).catch(function (err) {
                Util_1.default.trace('RouteHandler::postDataset(..) - ERROR: ' + err.message);
                res.json(403, { err: err.message });
            });
        }
        catch (err) {
            Util_1.default.error('RouteHandler::postScheduler(..) - ERROR: ' + err);
            res.send(403);
        }
        return next();
    };
    RouteHandler.deleteDatasets = function (req, res, next) {
        Util_1.default.trace('RouteHandler::deleteDatases(..) - params: ' + JSON.stringify(req.params));
        try {
            var id = req.params.id;
            var facade = RouteHandler.myInsightFacade;
            facade.removeDataset(id).then(function (result) {
                res.json(result.code, result.body);
            }).catch(function (err) {
                Util_1.default.trace('RouteHandler::deleteDatases(..) - ERROR: ' + err.message);
                res.json(404, { err: err.message });
            });
        }
        catch (err) {
            Util_1.default.error('RouteHandler::postQuery(..) - ERROR: ' + err);
            res.send(404);
        }
        return next();
    };
    RouteHandler.datasetController = new DatasetController_1.default();
    RouteHandler.myInsightFacade = new InsightFacade_1.default();
    return RouteHandler;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RouteHandler;
//# sourceMappingURL=RouteHandler.js.map