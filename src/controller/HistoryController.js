"use strict";
var QueryController_1 = require("./QueryController");
var Util_1 = require("../Util");
var HistoryController = (function () {
    function HistoryController() {
    }
    HistoryController.prototype.getHistory = function (id) {
        Util_1.default.trace("getting history");
        if (id == "courses") {
            Util_1.default.trace("getting courses history");
            return { render: "TABLE", result: QueryController_1.default.historyDatasets["courses"] };
        }
        else if (id == "rooms") {
            Util_1.default.trace("getting rooms history");
            return { render: "TABLE", result: QueryController_1.default.historyDatasets["rooms"] };
        }
    };
    return HistoryController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HistoryController;
//# sourceMappingURL=HistoryController.js.map