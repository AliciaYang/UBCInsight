"use strict";
var Util_1 = require("../Util");
var JSZip = require('jszip');
var fs = require('fs');
var parse5 = require('parse5');
var http = require('http');
var DatasetController = (function () {
    function DatasetController() {
        this.datasets = {};
        Util_1.default.trace('DatasetController::init()');
    }
    DatasetController.prototype.getDataset = function (id) {
        if (Object.keys(this.datasets).length == 0) {
            if (id == "courses" || id == "rooms") {
                var data = fs.readFileSync("data/" + id + ".json", "utf8");
                this.datasets = JSON.parse(data);
                return this.datasets;
            }
            else {
                return null;
            }
        }
    };
    DatasetController.prototype.getDatasets = function () {
        if (Object.keys(this.datasets).length == 0) {
            var data = fs.readdir("data/");
            if (typeof data != "undefined") { }
            ;
        }
        return this.datasets;
    };
    DatasetController.prototype.process = function (id, data) {
        var that = this;
        if (id == "courses") {
            return that.JSONParser(id, data);
        }
        else if (id == "rooms") {
            return that.HTMLParser(id, data);
        }
        else {
            return new Promise(function (reject) {
                reject(400);
            });
        }
    };
    DatasetController.prototype.HTMLParser = function (id, data) {
        Util_1.default.trace('HTMLParser::process( ' + id + '... )');
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                var myZip = new JSZip();
                myZip.loadAsync(data, { base64: true }).then(function (zip) {
                    Util_1.default.trace('HTMLParser::process(..) - unzipped');
                    var processedDataset = [];
                    var temp = {};
                    var tempRoom = [];
                    var filePath = [];
                    var shortNameAndAdressArray = Array;
                    var buildingOnlyArray = [];
                    var buildingFullName = [];
                    var prmoises = [];
                    var addressPromises = [];
                    var html = zip.file("index.htm");
                    html.async("string").then(function (indexHTML) {
                        Util_1.default.trace("HTMLParser::reading HTML");
                        var start = indexHTML.indexOf("<tbody>");
                        var end = indexHTML.indexOf("</tbody>");
                        var tbody = indexHTML.substring(start, end + 8);
                        var document = parse5.parse(tbody, { treeAdapter: parse5.treeAdapters.default });
                        shortNameAndAdressArray = that.getShortNameAndAdress(document);
                        buildingFullName = that.getBuildingFullName(document);
                        buildingOnlyArray = that.getBuildingOnlyArray(shortNameAndAdressArray);
                        for (var i in buildingOnlyArray) {
                            var propertiesElement = {};
                            var addressIndex = 2 * Number(i) + 1;
                            propertiesElement["shortname"] = buildingOnlyArray[i];
                            propertiesElement["fullname"] = buildingFullName[i];
                            var addressURL = encodeURI(shortNameAndAdressArray[addressIndex]);
                            propertiesElement["address"] = addressURL;
                            temp[buildingOnlyArray[i]] = propertiesElement;
                            var theUrl = "http://skaha.cs.ubc.ca:8022/api/v1/team14/" + addressURL;
                            var promise = that.httpFunction(theUrl);
                            addressPromises.push(promise);
                        }
                        Promise.all(addressPromises).then(function (results) {
                            try {
                                var count = 0;
                                for (var building in temp) {
                                    temp[building]["lat"] = results[count]["lat"];
                                    temp[building]["lon"] = results[count]["lon"];
                                    count++;
                                }
                                filePath = that.getBuildingPath(tbody);
                                for (var _i = 0, filePath_1 = filePath; _i < filePath_1.length; _i++) {
                                    var aPath = filePath_1[_i];
                                    aPath = aPath.slice(2);
                                    var tempValue = zip.file(aPath).async("string");
                                    prmoises.push(tempValue);
                                }
                                Promise.all(prmoises).then(function (results) {
                                    try {
                                        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                                            var afile = results_1[_i];
                                            var start_1 = afile.indexOf("<tbody>");
                                            if (start_1 != -1) {
                                                var end_1 = afile.indexOf("</tbody>");
                                                var tbody_1 = afile.substring(start_1, end_1 + 8);
                                                for (var _a = 0, _b = that.getRoomsDetails(tbody_1); _a < _b.length; _a++) {
                                                    var room = _b[_a];
                                                    tempRoom.push(room);
                                                }
                                            }
                                        }
                                        for (var _c = 0, tempRoom_1 = tempRoom; _c < tempRoom_1.length; _c++) {
                                            var t = tempRoom_1[_c];
                                            var key = Object.keys(t)[0];
                                            var properties = t[key];
                                            var shortName = key.split("-")[0];
                                            var number = key.split("-")[1];
                                            properties["rooms_number"] = number;
                                            properties["rooms_name"] = shortName + "_" + number;
                                            properties["rooms_shortname"] = shortName;
                                            properties["rooms_fullname"] = temp[shortName]["fullname"];
                                            properties["rooms_address"] = temp[shortName]["address"];
                                            properties["rooms_lat"] = temp[shortName]["lat"];
                                            properties["rooms_lon"] = temp[shortName]["lon"];
                                            processedDataset.push(t);
                                        }
                                        if (processedDataset.length == 0 ||
                                            Object.keys(processedDataset).length == 0 ||
                                            typeof processedDataset == "undefined") {
                                            reject(400);
                                        }
                                        else {
                                            fs.stat("data/" + id + ".json", function (err, stat) {
                                                if (err == null) {
                                                    console.log('File exists');
                                                    that.save(id, processedDataset);
                                                    fulfill(201);
                                                }
                                                else if (err.code == 'ENOENT') {
                                                    that.save(id, processedDataset);
                                                    fulfill(204);
                                                }
                                                else {
                                                    console.log('Some other error: ', err.code);
                                                    reject(err);
                                                }
                                            });
                                        }
                                    }
                                    catch (err) {
                                        reject(err);
                                    }
                                });
                            }
                            catch (err) {
                                reject(err);
                            }
                        });
                    });
                }).catch(function (err) {
                    Util_1.default.trace('HTMLParser::process(..) - unzip ERROR: ' + err.message);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.trace('HTMLParser::process(..) - ERROR: ' + err);
                reject(err);
            }
        });
    };
    DatasetController.prototype.httpFunction = function (address) {
        return new Promise(function (fulfill, reject) {
            http.get(address, function (res) {
                var statusCode = res.statusCode;
                var contentType = res.headers['content-type'];
                var error;
                if (statusCode !== 200) {
                    error = new Error("Request Failed.\n" +
                        ("Status Code: " + statusCode));
                }
                else if (!/^application\/json/.test(contentType)) {
                    error = new Error("Invalid content-type.\n" +
                        ("Expected application/json but received " + contentType));
                }
                if (error) {
                    console.log(error.message);
                    res.resume();
                    return;
                }
                res.setEncoding('utf8');
                var rawData = '';
                res.on('data', function (chunk) { return rawData += chunk; });
                res.on('end', function () {
                    try {
                        var parsedData = JSON.parse(rawData);
                        fulfill(parsedData);
                    }
                    catch (e) {
                        console.log(e.message);
                    }
                });
            });
        });
    };
    DatasetController.prototype.getBuildingPath = function (document) {
        var buildingPath = [];
        var tbodyFragment = parse5.parseFragment(document);
        function findIndexNode(node) {
            if (node.attrs) {
                node.attrs.forEach(function (value) {
                    if (value.name == "href" && buildingPath.indexOf(value.value) == -1) {
                        buildingPath.push(value.value);
                    }
                });
            }
            if (node.childNodes) {
                node.childNodes.forEach(findIndexNode);
            }
        }
        findIndexNode(tbodyFragment);
        return buildingPath;
    };
    DatasetController.prototype.getShortNameAndAdress = function (document) {
        var processedArray = [];
        var messyArray = [];
        for (var _i = 0, _a = parse5.treeAdapters.default.getChildNodes(document); _i < _a.length; _i++) {
            var d = _a[_i];
            for (var _b = 0, _c = parse5.treeAdapters.default.getChildNodes(d); _b < _c.length; _b++) {
                var i = _c[_b];
                for (var _d = 0, _e = parse5.treeAdapters.default.getChildNodes(i); _d < _e.length; _d++) {
                    var e = _e[_d];
                    messyArray.push(e.value);
                }
            }
            var stringArray = [];
            for (var _f = 0, messyArray_1 = messyArray; _f < messyArray_1.length; _f++) {
                var h = messyArray_1[_f];
                if (typeof h === "string") {
                    stringArray.push(h);
                }
            }
            var trimArray = [];
            for (var _g = 0, stringArray_1 = stringArray; _g < stringArray_1.length; _g++) {
                var r = stringArray_1[_g];
                trimArray.push(r.trim());
            }
            for (var _h = 0, trimArray_1 = trimArray; _h < trimArray_1.length; _h++) {
                var w = trimArray_1[_h];
                if (w != "") {
                    processedArray.push(w);
                }
            }
            break;
        }
        return processedArray;
    };
    DatasetController.prototype.getBuildingOnlyArray = function (processedArray) {
        var BuildingOnlyArray = [];
        for (var index in processedArray) {
            if (index % 2 == 0) {
                BuildingOnlyArray.push(processedArray[index]);
            }
        }
        return BuildingOnlyArray;
    };
    DatasetController.prototype.getBuildingFullName = function (document) {
        var buildingFullNameArray = [];
        for (var _i = 0, _a = parse5.treeAdapters.default.getChildNodes(document); _i < _a.length; _i++) {
            var first_degree = _a[_i];
            for (var _b = 0, _c = parse5.treeAdapters.default.getChildNodes(first_degree); _b < _c.length; _b++) {
                var second_degree = _c[_b];
                var count = 0;
                var previous = 0;
                for (var _d = 0, _e = parse5.treeAdapters.default.getChildNodes(second_degree); _d < _e.length; _d++) {
                    var targetedNodes = _e[_d];
                    if (count == 3 || count - previous == 6) {
                        previous = count;
                        var node = parse5.treeAdapters.default.getFirstChild(targetedNodes);
                        var nodeValue = node.value;
                        buildingFullNameArray.push(nodeValue);
                    }
                    count = count + 1;
                }
            }
        }
        return buildingFullNameArray;
    };
    DatasetController.prototype.getRoomsDetails = function (tbody) {
        var roomsDetails = [];
        var hrefArray = [];
        var tbodyFragment = parse5.parseFragment(tbody);
        if (tbodyFragment.childNodes[0].nodeName == "tbody") {
            tbodyFragment.childNodes[0].childNodes.forEach(function (tr) {
                if (tr.nodeName == "tr") {
                    var key_1 = null;
                    var roomsObject_1 = {
                        rooms_seats: null,
                        rooms_type: null,
                        rooms_furniture: null,
                        rooms_href: null
                    };
                    tr.childNodes.forEach(function (td) {
                        if (td.nodeName == "td") {
                            if (td.attrs) {
                                for (var _i = 0, _a = td.attrs; _i < _a.length; _i++) {
                                    var tdatt = _a[_i];
                                    var temp = null;
                                    if (tdatt.value == "views-field views-field-field-room-capacity") {
                                        roomsObject_1["rooms_seats"] = Number(td.childNodes[0].value.trim());
                                        temp = roomsObject_1["rooms_seats"];
                                    }
                                    if (tdatt.value == "views-field views-field-field-room-furniture") {
                                        roomsObject_1["rooms_furniture"] = td.childNodes[0].value.trim();
                                        temp = roomsObject_1["rooms_furniture"];
                                    }
                                    if (tdatt.value == "views-field views-field-field-room-type") {
                                        roomsObject_1["rooms_type"] = td.childNodes[0].value.trim();
                                        temp = roomsObject_1["rooms_type"];
                                    }
                                }
                            }
                            td.childNodes.forEach(function (tdchild) {
                                if (tdchild.attrs) {
                                    if (tdchild.attrs[0].name == "href" && hrefArray.indexOf(tdchild.attrs[0].value) == -1) {
                                        roomsObject_1["rooms_href"] = tdchild.attrs[0].value.toString();
                                        hrefArray.push(tdchild.attrs[0].value);
                                        var lastSlash = tdchild.attrs[0].value.lastIndexOf("/");
                                        key_1 = tdchild.attrs[0].value.substr(lastSlash + 1);
                                    }
                                }
                            });
                        }
                    });
                    var processedafile = {};
                    processedafile[key_1] = roomsObject_1;
                    roomsDetails.push(processedafile);
                }
            });
        }
        return roomsDetails;
    };
    DatasetController.prototype.JSONParser = function (id, data) {
        Util_1.default.trace('JSONParser::process( ' + id + '... )');
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                var myZip = new JSZip();
                myZip.loadAsync(data, { base64: true }).then(function (zip) {
                    Util_1.default.trace('JSONParser::process(..) - unzipped');
                    var processedDataset = [];
                    var prmoises = [];
                    zip.folder("courses").forEach(function (relativePath, file) {
                        var tempValue = file.async("string");
                        prmoises.push(tempValue);
                    });
                    Promise.all(prmoises).then(function (results) {
                        try {
                            results.forEach(function (filestr) {
                                var afile = JSON.parse(filestr);
                                if (afile["result"]) {
                                    for (var _i = 0, _a = afile["result"]; _i < _a.length; _i++) {
                                        var a = _a[_i];
                                        var course_name = a["Subject"] + a["Course"];
                                        var course_year = void 0;
                                        if (a["Section"] == "overall")
                                            course_year = 1900;
                                        else
                                            course_year = a["Year"];
                                        var courseObject = {
                                            courses_dept: a["Subject"],
                                            courses_id: a["Course"],
                                            courses_uuid: a["id"].toString(),
                                            courses_avg: a["Avg"],
                                            courses_instructor: a["Professor"],
                                            courses_title: a["Title"],
                                            courses_pass: a["Pass"],
                                            courses_fail: a["Fail"],
                                            courses_audit: a["Audit"],
                                            courses_year: course_year,
                                            courses_size: a["Pass"] + a["Fail"]
                                        };
                                        var processedafile = {};
                                        processedafile[course_name] = courseObject;
                                        processedDataset.push(processedafile);
                                    }
                                }
                            });
                        }
                        catch (err) {
                            reject(err);
                        }
                        if (processedDataset.length == 0 ||
                            Object.keys(processedDataset).length == 0 ||
                            typeof processedDataset == "undefined") {
                            reject(400);
                        }
                        else {
                            fs.stat("data/" + id + ".json", function (err, stat) {
                                if (err == null) {
                                    console.log('File exists');
                                    that.save(id, processedDataset);
                                    fulfill(201);
                                }
                                else if (err.code == 'ENOENT') {
                                    that.save(id, processedDataset);
                                    fulfill(204);
                                }
                                else {
                                    console.log('Some other error: ', err.code);
                                    reject(err);
                                }
                            });
                        }
                    });
                }).catch(function (err) {
                    Util_1.default.trace('JSONParser::process(..) - unzip ERROR: ' + err.message);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.trace('JSONParser::process(..) - ERROR: ' + err);
                reject(err);
            }
        });
    };
    DatasetController.prototype.save = function (id, processedDataset) {
        this.datasets[id] = processedDataset;
        fs.stat("data/", function (err, stat) {
            if (err == null) {
                console.log('Folder exists');
                var path = "data/" + id + ".json";
                fs.writeFile(path, JSON.stringify(processedDataset));
            }
            else if (err.code == 'ENOENT') {
                fs.mkdir("data");
                var path = "data/" + id + ".json";
                fs.writeFile(path, JSON.stringify(processedDataset));
            }
        });
    };
    DatasetController.prototype.deleteDatasets = function (id) {
        var that = this;
        return new Promise(function (fulfill, reject) {
            try {
                fs.stat("data/" + id + ".json", function (err, stat) {
                    if (err == null) {
                        console.log('File exists');
                        fs.unlinkSync("data/" + id + ".json");
                        that.datasets = {};
                        fulfill(204);
                    }
                    else if (err.code == 'ENOENT') {
                        fulfill(404);
                    }
                    else {
                        console.log("some other error", err.code);
                        reject(err);
                    }
                });
            }
            catch (err) {
                Util_1.default.trace('DatasetController::delete(..) - ERROR: ' + err);
                reject(err);
            }
        });
    };
    return DatasetController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DatasetController;
//# sourceMappingURL=DatasetController.js.map