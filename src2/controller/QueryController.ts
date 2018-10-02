/**
 * Created by rtholmes on 2016-06-19.
 */

import {Datasets} from "./DatasetController";
import Log from "../Util";



export interface QueryRequest {
    GET: string|string[];
    WHERE: {};
    GROUP?: string[];
    APPLY?: {}[];
    ORDER?: {dir: string, keys: string[]} | string;
    AS: string;
}

export interface QueryResponse {
}

export default class QueryController {
    private datasets: Datasets = null;
    public static historyDatasets: any = {"courses":[], "rooms":[]};

    constructor(datasets: Datasets) {
        this.datasets = datasets;

    }

    //return an array of values that match on a certain key
    public getValues(obj: any, key: any): any {
        var objects = <any>[];
        var props = obj[Object.keys(obj)[0]];
        for (var i in props) {
            if (typeof obj[i] == 'object') {
                objects = objects.concat(this.getValues(obj[i], key));
            } else if (i == key) {
                objects.push(props[i]);
            }
        }
        return objects;
    }

    // check whether the query request is valid or not
    public isValid(query: QueryRequest): boolean {
        if (typeof query !== 'undefined' && query !== null && Object.keys(query).length > 0) {
            if ((query.hasOwnProperty('GET') && query.hasOwnProperty('WHERE') && query.hasOwnProperty('AS') )) {
                if (this.validUnderscore(query) && this.orderInGet(query) && this.groupApplyInGet(query)) {
                    return true;
                }
            }
        }
        return false;
    }

