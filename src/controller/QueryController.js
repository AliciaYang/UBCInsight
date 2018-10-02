"use strict";
var Util_1 = require("../Util");
var QueryController = (function () {
    function QueryController(datasets) {
        this.datasets = null;
        this.datasets = datasets;
    }
    QueryController.prototype.getValues = function (obj, key) {
        var objects = [];
        var props = obj[Object.keys(obj)[0]];
        for (var i in props) {
            if (typeof obj[i] == 'object') {
                objects = objects.concat(this.getValues(obj[i], key));
            }
            else if (i == key) {
                objects.push(props[i]);
            }
        }
        return objects;
    };
    QueryController.prototype.isValid = function (query) {
        if (typeof query !== 'undefined' && query !== null && Object.keys(query).length > 0) {
            if ((query.hasOwnProperty('GET') && query.hasOwnProperty('WHERE') && query.hasOwnProperty('AS'))) {
                if (this.groupApplyInGet(query) && this.validUnderscore(query) && this.orderInGet(query)) {
                    return true;
                }
            }
        }
        return false;
    };
    QueryController.prototype.validUnderscore = function (query) {
        var get = query["GET"];
        for (var _i = 0, get_1 = get; _i < get_1.length; _i++) {
            var g = get_1[_i];
            if (g.indexOf("_") != -1) {
                var id = g.split("_")[0];
            }
        }
        if (id == "courses") {
            var valid = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "size", "year"];
        }
        else if (id == "rooms") {
            var valid = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type", "furniture", "href", "location"];
        }
        var temp = this.needDataset(query);
        for (var i in temp) {
            if (valid.indexOf(temp[i].split("_")[1]) == -1) {
                return false;
            }
        }
        return true;
    };
    QueryController.prototype.orderInGet = function (query) {
        var get = query["GET"];
        var order = query["ORDER"];
        if (typeof order == 'undefined') {
            return true;
        }
        else if (order["keys"]) {
            order = order["keys"];
            for (var _i = 0, order_1 = order; _i < order_1.length; _i++) {
                var i = order_1[_i];
                if (get.indexOf(i) == -1) {
                    return false;
                }
            }
            return true;
        }
        else {
            if (get.indexOf(order) == -1) {
                return false;
            }
            return true;
        }
    };
    QueryController.prototype.groupApplyInGet = function (query) {
        var get = query["GET"];
        var group = query["GROUP"];
        var apply = query["APPLY"];
        if (typeof group == 'undefined') {
            if (typeof apply == 'undefined') {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            if (typeof apply == 'undefined') {
                return false;
            }
            else {
                if (group.length < 1) {
                    return false;
                }
                for (var _i = 0, group_1 = group; _i < group_1.length; _i++) {
                    var i_1 = group_1[_i];
                    if (i_1.indexOf("_") == -1) {
                        return false;
                    }
                }
                for (var _a = 0, apply_1 = apply; _a < apply_1.length; _a++) {
                    var i_2 = apply_1[_a];
                    var keysInfirstElem = Object.keys(i_2);
                    for (var _b = 0, keysInfirstElem_1 = keysInfirstElem; _b < keysInfirstElem_1.length; _b++) {
                        var k = keysInfirstElem_1[_b];
                        var valueOfk = i_2[k];
                        var keysInValueOfk = Object.keys(valueOfk);
                        for (var _c = 0, keysInValueOfk_1 = keysInValueOfk; _c < keysInValueOfk_1.length; _c++) {
                            var m = keysInValueOfk_1[_c];
                            var valueOfm = valueOfk[m];
                            if (valueOfm.indexOf("_") == -1
                                || valueOfm.substring(valueOfm.length - 1) == "_"
                                || group.indexOf(valueOfm) >= 0) {
                                return false;
                            }
                        }
                    }
                }
                for (var _d = 0, get_2 = get; _d < get_2.length; _d++) {
                    var i_3 = get_2[_d];
                    if (i_3.indexOf("_") >= 0) {
                        if (group.indexOf(i_3) == -1) {
                            return false;
                        }
                    }
                    else {
                        var applyRule = Array();
                        for (var j in apply) {
                            var a = apply[j];
                            applyRule.push(Object.keys(a)[0]);
                        }
                        if (applyRule.indexOf(i_3) == -1) {
                            return false;
                        }
                    }
                }
                for (var _e = 0, apply_2 = apply; _e < apply_2.length; _e++) {
                    var i_4 = apply_2[_e];
                    if (group.indexOf(Object.keys(i_4)[0]) >= 0) {
                        return false;
                    }
                }
                var rules = Array();
                var i = 0;
                while (apply[i] != null) {
                    if (rules.indexOf(Object.keys(apply[i])[0]) >= 0) {
                        return false;
                    }
                    i++;
                }
                return true;
            }
        }
    };
    QueryController.prototype.needID = function (query) {
        var needID = new Array();
        var temp = this.needDataset(query);
        for (var i in temp) {
            i = temp[i].split("_")[0];
            if (typeof this.datasets[i] === 'undefined') {
                if (needID.indexOf(i) == -1) {
                    needID.push(i);
                }
            }
        }
        return needID;
    };
    QueryController.prototype.needDataset = function (query) {
        var temp = new Array();
        var get = query["GET"];
        for (var _i = 0, get_3 = get; _i < get_3.length; _i++) {
            var i = get_3[_i];
            if (temp.indexOf(i) < 0) {
                if (i.indexOf("_") >= 0) {
                    temp.push(i);
                }
            }
        }
        var where = query["WHERE"];
        if (where['LT'] || where['GT'] || where['EQ']) {
            temp = this.mathNeed(where, temp);
        }
        else if (where['IS']) {
            temp = this.isNeed(where, temp);
        }
        else if (where['AND'] || where['OR']) {
            temp = this.logicNeed(where, temp);
        }
        else if (where['NOT']) {
            temp = this.notNeed(where, temp);
        }
        var apply = query["APPLY"];
        if (query.APPLY) {
            temp = this.applyNeed(query.APPLY, temp);
        }
        return temp;
    };
    QueryController.prototype.mathNeed = function (where, needID) {
        var mathComp = Object.keys(where)[0];
        var math = Object.keys(where[mathComp])[0];
        if (needID.indexOf(math) < 0) {
            needID.push(math);
        }
        return needID;
    };
    QueryController.prototype.isNeed = function (where, needID) {
        var is = Object.keys(where["IS"])[0];
        if (needID.indexOf(is) < 0) {
            needID.push(is);
        }
        return needID;
    };
    QueryController.prototype.logicNeed = function (where, needID) {
        var logic = where["AND"] || where["OR"];
        for (var _i = 0, logic_1 = logic; _i < logic_1.length; _i++) {
            var i = logic_1[_i];
            if (i['LT'] || i['GT'] || i['EQ']) {
                needID = this.mathNeed(i, needID);
            }
            else if (i['IS']) {
                needID = this.isNeed(i, needID);
            }
            else if (i['AND'] || i['OR']) {
                needID = this.logicNeed(i, needID);
            }
            else if (i['NOT']) {
                needID = this.notNeed(i, needID);
            }
        }
        return needID;
    };
    QueryController.prototype.notNeed = function (where, needID) {
        var not = where["NOT"];
        if (not['LT'] || not['GT'] || not['EQ']) {
            needID = this.mathNeed(not, needID);
        }
        else if (not['IS']) {
            needID = this.isNeed(not, needID);
        }
        else if (not['AND'] || not['OR']) {
            needID = this.logicNeed(not, needID);
        }
        else if (not['NOT']) {
            needID = this.notNeed(not, needID);
        }
        return needID;
    };
    QueryController.prototype.applyNeed = function (apply, needID) {
        for (var _i = 0, apply_3 = apply; _i < apply_3.length; _i++) {
            var i = apply_3[_i];
            var applyName = Object.keys(i)[0];
            var applyToken = Object.keys(i[applyName])[0];
            var applyValue = i[applyName][applyToken];
            if (needID.indexOf(applyValue) < 0) {
                needID.push(applyValue);
            }
        }
        return needID;
    };
    QueryController.prototype.saveCourse = function (query) {
        Util_1.default.trace('saving courses query');
        for (var _i = 0, _a = Object.keys(QueryController.historyDatasets); _i < _a.length; _i++) {
            var k = _a[_i];
            if (k == "courses") {
                QueryController.historyDatasets[k].push(query);
                Util_1.default.trace('courses query saved');
            }
        }
    };
    QueryController.prototype.saveRoom = function (query) {
        Util_1.default.trace('saving rooms query');
        for (var _i = 0, _a = Object.keys(QueryController.historyDatasets); _i < _a.length; _i++) {
            var k = _a[_i];
            if (k == "rooms") {
                QueryController.historyDatasets[k].push(query);
                Util_1.default.trace('rooms query saved');
            }
        }
    };
    QueryController.prototype.query = function (query) {
        var that = this;
        Util_1.default.trace('QueryController::query( ' + JSON.stringify(query) + ' )');
        var result = Array();
        var temp = Array();
        var resultKey = query["GET"];
        var filter = query["WHERE"];
        var apply = query["APPLY"];
        var group = query["GROUP"];
        var displayOrder = query["ORDER"];
        for (var _i = 0, resultKey_1 = resultKey; _i < resultKey_1.length; _i++) {
            var g = resultKey_1[_i];
            if (g.indexOf("_") != -1) {
                var id = g.split("_")[0];
            }
        }
        if (id == "courses") {
            that.saveCourse(query);
        }
        else if (id == "rooms") {
            that.saveRoom(query);
        }
        var dataset = this.datasets[id];
        if (filter['LT'] || filter['GT'] || filter['EQ']) {
            temp = this.handleMath(filter, dataset);
        }
        else if (filter['IS']) {
            temp = this.handleS(filter, dataset);
        }
        else if (filter['AND'] || filter['OR']) {
            temp = this.handleLogic(filter, dataset);
        }
        else if (filter['NOT']) {
            if (filter['NOT']['NOT']) {
                temp = this.handleDualNot(filter, dataset);
            }
            else {
                temp = this.handleNot(filter, dataset);
            }
        }
        else {
            temp = dataset;
        }
        for (var i in temp) {
            var tempElement = {};
            for (var _a = 0, resultKey_2 = resultKey; _a < resultKey_2.length; _a++) {
                var rk = resultKey_2[_a];
                if (rk.indexOf("_") != -1) {
                    var value = this.getValues(temp[i], rk)[0];
                    if (typeof value == 'string') {
                        value = decodeURI(value);
                    }
                    tempElement[rk] = value;
                }
                else {
                    for (var a in apply) {
                        if (Object.keys(apply[a])[0] == rk) {
                            var key = Object.keys(apply[a][rk])[0];
                            var temprk = apply[a][rk][key];
                            if (rk == "rooms_address") {
                                tempElement[rk] = decodeURI(this.getValues(temp[i], temprk)[0]);
                            }
                            else {
                                tempElement[rk] = this.getValues(temp[i], temprk)[0];
                            }
                        }
                    }
                }
            }
            result.push(tempElement);
        }
        if (typeof group != 'undefined') {
            var groupDictionary = {};
            var applyKey = Array();
            var groupKey = Array();
            for (var _b = 0, resultKey_3 = resultKey; _b < resultKey_3.length; _b++) {
                var i_5 = resultKey_3[_b];
                if (i_5.indexOf("_") <= 0) {
                    applyKey.push(i_5);
                }
                else {
                    groupKey.push(i_5);
                }
            }
            for (var _c = 0, result_1 = result; _c < result_1.length; _c++) {
                var aCourse = result_1[_c];
                var groupValue = [];
                for (var _d = 0, groupKey_1 = groupKey; _d < groupKey_1.length; _d++) {
                    var gk = groupKey_1[_d];
                    groupValue = groupValue.concat(aCourse[gk]);
                }
                if (groupDictionary.hasOwnProperty(groupValue)) {
                    groupDictionary[groupValue]["data"].push(aCourse);
                }
                else {
                    groupDictionary[groupValue] = { "data": [aCourse] };
                }
            }
            var newresult = Array();
            if (apply.length == 0) {
                for (var key in groupDictionary) {
                    var aCourse = groupDictionary[key];
                    var temp_1 = {};
                    for (var _e = 0, groupKey_2 = groupKey; _e < groupKey_2.length; _e++) {
                        var gk = groupKey_2[_e];
                        temp_1[gk] = aCourse["data"][0][gk];
                    }
                    newresult.push(temp_1);
                }
                result = newresult;
            }
            else {
                for (var key in groupDictionary) {
                    var aCourse = groupDictionary[key];
                    var temp_2 = {};
                    for (var _f = 0, groupKey_3 = groupKey; _f < groupKey_3.length; _f++) {
                        var gk = groupKey_3[_f];
                        temp_2[gk] = aCourse["data"][0][gk];
                    }
                    for (var _g = 0, apply_4 = apply; _g < apply_4.length; _g++) {
                        var ak = apply_4[_g];
                        var applyName = Object.keys(ak)[0];
                        var applyRule = Object.keys(ak[applyName])[0];
                        switch (applyRule) {
                            case "MAX":
                                var max = 0;
                                for (var _h = 0, _j = aCourse["data"]; _h < _j.length; _h++) {
                                    var c = _j[_h];
                                    if (c[applyName] > max) {
                                        max = c[applyName];
                                    }
                                }
                                temp_2[applyName] = max;
                                break;
                            case "MIN":
                                var min = aCourse["data"][0][applyName];
                                for (var _k = 0, _l = aCourse["data"]; _k < _l.length; _k++) {
                                    var c = _l[_k];
                                    if (c[applyName] < min) {
                                        min = c[applyName];
                                    }
                                }
                                temp_2[applyName] = min;
                                break;
                            case "AVG":
                                var count = 0;
                                var sum = 0;
                                var avg = void 0;
                                for (var _m = 0, _o = aCourse["data"]; _m < _o.length; _m++) {
                                    var c = _o[_m];
                                    sum += c[applyName];
                                    count++;
                                }
                                avg = Number((sum / count).toFixed(2));
                                temp_2[applyName] = avg;
                                break;
                            case "COUNT":
                                var count = 0;
                                var nonDuplicate = Array();
                                for (var _p = 0, _q = aCourse["data"]; _p < _q.length; _p++) {
                                    var c = _q[_p];
                                    if (nonDuplicate.indexOf(c[applyName]) == -1) {
                                        count++;
                                        nonDuplicate.push(c[applyName]);
                                    }
                                }
                                temp_2[applyName] = count;
                                break;
                        }
                    }
                    newresult.push(temp_2);
                }
                result = newresult;
            }
        }
        if (typeof displayOrder == 'undefined') {
        }
        else if (typeof displayOrder == 'string') {
            this.quickSort(result, 0, result.length - 1, displayOrder);
        }
        else {
            var keys = displayOrder["keys"];
            if (keys.length >= 1) {
                this.quickSort(result, 0, result.length - 1, keys[0]);
                var s = 1;
                while (keys[s] != null) {
                    var rs = 1;
                    var nextSort = [];
                    var rest = Array();
                    nextSort.push(result[rs - 1]);
                    while (result[rs] != null) {
                        var j = 1;
                        var count = 0;
                        while (s - j >= 0) {
                            if (result[rs][keys[s - j]] == result[rs - 1][keys[s - j]]) {
                                count++;
                            }
                            j++;
                        }
                        if (count == s) {
                            nextSort.push(result[rs]);
                        }
                        else {
                            this.quickSort(nextSort, 0, nextSort.length - 1, keys[s]);
                            rest = rest.concat(nextSort);
                            nextSort = [result[rs]];
                        }
                        rs++;
                    }
                    this.quickSort(nextSort, 0, nextSort.length - 1, keys[s]);
                    result = rest.concat(nextSort);
                    s++;
                }
            }
            if (displayOrder["dir"] == "DOWN") {
                var reverseResult = Array();
                for (var reverse = result.length - 1; reverse >= 0; reverse--) {
                    reverseResult.push(result[reverse]);
                }
                result = reverseResult;
            }
        }
        return { render: query.AS, result: result };
    };
    QueryController.prototype.quickSort = function (arr, low, high, sort) {
        var that = this;
        var pivot;
        var partitionIndex;
        if (low < high) {
            pivot = that.partition(arr, low, high, sort);
            that.quickSort(arr, low, pivot - 1, sort);
            that.quickSort(arr, pivot + 1, high, sort);
        }
    };
    QueryController.prototype.partition = function (arr, low, high, sort) {
        var that = this;
        var pivotValue = arr[high][sort];
        var partitionIndex = low;
        for (var i = low; i < high; i++) {
            if (arr[i][sort] < pivotValue) {
                that.swap(arr, i, partitionIndex);
                partitionIndex++;
            }
        }
        that.swap(arr, partitionIndex, high);
        return partitionIndex;
    };
    QueryController.prototype.swap = function (arr, i, j) {
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    };
    QueryController.prototype.handleNot = function (filter, dataset) {
        var result = Array();
        var temp = Array();
        var notComp = Object.keys(filter)[0];
        var filterBody = filter[notComp];
        if (filterBody['LT'] || filterBody['GT'] || filterBody['EQ']) {
            temp = this.handleMath(filterBody, dataset);
        }
        else if (filterBody['AND'] || filterBody["OR"]) {
            temp = this.handleLogic(filterBody, dataset);
        }
        else if (filterBody['IS']) {
            temp = this.handleS(filterBody, dataset);
        }
        else if (filterBody['NOT']) {
            temp = this.handleNot(filterBody, dataset);
        }
        for (var i in dataset) {
            if (temp.indexOf(dataset[i]) == -1) {
                result.push(dataset[i]);
            }
        }
        return result;
    };
    QueryController.prototype.handleDualNot = function (filter, dataset) {
        var result = Array();
        var filterBody = filter['NOT']['NOT'];
        if (filterBody['LT'] || filterBody['GT'] || filterBody['EQ']) {
            result = this.handleMath(filterBody, dataset);
        }
        else if (filterBody['AND'] || filterBody["OR"]) {
            result = this.handleLogic(filterBody, dataset);
        }
        else if (filterBody['IS']) {
            result = this.handleS(filterBody, dataset);
        }
        else if (filterBody['NOT']) {
            result = this.handleNot(filterBody, dataset);
        }
        return result;
    };
    QueryController.prototype.handleLogic = function (filter, dataset) {
        var result = Array();
        var resultArray = Array();
        var logicComp = Object.keys(filter)[0];
        var filterBody = filter[logicComp];
        for (var i in filterBody) {
            var filterElement = filterBody[i];
            if (filterElement['LT'] || filterElement['GT'] || filterElement['EQ']) {
                resultArray.push(this.handleMath(filterElement, dataset));
            }
            else if (filterElement['IS']) {
                resultArray.push(this.handleS(filterElement, dataset));
            }
            else if (filterElement['AND'] || filterElement['OR']) {
                resultArray.push(this.handleLogic(filterElement, dataset));
            }
            else if (filterElement['NOT']) {
                resultArray.push(this.handleNot(filterElement, dataset));
            }
        }
        switch (logicComp) {
            case "AND": {
                resultArray.sort(function (a, b) {
                    return a.length - b.length;
                });
                var baseArray = resultArray[0].slice(0);
                var compareArray = baseArray.slice(0);
                resultArray = resultArray.slice(1);
                for (var i_6 in resultArray) {
                    for (var _i = 0, baseArray_1 = baseArray; _i < baseArray_1.length; _i++) {
                        var aCourse = baseArray_1[_i];
                        if (resultArray[i_6].indexOf(aCourse) === -1) {
                            while (compareArray.indexOf(aCourse) !== -1) {
                                var a = compareArray.indexOf(aCourse);
                                compareArray.splice(a, 1);
                            }
                        }
                    }
                }
                result = compareArray;
                break;
            }
            case "OR":
                resultArray.sort(function (a, b) {
                    return b.length - a.length;
                });
                for (var i_7 = 0; i_7 < resultArray.length; i_7++) {
                    result = result.concat(resultArray[i_7]);
                }
                for (var i_8 = 0; i_8 < result.length; i_8++) {
                    for (var j = i_8 + 1; j < result.length; j++) {
                        if (result[i_8] === result[j])
                            result.splice(j--, 1);
                    }
                }
                break;
        }
        return result;
    };
    QueryController.prototype.handleMath = function (filter, dataset) {
        var result = Array();
        var mathComp = Object.keys(filter)[0];
        var filterBody = filter[mathComp];
        var filterKey = Object.getOwnPropertyNames(filterBody)[0];
        var filterValue = filterBody[filterKey];
        for (var index in dataset) {
            var data = dataset[index];
            var value = this.getValues(data, filterKey)[0];
            switch (mathComp) {
                case "LT":
                    if (value < filterValue) {
                        result.push(data);
                    }
                    break;
                case "GT":
                    if (value > filterValue) {
                        result.push(data);
                    }
                    break;
                case "EQ":
                    if (value == filterValue) {
                        result.push(data);
                    }
                    break;
            }
        }
        return result;
    };
    QueryController.prototype.handleS = function (filter, dataset) {
        var result = Array();
        var SComp = Object.keys(filter)[0];
        var filterBody = filter[SComp];
        var filterKey = Object.getOwnPropertyNames(filterBody)[0];
        var filterValue = filterBody[filterKey];
        if (filterKey == "rooms_location") {
            var building = filterValue["building"];
            var inputDistance = filterValue["distance"];
            var param = filterValue["param"];
            for (var _i = 0, dataset_1 = dataset; _i < dataset_1.length; _i++) {
                var subdata = dataset_1[_i];
                var sudodata = subdata[Object.keys(subdata)[0]];
                if (sudodata["rooms_shortname"] == building) {
                    var lat0 = sudodata["rooms_lat"];
                    var lon0 = sudodata["rooms_lon"];
                    break;
                }
            }
            for (var index in dataset) {
                var data = dataset[index];
                if (this.getValues(data, "rooms_shortname") == "MATH") {
                    var lat = this.getValues(data, "rooms_lat")[0];
                    var lon = this.getValues(data, "rooms_lon")[0];
                    var distance = this.getDistanceFromLatLonInKm(lat0, lon0, lat, lon);
                }
                if (this.getValues(data, "rooms_shortname") != building) {
                    var lat = this.getValues(data, "rooms_lat")[0];
                    var lon = this.getValues(data, "rooms_lon")[0];
                    var distance = this.getDistanceFromLatLonInKm(lat0, lon0, lat, lon);
                    if (param == "<") {
                        if (distance <= inputDistance) {
                            result.push(data);
                        }
                    }
                    else if (param == ">") {
                        if (distance >= inputDistance) {
                            result.push(data);
                        }
                    }
                }
            }
        }
        else {
            for (var index in dataset) {
                var data = dataset[index];
                var value = this.getValues(data, filterKey)[0];
                if (filterValue.indexOf('*') == 0) {
                    if (filterValue.lastIndexOf('*') == (filterValue.length - 1)) {
                        var str = filterValue.replace(/\*/g, "");
                        if (filterKey == "rooms_address") {
                            value = decodeURI(value);
                        }
                        if (value.includes(str)) {
                            result.push(data);
                        }
                    }
                    else {
                        var str = filterValue.replace(/\*/g, "");
                        if (filterKey == "rooms_address") {
                            value = decodeURI(value);
                        }
                        if (value.slice(0 - str.length) == str) {
                            result.push(data);
                        }
                    }
                }
                else {
                    if (filterValue.indexOf('*') == filterValue.length - 1) {
                        var str = filterValue.replace(/\*/g, "");
                        if (filterKey == "rooms_address") {
                            value = decodeURI(value);
                        }
                        if (value.slice(0, str.length) == str) {
                            result.push(data);
                        }
                    }
                    else {
                        if (filterKey == "rooms_address") {
                            value = decodeURI(value);
                        }
                        if (value == filterValue) {
                            result.push(data);
                        }
                    }
                }
            }
        }
        return result;
    };
    QueryController.prototype.getDistanceFromLatLonInKm = function (lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = this.deg2rad(lat2 - lat1);
        var dLon = this.deg2rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d;
    };
    QueryController.prototype.deg2rad = function (deg) {
        return deg * (Math.PI / 180);
    };
    QueryController.historyDatasets = { "courses": [], "rooms": [] };
    return QueryController;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = QueryController;
//# sourceMappingURL=QueryController.js.map