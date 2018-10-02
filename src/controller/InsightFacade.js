"use strict";
var QueryController_1 = require("./QueryController");
var DatasetController_1 = require("./DatasetController");
var Util_1 = require("../Util");
var HistoryController_1 = require("./HistoryController");
var SchedulerController_1 = require("./SchedulerController");
var InsightFacade = (function () {
    function InsightFacade() {
    }
    InsightFacade.prototype.addDataset = function (id, content) {
        Util_1.default.trace("InsightController::postDataset(..) - params: " + id);
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                var controller = InsightFacade.datasetController;
                controller.process(id, content).then(function (result) {
                    Util_1.default.trace('InsightController::postDataset(..) - processed');
                    fulfill({ code: result, body: { success: result } });
                }).catch(function (err) {
                    Util_1.default.trace('InsightController::postDataset(..) - ERROR: ' + err.message);
                    reject({ code: 400, body: { err: err.message } });
                });
            }
            catch (err) {
                Util_1.default.error("InsightController::postDataset(..) - ERROR: " + err);
                reject(err);
            }
        });
    };
    InsightFacade.prototype.removeDataset = function (id) {
        Util_1.default.trace("InsightController::deleteDatasets(..) - params: " + id);
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                var controller = InsightFacade.datasetController;
                if (controller.getDatasets()) {
                    controller.deleteDatasets(id).then(function (result) {
                        Util_1.default.trace("InsightController::deleteDatasets(..) - processed");
                        fulfill({ code: result, body: { success: result } });
                    }).catch(function (err) {
                        reject({ code: err, body: { err: err.message } });
                    });
                }
                else {
                    fulfill({ code: 404, body: { err: "No such a file " + id } });
                }
            }
            catch (err) {
                Util_1.default.error("InsightController::deleteDatasets(..) - ERROR: " + err);
                reject(err);
            }
        });
    };
    InsightFacade.prototype.performQuery = function (query) {
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                var datasets = InsightFacade.datasetController.getDatasets();
                var controller = new QueryController_1.default(datasets);
                var isValid = controller.isValid(query);
                if (isValid) {
                    if (controller.needID(query).length > 0) {
                        fulfill({ code: 424, body: { missing: controller.needID(query) } });
                    }
                    else {
                        fulfill({ code: 200, body: controller.query(query) });
                    }
                }
                else {
                    fulfill({ code: 400, body: { error: 'invalid query' } });
                }
            }
            catch (err) {
                Util_1.default.error('InsightController::performQuery(..) - ERROR: ' + err);
                reject(err);
            }
        });
    };
    InsightFacade.prototype.performHistory = function (id) {
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                var datasets = InsightFacade.datasetController.getDatasets();
                var controller = new HistoryController_1.default();
                Util_1.default.trace("InsightController::performHistory(..) -  printing ID");
                var result = controller.getHistory(id);
                console.log(result);
                if (result == null) {
                    fulfill({ code: 400, body: "No history" });
                }
                else {
                    fulfill({ code: 200, body: result });
                }
            }
            catch (err) {
                Util_1.default.error('InsightController::performHistory(..) - ERROR: ' + err);
                reject(err);
            }
        });
    };
    InsightFacade.prototype.performSchedule = function (scheduler) {
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                var dataset = InsightFacade.datasetController;
                var controller = new SchedulerController_1.default();
                Util_1.default.trace("InsightController::scheduling(..)");
                var result = controller.scheduling(scheduler);
                if (result == null) {
                    fulfill({ code: 400, body: "No schedule" });
                }
                else {
                    fulfill({ code: 200, body: result });
                }
            }
            catch (err) {
                Util_1.default.error('InsightController::scheduling(..) - ERROR: ' + err);
                reject(err);
            }
        });
    };
    InsightFacade.datasetController = new DatasetController_1.default();
    return InsightFacade;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map