    // TODO only one dataset
    public validUnderscore(query: QueryRequest): boolean {
        let get: any = query["GET"];
        for (var g of get) {
            if (g.indexOf("_") != -1) {
                var id = g.split("_")[0];
            }
        }
        if (id == "courses") {
            var valid = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "size", "year"];
        } else if (id == "rooms") {
            var valid = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type", "furniture", "href", "location"]
        }
        let temp = this.needDataset(query);
        for (let i in temp) {
            if (valid.indexOf(temp[i].split("_")[1]) == -1) {
                return false;
            }
        }
        return true;
    }

    public orderInGet(query: QueryRequest): boolean {
        let get = query["GET"];
        let order: any = query["ORDER"];
        if (typeof order == 'undefined') {
            return true;
        } else if (order["keys"]) {
            order = order["keys"];
            for (let i of order) {
                if (get.indexOf(i) == -1) {
                    return false;
                }
            }
            return true;
        } else  {
            if (get.indexOf(order) == -1) {
                return false;
            }
            return true;
        }
    }

    public groupApplyInGet(query: QueryRequest): boolean {
        let get = query["GET"];
        let group = query["GROUP"];
        let apply: any = query["APPLY"];

        // check if group and apply appears together
        if (typeof group == 'undefined') {
            if (typeof apply == 'undefined') {
                return true;
            } else {
                return false;
            }
        } else {
            if (typeof apply == 'undefined') {
                return false;
            } else {
                // GROUP must have at least one term
                if (group.length < 1) {
                    return false;
                }

                // GROUP should contains only valid keys (seperated by underscore)
                for (let i of group) {
                    if (i.indexOf("_") == -1) {
                        return false;
                    }
                }

                // Apply valid input
                for (let i of apply) {
                    let keysInfirstElem = Object.keys(i);
                    for (let k of keysInfirstElem){
                        let valueOfk = i[k];
                        let keysInValueOfk = Object.keys(valueOfk);
                        for (let m of keysInValueOfk){
                            let valueOfm = valueOfk[m];

                            if (valueOfm.indexOf("_") == -1
                                || valueOfm.substring(valueOfm.length - 1) == "_"
                                || group.indexOf(valueOfm) >= 0){ // keys only appear in either GROUP or APPLY
                                return false;
                            }
                        }
                    }

                }

                // check if all GET items in GROUP or APPLY
                for (let i of get) {
                    if (i.indexOf("_") >= 0) {
                        if (group.indexOf(i) == -1) {
                            return false;
                        }
                    } else {
                        var applyRule = Array<string>();
                        for (var j in apply) {
                            var a: any = apply[j];
                            applyRule.push(Object.keys(a)[0]);
                        }
                        if (applyRule.indexOf(i) == -1) {
                            return false;
                        }
                    }
                }

                // keys only appear in either GROUP or APPLY

                // for (let i of apply) {
                //     if (group.indexOf(Object.keys(i)[0]) >= 0) {
                //         return false;
                //     }
                // }

                // APPLY rules should be unique
                let rules = Array<Object>();
                var i = 0;
                while (apply[i] != null) {
                    if (rules.indexOf(Object.keys(apply[i])[0]) >= 0) {
                        return false;
                    }
                    i++
                }

                return true;
            }
        }
    }

    // get the array of datasets will be used according to the query request
    public needID(query: QueryRequest): Array<any>  {
        var needID = new Array<String>();
        let temp = this.needDataset(query);
        for (let i in temp) {
            i = temp[i].split("_")[0];
            if (typeof this.datasets[i] === 'undefined') {
                if (needID.indexOf(i) == -1) {
                    needID.push(i);
                }
            }
        }
        return needID;
    }

    public needDataset(query: QueryRequest): Array<any> {
        var temp = new Array<String>();
        var get = query["GET"];
        for (let i of get) {
            if (temp.indexOf(i) < 0) {
                if (i.indexOf("_") >= 0) {
                    temp.push(i);
                }
            }
        }
        var where = <any>query["WHERE"];
        if (where['LT'] || where['GT'] || where['EQ']) {
            temp = this.mathNeed(where, temp);
        } else if (where['IS']) {
            temp = this.isNeed(where, temp);
        } else if (where['AND'] || where['OR']) {
            temp = this.logicNeed(where, temp);
        } else if (where['NOT']) {
            temp = this.notNeed(where, temp);
        }

        var apply = <any>query["APPLY"];
        if (query.APPLY){
            temp = this.applyNeed(query.APPLY, temp);
        }

        return temp;
    }

    public mathNeed(where: any, needID: any): any {
        var mathComp = Object.keys(where)[0];
        let math: string = Object.keys(where[mathComp])[0];
        if (needID.indexOf(math) < 0) {
            needID.push(math);
        }
        return needID;
    }

    public isNeed(where: any, needID: any): any {
        let is: string = Object.keys(where["IS"])[0];
        if (needID.indexOf(is) < 0) {
            needID.push(is);
        }
        return needID;
    }

    public logicNeed(where: any, needID: any): any {
        var logic = where["AND"] || where["OR"];
        for (let i of logic) {
            if (i['LT'] || i['GT'] || i['EQ']) {
                needID = this.mathNeed(i, needID);
            } else if (i['IS']) {
                needID = this.isNeed(i, needID);
            } else if (i['AND'] || i['OR']) {
                needID = this.logicNeed(i, needID);
            } else if (i['NOT']) {
                needID = this.notNeed(i, needID);
            }
        }
        return needID;
    }

    public notNeed(where: any, needID: any): any {
        var not = where["NOT"];
        if (not['LT'] || not['GT'] || not['EQ']) {
            needID = this.mathNeed(not, needID);
        } else if (not['IS']) {
            needID = this.isNeed(not, needID);
        } else if (not['AND'] || not['OR']) {
            needID = this.logicNeed(not, needID);
        } else if (not['NOT']) {
            needID = this.notNeed(not, needID);
        }
        return needID;
    }

    public applyNeed(apply: any, needID: any): any {
        for (let i of apply) {
            let applyName:string = Object.keys(i)[0];
            let applyToken:string = Object.keys(i[applyName])[0];
            let applyValue:string = i[applyName][applyToken];
            if (needID.indexOf(applyValue) < 0){
                needID.push(applyValue);
            }

        }
        return needID;

    }

    public saveCourse(query:QueryRequest){
        Log.trace('saving courses query');
        for (let k of Object.keys(QueryController.historyDatasets)){
            if (k == "courses"){
                QueryController.historyDatasets[k].push(query);
                Log.trace('courses query saved');
                // console.log(query);
                // console.log(QueryController.historyDatasets);

            }
        }

    }

    public saveRoom(query:QueryRequest){
        Log.trace('saving rooms query');

        for (let k of Object.keys(QueryController.historyDatasets)){
            if (k == "rooms"){
                QueryController.historyDatasets[k].push(query);
                Log.trace('rooms query saved');
            }
        }

    }

    // main function for query engine
    public query(query: QueryRequest): QueryResponse {
        let that = this;

        Log.trace('QueryController::query( ' + JSON.stringify(query) + ' )');


        // var that = this;
        let result: any = Array<any>();
        var temp = Array<Object>();
        var resultKey = <any>query["GET"];
        let filter: any = query["WHERE"];
        let apply: any = query["APPLY"];
        var group = query["GROUP"];
        let displayOrder: any = query["ORDER"];
        for (var g of resultKey) {
            if (g.indexOf("_") != -1) {
                var id = g.split("_")[0];
            }
        }

        if (id == "courses"){
            that.saveCourse(query);
        }else if (id == "rooms"){
            that.saveRoom(query);
        }



        let dataset = this.datasets[id];
        // var dataset = this.datasets; // for unit test

        if (filter['LT'] || filter['GT'] || filter['EQ']) {
            temp = this.handleMath(filter, dataset);
        } else if (filter['IS']) {
            temp = this.handleS(filter, dataset);
        } else if (filter['AND'] || filter['OR']) {
            temp = this.handleLogic(filter, dataset);
        } else if (filter['NOT']) {
            temp = this.handleNot(filter, dataset);
        } else {
            temp = dataset;
        }

        // fix GET properties
        for (var i in temp) {
            var tempElement: any = {};
            for (let rk of resultKey) {
                if (rk.indexOf("_") != -1) {
                    let value: any = this.getValues(temp[i], rk)[0];
                    if (typeof value == 'string') {
                        value = decodeURI(value);
                    }
                    tempElement[rk] = value;
                } else {
                    for (var a in apply) {
                        if (Object.keys(apply[a])[0] == rk) {
                            var key = Object.keys(apply[a][rk])[0];
                            let temprk: string = apply[a][rk][key];
                            if (rk == "rooms_address") {
                                tempElement[rk] = decodeURI(this.getValues(temp[i], temprk)[0]);
                            } else {
                                tempElement[rk] = this.getValues(temp[i], temprk)[0];
                            }
                        }
                    }
                }
            }
            result.push(tempElement);
        }

        // GROUP and APPLY
        if (typeof group != 'undefined') {
            // grouping
            let groupDictionary: {[groupRequire: string]: {"data": {}[]}} = {};
            let applyKey: any = Array<string>();
            let groupKey: any = Array<string>();
            for (let i of resultKey) {
                if (i.indexOf("_") <= 0) {
                    applyKey.push(i);
                } else {
                    groupKey.push(i);
                }
            }
            for (let aCourse of result) {
                let groupValue: any = [];
                for (let gk of groupKey) {
                    groupValue = groupValue.concat(aCourse[gk]);
                }
                if (groupDictionary.hasOwnProperty(groupValue)) {
                    groupDictionary[groupValue]["data"].push(aCourse);
                } else {
                    groupDictionary[groupValue] = {"data": [aCourse]};
                }
            }

            // applying
            // empty apply
            let newresult: any = Array<Object>();
            if (apply.length == 0) {
                for (var key in groupDictionary) {
                    let aCourse: any = groupDictionary[key];
                    let temp: any = {};
                    for (let gk of groupKey) {
                        temp[gk] = aCourse["data"][0][gk];
                    }
                    newresult.push(temp);
                }
                result = newresult;
            } else {
                for (var key in groupDictionary) {
                    let aCourse: any = groupDictionary[key];
                    let temp: any = {};
                    for (let gk of groupKey) {
                        temp[gk] = aCourse["data"][0][gk];
                    }
                    for (let ak of apply) {
                        let applyName = Object.keys(ak)[0];
                        let applyRule = Object.keys(ak[applyName])[0];
                        switch (applyRule) {
                            case "MAX":
                                var max = 0;
                                for (let c of aCourse["data"]) {
                                    if (c[applyName] > max) {
                                        max = c[applyName];
                                    }
                                }
                                temp[applyName] = max;
                                break;
                            case "MIN":
                                var min = aCourse["data"][0][applyName];
                                for (let c of aCourse["data"]) {
                                    if (c[applyName] < min) {
                                        min = c[applyName];
                                    }
                                }
                                temp[applyName] = min;
                                break;
                            case "AVG":
                                var count = 0;
                                var sum = 0;
                                let avg: any;
                                for (let c of aCourse["data"]) {
                                    sum += c[applyName];
                                    count++;
                                }
                                avg = Number((sum/count).toFixed(2));
                                temp[applyName] = avg;
                                break;
                            case "COUNT":
                                var count = 0;
                                var nonDuplicate = Array<any>();
                                for (let c of aCourse["data"]) {
                                    if (nonDuplicate.indexOf(c[applyName]) == -1) {
                                        count++;
                                        nonDuplicate.push(c[applyName]);
                                    }
                                }
                                temp[applyName] = count;
                                break;
                        }
                    }
                    newresult.push(temp);
                }
                result = newresult;
            }
        }

        // fix displayOrder
        if (typeof displayOrder == 'undefined') {
            // do nothing
        } else if (typeof displayOrder == 'string') {
            // ORDER type supporting D1
            this.quickSort(result, 0, result.length-1, displayOrder);
        } else {
            // ORDER type supporting D2
            let keys: string[] = displayOrder["keys"];
            if (keys.length >= 1) {
                this.quickSort(result, 0, result.length-1, keys[0]);
                var s = 1;
                while (keys[s] != null) {
                    var rs = 1;
                    let nextSort: Array<Object> = [];
                    var rest = Array<Object>();
                    nextSort.push(result[rs-1]);
                    while (result[rs] != null) {
                        var j = 1;
                        var count = 0;
                        while (s-j >= 0) {
                            if (result[rs][keys[s - j]] == result[rs - 1][keys[s - j]]) {
                                count++;
                            }
                            j++;
                        }
                        if (count == s) {
                            nextSort.push(result[rs]);
                        } else {
                            this.quickSort(nextSort, 0, nextSort.length - 1, keys[s]);
                            rest = rest.concat(nextSort);
                            nextSort = [result[rs]];
                        }
                        rs++;
                    }
                    this.quickSort(nextSort, 0, nextSort.length-1, keys[s]);
                    result = rest.concat(nextSort);
                    s++;
                }
            }

            // reverse the sorting order
            if (displayOrder["dir"] == "DOWN") {
                var reverseResult = Array<Object>();
                for (var reverse = result.length-1; reverse >= 0; reverse--) {
                    reverseResult.push(result[reverse]);
                }
                result = reverseResult;
            }
        }



        return {render: query.AS, result: result};
    }

    public quickSort(arr: any, low: any, high: any, sort: any): any {
        var that = this;
        let pivot: number;
        let partitionIndex: number;
        if (low < high) {
            // pivot = high;
            pivot = that.partition(arr, low, high, sort);
            that.quickSort(arr, low, pivot - 1, sort);
            that.quickSort(arr, pivot + 1, high, sort);
        }
    }

    public partition(arr: any, low: any, high: any, sort: any): number {
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
    }

    public swap(arr: any, i: any, j: any) {
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    public handleNot(filter: any, dataset: any): any {
        var result = Array<Object>();
        var temp = Array<Object>();

        var notComp = <any>Object.keys(filter)[0];
        var filterBody = filter[notComp];

        if (filterBody['LT'] || filterBody['GT'] || filterBody['EQ']) {
            temp = this.handleMath(filterBody, dataset);
        } else if (filterBody['AND'] || filterBody["OR"]) {
            temp = this.handleLogic(filterBody, dataset);
        } else if (filterBody['IS']) {
            temp = this.handleS(filterBody, dataset);
        } else if (filterBody['NOT']) {
            temp = this.handleNot(filterBody, dataset);
        }

        for (var i in dataset) {
            if (temp.indexOf(dataset[i]) == -1) {
                result.push(dataset[i]);
            }
        }

        return result;
    }

    public handleLogic(filter: any, dataset: any): any {
        var result = Array<Object>();
        var resultArray = Array<any>();

        var logicComp = <any>Object.keys(filter)[0];
        var filterBody = filter[logicComp];
        for (var i in filterBody) {
            var filterElement = filterBody[i];
            if (filterElement['LT'] || filterElement['GT'] || filterElement['EQ']) {
                resultArray.push(this.handleMath(filterElement, dataset));
            } else if (filterElement['IS']) {
                resultArray.push(this.handleS(filterElement, dataset));
            } else if (filterElement['AND'] || filterElement['OR']) {
                resultArray.push(this.handleLogic(filterElement, dataset));
            } else if (filterElement['NOT']) {
                resultArray.push(this.handleNot(filterElement, dataset));
            }
        }

        switch (logicComp) {
            case "AND":{
                resultArray.sort(function (a, b) {
                    return a.length - b.length
                });
                let baseArray = resultArray[0].slice(0);
                let compareArray = baseArray.slice(0);
                resultArray = resultArray.slice(1);
                for (let i in resultArray) {
                    for (var aCourse of baseArray) {
                        if (resultArray[i].indexOf(aCourse) === -1) {
                            //compareArray.push(aCourse);
                            while(compareArray.indexOf(aCourse)!==-1){
                                let a=compareArray.indexOf(aCourse);
                                compareArray.splice(a,1);//todo this will be used in apply
                            }
                        }
                    }
                }
                result = compareArray;
                // var array = Array<any>();
                // var cntObj = <any>{};
                // var item:any, cnt: any = null;
                // for (var m = 0; m < resultArray.length; m++) {
                //     array = resultArray[m];
                //     for (var k = 0; k < array.length; k++) {
                //         item = "-" + JSON.stringify(array[k]);
                //         cnt = cntObj[item] || 0;
                //         if (cnt == m) {
                //             cntObj[item] = cnt + 1;
                //         }
                //     }
                // }
                // for (item in cntObj) {
                //     if (cntObj[item] && cntObj[item] == resultArray.length) {
                //         result.push(JSON.parse(item.substring(1)));
                //     }
                // }
                break;
            }
            case "OR":
                resultArray.sort(function (a, b) {
                    return b.length - a.length
                });
                for (let i=0; i<resultArray.length; i++) {
                    result = result.concat(resultArray[i]);
                }
                for(let i=0; i<result.length; i++) {
                    for(let j=i+1; j<result.length; j++) {
                        if(result[i] === result[j])
                            result.splice(j--, 1);
                    }
                }

                break;
        }
        return result;
    }

    public handleMath(filter: any, dataset: any): any {
        var result = Array<Object>();

        var mathComp = <any>Object.keys(filter)[0];
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
    }

    public handleS(filter: any, dataset: any) : any {
        var result = Array<Object>();

        var SComp = <any>Object.keys(filter)[0];
        var filterBody = filter[SComp];
        var filterKey = Object.getOwnPropertyNames(filterBody)[0];
        let filterValue: any = filterBody[filterKey];

        if (filterKey == "rooms_location") {
            let building: string = filterValue["building"];
            let inputDistance: number = filterValue["distance"];
            let param: string = filterValue["param"];

            for (var subdata of dataset) {
                var sudodata = subdata[Object.keys(subdata)[0]];
                if (sudodata["rooms_shortname"] == building) {
                    var lat0 = sudodata["rooms_lat"];
                    var lon0 = sudodata["rooms_lon"];
                    break;
                }
            }

            for (var index in dataset) {
                var data = dataset[index];
                if (this.getValues(data, "rooms_shortname") != building) {
                    var lat = this.getValues(data, "rooms_lat")[0];
                    var lon = this.getValues(data, "rooms_lon")[0];
                    var distance = this.getDistanceFromLatLonInKm(lat0, lon0, lat, lon);

                    if (param == "<") {
                        if (distance <= inputDistance) {
                            result.push(data);
                        }
                    } else if (param == ">") {
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
                    // star at both beginning and end
                    if (filterValue.lastIndexOf('*') == (filterValue.length - 1)) {
                        var str = filterValue.replace(/\*/g, "");
                        if (filterKey == "rooms_address") {
                            value = decodeURI(value);
                        }
                        if (value.includes(str)) {
                            result.push(data);
                        }
                    } else {
                        // star at beginning
                        var str = filterValue.replace(/\*/g, "");
                        if (filterKey == "rooms_address") {
                            value = decodeURI(value);
                        }
                        if (value.slice(0 - str.length) == str) {
                            result.push(data);
                        }
                    }
                } else {
                    // star at the end
                    if (filterValue.indexOf('*') == filterValue.length - 1) {
                        var str = filterValue.replace(/\*/g, "");
                        if (filterKey == "rooms_address") {
                            value = decodeURI(value);
                        }
                        if (value.slice(0, str.length) == str) {
                            result.push(data);
                        }
                    } else {
                        // no star at all
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
    }

    // public distance(lat1: any, lon1: any, lat2: any, lon2: any) {
    //     var radlat1 = Math.PI * lat1/180;
    //     var radlat2 = Math.PI * lat2/180;
    //     var theta = lon1-lon2;
    //     var radtheta = Math.PI * theta/180;
    //     var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    //     dist = Math.acos(dist);
    //     dist = dist * 180/Math.PI;
    //     dist = dist * 60 * 1.1515;
    //     dist = dist * 1.609344;
    //     return dist
    // }

    public getDistanceFromLatLonInKm(lat1:any,lon1:any,lat2:any,lon2:any) {
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
        var dLon = this.deg2rad(lon2-lon1);
        var a =
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
    }

    public deg2rad(deg: any) {
        return deg * (Math.PI/180)
    }

}

