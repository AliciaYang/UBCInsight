"use strict";
var Util_1 = require("../Util");
var SchedulerController = (function () {
    function SchedulerController() {
    }
    SchedulerController.prototype.scheduling = function (scheduler) {
        Util_1.default.trace("SchedulerController::scheduling(..)");
        var result = [];
        var notScheduled = [];
        var coursesList = scheduler["COURSE"];
        var roomList = scheduler["ROOM"];
        console.log(roomList.length);
        var totalSection = 0;
        for (var _i = 0, coursesList_1 = coursesList; _i < coursesList_1.length; _i++) {
            var c = coursesList_1[_i];
            totalSection += c["numSections"];
        }
        for (var _a = 0, coursesList_2 = coursesList; _a < coursesList_2.length; _a++) {
            var course = coursesList_2[_a];
            var num = 0;
            var temp = course["numSections"];
            var secNum = course["numSections"];
            while (secNum > 0) {
                for (var _b = 0, roomList_1 = roomList; _b < roomList_1.length; _b++) {
                    var room = roomList_1[_b];
                    if (room["rooms_seats"] >= course["maxSize"]) {
                        if (room["timeslot"] < 15) {
                            var resultElem = {};
                            resultElem["Department"] = course["courses_dept"];
                            resultElem["CourseNumber"] = course["courses_id"];
                            resultElem["TotalSection"] = temp;
                            resultElem["Section"] = num + 1;
                            resultElem["Size"] = course["maxSize"];
                            resultElem["Room"] = room["rooms_name"];
                            resultElem["Seats"] = room["rooms_seats"];
                            resultElem["Time"] = room["timeslot"] + 1;
                            room["timeslot"] = room["timeslot"] + 1;
                            course["numSections"] = course["numSections"] - 1;
                            result.push(resultElem);
                            num = num + 1;
                            break;
                        }
                    }
                }
                secNum = secNum - 1;
            }
        }
        var unScheduledResult = [];
        var unScheduled = 0;
        for (var _c = 0, coursesList_3 = coursesList; _c < coursesList_3.length; _c++) {
            var c = coursesList_3[_c];
            if (c["numSections"] > 0) {
                unScheduled += c["numSections"];
                unScheduledResult.push(c);
            }
        }
        Util_1.default.trace("SchedulerController::Total sections: ");
        console.log(totalSection);
        var scheduled = totalSection - unScheduled;
        Util_1.default.trace("SchedulerController::Scheduled sections: ");
        console.log(scheduled);
        Util_1.default.trace("SchedulerController::unScheduled sections: ");
        console.log(unScheduled);
        var qualityResut = [];
        qualityResut.push({ "total": totalSection, "success": scheduled, "unsuccess": unScheduled });
        for (var _d = 0, result_1 = result; _d < result_1.length; _d++) {
            var c = result_1[_d];
            if (c["Time"] == 1) {
                c["Time"] = "MWF8AM-9AM";
            }
            else if (c["Time"] == 2) {
                c["Time"] = "MWF9AM-10AM";
            }
            else if (c["Time"] == 3) {
                c["Time"] = "MWF10AM-11AM";
            }
            else if (c["Time"] == 4) {
                c["Time"] = "MWF11AM-12PM";
            }
            else if (c["Time"] == 5) {
                c["Time"] = "MWF12PM-1PM";
            }
            else if (c["Time"] == 6) {
                c["Time"] = "MWF1PM-2PM";
            }
            else if (c["Time"] == 7) {
                c["Time"] = "MWF2PM-3PM";
            }
            else if (c["Time"] == 8) {
                c["Time"] = "MWF3PM-4PM";
            }
            else if (c["Time"] == 9) {
                c["Time"] = "MWF4PM-5PM";
            }
            else if (c["Time"] == 10) {
                c["Time"] = "T/Th8AM-9:30AM";
            }
            else if (c["Time"] == 11) {
                c["Time"] = "T/Th9:30AM-11AM";
            }
            else if (c["Time"] == 12) {
                c["Time"] = "T/Th11AM-12:30PM";
            }
            else if (c["Time"] == 13) {
                c["Time"] = "T/Th12:30PM-2PM";
            }
            else if (c["Time"] == 14) {
                c["Time"] = "T/Th2PM-3:30PM";
            }
            else if (c["Time"] == 15) {
                c["Time"] = "T/Th3:30PM-5PM";
            }
        }
        Util_1.default.trace("SchedulerController::Schedule Table: ");
        console.log(result);
        return { render: "TABLE", result: result,
            unSchedule: unScheduledResult, quality: qualityResut };
    };
    return SchedulerController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SchedulerController;
//# sourceMappingURL=SchedulerController.js.map