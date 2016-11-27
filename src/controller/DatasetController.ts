/**
 * Created by rtholmes on 2016-09-03.
 */

import Log from "../Util";
import JSZip = require('jszip');
import forEach = require("core-js/library/fn/array/for-each");
import fs = require('fs');
import parse5 = require('parse5');
import {ASTNode} from "parse5";
import http = require('http');

/**
 * In memory representation of all datasets.
 */
export interface Datasets {
    [id: string]: {}[];
}

export default class DatasetController {

    private datasets: Datasets = {};

    constructor() {
        Log.trace('DatasetController::init()');
    }

    /**
     * Returns the referenced dataset. If the dataset is not in memory, it should be
     * loaded from disk and put in memory. If it is not in disk, then it should return
     * null.
     *
     * @param id
     * @returns {{}}
     */
    //

    public getDataset(id: string): any {


        if (Object.keys(this.datasets).length == 0) { // check if it's in memory

                if (id == "courses" || id == "rooms") {

                    let data = fs.readFileSync("data/" + id + ".json", "utf8"); // read the file

                    // if (Object.keys(data).length == 0) { // check if file has content
                    //     return null;
                    // }
                    this.datasets = JSON.parse(data);

                    return this.datasets;
                }
                else {return null;}


        }

        // if (this.datasets.hasOwnProperty(id)){
        //     return this.datasets[id];
        // }

        //return this.datasets[id];


        // TODO: this should check if the dataset is on disk in ./data if it is not already in memory.


    }

    public getDatasets(): Datasets {
        // TODO: if datasets is empty, load all dataset files in ./data from disk

        if (Object.keys(this.datasets).length == 0) {

            let data = fs.readdir("data/");

            if (typeof data != "undefined"){};

                //this.datasets = JSON.parse(JSON.stringify(data));

        }

        return this.datasets;
    }


    /**
     * Process the dataset; save it to disk when complete.
     *
     * @param id
     * @param data base64 representation of a zip file
     * @returns {Promise<boolean>} returns true if successful; false if the dataset was invalid (for whatever reason)
     */
    public process(id: string, data: any):Promise<number> {
        let that = this;
        if (id == "courses"){
            return that.JSONParser(id, data);
        }
        else if (id == "rooms") {
            return that.HTMLParser(id, data);
        }
        else {return new Promise(function (reject) {
            reject(400);
        });
        }
    }


    public HTMLParser(id:string, data:any):Promise<number> {
        Log.trace('HTMLParser::process( ' + id + '... )');


        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let myZip = new JSZip();
                myZip.loadAsync(data, {base64: true}).then(function (zip: JSZip) {
                    Log.trace('HTMLParser::process(..) - unzipped');

                    let processedDataset: any = [];

                    let temp: any = {};

                    let tempRoom: any = [];

                    let filePath: any = [];

                    let shortNameAndAdressArray = <any>Array;

                    let buildingOnlyArray: any = [];

                    let buildingFullName: any = [];

                    let prmoises: Promise<any>[] = [];

                    let addressPromises: Promise<any>[] = [];

                    let html:JSZipObject = zip.file("index.htm");

                    html.async("string").then(function (indexHTML) {
                        Log.trace("HTMLParser::reading HTML");

                        let start = indexHTML.indexOf("<tbody>");
                        let end = indexHTML.indexOf("</tbody>");

                        let tbody = indexHTML.substring(start, end + 8); // geting <tbody></tbody>

                        var document = parse5.parse(tbody, { treeAdapter: parse5.treeAdapters.default });

                        shortNameAndAdressArray = that.getShortNameAndAdress(document);
                        //console.log(shortNameAndAdressArray);

                        buildingFullName = that.getBuildingFullName(document);
                        //console.log(buildingFullName);

                        buildingOnlyArray = that.getBuildingOnlyArray(shortNameAndAdressArray);
                        //console.log(buildingOnlyArray);

                        for (let i in buildingOnlyArray) {
                            let propertiesElement: any = {};
                            let addressIndex: number = 2 * Number(i) + 1;
                            propertiesElement["shortname"] = buildingOnlyArray[i];
                            propertiesElement["fullname"] = buildingFullName[i];
                            let addressURL: string = encodeURI(shortNameAndAdressArray[addressIndex]);
                            propertiesElement["address"] = addressURL;
                            temp[buildingOnlyArray[i]] = propertiesElement;


                            // get lat lon
                            let theUrl: string = "http://skaha.cs.ubc.ca:8022/api/v1/team14/" + addressURL;

                            // approach with promise
                            let promise: Promise<any> = that.httpFunction(theUrl);
                            addressPromises.push(promise);
                        }

                        Promise.all(addressPromises).then(function (results: any[]) {
                            try {
                                let count: number = 0;
                                for (let building in temp) {
                                    temp[building]["lat"] = results[count]["lat"];
                                    temp[building]["lon"] = results[count]["lon"];
                                    count++;
                                }

                                filePath = that.getBuildingPath(tbody);

                                for  (let aPath of filePath){
                                    aPath = aPath.slice(2);
                                    let tempValue = zip.file(aPath).async("string"); // reading the file as string
                                    prmoises.push(tempValue);

                                }

                                Promise.all(prmoises).then(function (results: any[]) {
                                    try {
                                        for (let afile of results) {


                                            let start = afile.indexOf("<tbody>"); // check if the building has rooms
                                            if (start != -1) {
                                                let end = afile.indexOf("</tbody>");
                                                let tbody = afile.substring(start, end + 8); // geting <tbody></tbody>
                                                for (let room of that.getRoomsDetails(tbody)) {
                                                    tempRoom.push(room);
                                                }


                                            }
                                        }

                                        for (let t of tempRoom) {
                                            let key: string = Object.keys(t)[0];
                                            let properties: any = t[key];
                                            let shortName: string = key.split("-")[0];
                                            let number: string = key.split("-")[1];
                                            properties["rooms_number"] = number;
                                            properties["rooms_name"] = shortName + "_" + number;
                                            properties["rooms_shortname"] = shortName;
                                            properties["rooms_fullname"] = temp[shortName]["fullname"];
                                            properties["rooms_address"] = temp[shortName]["address"];
                                            properties["rooms_lat"] = temp[shortName]["lat"];
                                            properties["rooms_lon"] = temp[shortName]["lon"];
                                            processedDataset.push(t);
                                        }

                                        if (processedDataset.length == 0||
                                            Object.keys(processedDataset).length == 0 ||
                                            typeof processedDataset == "undefined") { // check the array
                                            reject(400);
                                        }

                                        else {
                                            fs.stat("data/"  + id + ".json", function (err, stat) { // check if the file already there
                                                if (err == null) {
                                                    console.log('File exists');
                                                    that.save(id, processedDataset);
                                                    fulfill(201);

                                                } else if (err.code == 'ENOENT') {
                                                    // file does not exist
                                                    that.save(id, processedDataset);
                                                    fulfill(204);
                                                } else {
                                                    console.log('Some other error: ', err.code);
                                                    reject(err);
                                                }
                                            });
                                        }

                                    } catch(err){
                                        reject(err);
                                    }

                                });

                            } catch (err) {
                                reject(err);
                            }
                        });

                    });

                }).catch(function (err) {
                    Log.trace('HTMLParser::process(..) - unzip ERROR: ' + err.message);
                    reject(err);
                });
            } catch (err) {
                Log.trace('HTMLParser::process(..) - ERROR: ' + err);
                reject(err);
            }
        });
    }

    private httpFunction(address: string): Promise<any> {
        return new Promise(function (fulfill, reject) {
            http.get(address, (res) => {
                const statusCode = res.statusCode;
                const contentType = res.headers['content-type'];
                let error: any;
                if (statusCode !== 200) {
                    error = new Error(`Request Failed.\n` +
                        `Status Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error(`Invalid content-type.\n` +
                        `Expected application/json but received ${contentType}`);
                }
                if (error) {
                    console.log(error.message);
                    // consume response data to free up memory
                    res.resume();
                    return;
                }

                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk: any) => rawData += chunk);
                res.on('end', () => {
                    try {
                        let parsedData = JSON.parse(rawData);
                        fulfill(parsedData);
                    } catch (e) {
                        console.log(e.message);
                    }
                });
            })
        })
    }

    private getBuildingPath(document:any){

        let buildingPath:any = [];

        let tbodyFragment= parse5.parseFragment(document);
        function findIndexNode(node: ASTNode) {//modified from piazza

            //Log.trace(node.nodeName);

            if (node.attrs) {
                node.attrs.forEach(function (value: parse5.ASTAttribute) {


                    if(value.name=="href"&&buildingPath.indexOf(value.value)==-1){
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

    }

    private getShortNameAndAdress(document:any):any[] {

        let processedArray: any = [];

        let messyArray: any = [];
        for (let d of parse5.treeAdapters.default.getChildNodes(document)) {

            for (let i of parse5.treeAdapters.default.getChildNodes(d)) {

                for (let e of parse5.treeAdapters.default.getChildNodes(i)) {
                    messyArray.push(e.value);
                }
            }

            //console.log(messyArray);

            let stringArray: any = [];
            for (let h of messyArray) {
                if (typeof h === "string") {
                    stringArray.push(h);
                }
            }

            //console.log(stringArray);

            let trimArray: any = [];
            for (let r of stringArray) {
                trimArray.push(r.trim());
            }

            //console.log(trimArray);


            for (let w of trimArray) {
                if (w != "") {
                    processedArray.push(w);
                }
            }

            // console.log(processedArray);
            break;
        }

        return processedArray;


    }

    private getBuildingOnlyArray(processedArray:any):any[] {

        let BuildingOnlyArray:any = [];
        for (let index in processedArray){
            if(<any>index%2 == 0){
                BuildingOnlyArray.push(processedArray[index]);
            }
        }

        return BuildingOnlyArray;
    }

    private getBuildingFullName(document:any):any[] {

        let buildingFullNameArray:any = [];

        for (let first_degree of parse5.treeAdapters.default.getChildNodes(document)){
            //console.log(temp);

            for (let second_degree of parse5.treeAdapters.default.getChildNodes(first_degree)){
                //console.log(i)

                let count = 0;
                let previous = 0;
                for (let targetedNodes of parse5.treeAdapters.default.getChildNodes(second_degree)){

                    if (count == 3 || count - previous == 6){
                        previous = count;
                        let node = parse5.treeAdapters.default.getFirstChild(targetedNodes);
                        let nodeValue = node.value;
                        //console.log(temp2);
                        buildingFullNameArray.push(nodeValue);

                    }


                    count = count + 1;

                }

                //console.log(buildingFullNameArray);
            }


        }

        return buildingFullNameArray;


    }

    private getRoomsDetails(tbody:any):any[]{

        let roomsDetails: any = [];
        let hrefArray:any = [];

        let tbodyFragment = parse5.parseFragment(tbody);


        if (tbodyFragment.childNodes[0].nodeName == "tbody"){
            tbodyFragment.childNodes[0].childNodes.forEach(function (tr) {

                if (tr.nodeName == "tr") {
                    let key:string = null;
                    let roomsObject:any = {
                        rooms_seats:null,
                        rooms_type:null,
                        rooms_furniture:null,
                        rooms_href:null

                    };

                    tr.childNodes.forEach(function (td) {
                        if (td.nodeName == "td"){

                            if (td.attrs){

                                for (let tdatt of td.attrs){

                                    let temp:any = null;
                                    if (tdatt.value == "views-field views-field-field-room-capacity"){
                                        roomsObject["rooms_seats"] = Number(td.childNodes[0].value.trim());
                                        temp = roomsObject["rooms_seats"];
                                        //console.log(temp);
                                    }


                                    if (tdatt.value == "views-field views-field-field-room-furniture") {
                                        roomsObject["rooms_furniture"] = td.childNodes[0].value.trim();
                                        temp = roomsObject["rooms_furniture"];
                                        //console.log(temp);
                                    }

                                    if(tdatt.value == "views-field views-field-field-room-type") {
                                        roomsObject["rooms_type"] = td.childNodes[0].value.trim();
                                        temp = roomsObject["rooms_type"];
                                        //console.log(temp);
                                    }

                                }

                            }

                            td.childNodes.forEach(function (tdchild) {

                                if (tdchild.attrs){

                                    if (tdchild.attrs[0].name == "href" && hrefArray.indexOf(tdchild.attrs[0].value) == -1){
                                        roomsObject["rooms_href"] = tdchild.attrs[0].value.toString();
                                        hrefArray.push(tdchild.attrs[0].value);
                                        var lastSlash = tdchild.attrs[0].value.lastIndexOf("/");
                                        key = tdchild.attrs[0].value.substr(lastSlash + 1);

                                    }

                                }

                            });

                        }

                    });
                    //console.log(roomsObject);
                    let processedafile: any = {};
                    processedafile[key] = roomsObject;
                    //console.log(processedafile[key]);
                    roomsDetails.push(processedafile);
                    //console.log(roomsDetails);

                }

            });
        }
        //console.log(roomsDetails);
        return roomsDetails;
    }

    public JSONParser(id: string, data:any):Promise<number> {
        Log.trace('JSONParser::process( ' + id + '... )');


        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let myZip = new JSZip();
                myZip.loadAsync(data, {base64: true}).then(function (zip: JSZip) {
                    Log.trace('JSONParser::process(..) - unzipped');

                    let processedDataset: any = [];

                    let prmoises:Promise<any>[] = [];


                    zip.folder("courses").forEach(function (relativePath: string, file: JSZipObject) {

                        let tempValue = file.async("string"); // reading the file as string
                        prmoises.push(tempValue);

                    });

                    Promise.all(prmoises).then(function (results: any[]) {
                        try {

                            results.forEach(function (filestr) {

                                let afile = JSON.parse(filestr);

                                if (afile["result"]) {

                                    for (let a of afile["result"]) {

                                        let course_name = a["Subject"] + a["Course"];

                                        let course_year:any;
                                        if (a["Section"] == "overall")//If the "Section":"overall" property is set, the year should be 1900
                                            course_year = 1900; //should be a number or string?
                                        else
                                            course_year = a["Year"];

                                        // main data structure
                                        let courseObject: Object = {
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

                                        let processedafile: any = {};
                                        processedafile[course_name] = courseObject;

                                        processedDataset.push(processedafile);

                                    }

                                }
                            });
                        }catch(err){
                            reject(err);
                        }


                        // below is for testing if the method can reject invalid zip
                        // var zipContent = 'UEsDBAoAAAAIAAEiJEm/nBg/EQAAAA8AAAALAAAAY29udGVudC5vYmqrVspOrVSyUipLzClNVaoFAFBLAQIUAAoAAAAIAAEiJEm/nBg/EQAAAA8AAAALAAAAAAAAAAAAAAAAAAAAAABjb250ZW50Lm9ialBLBQYAAAAAAQABADkAAAA6AAAAAAA=';
                        // var buf = new Buffer(zipContent, 'base64');
                        // var fs = require("fs");
                        // fs.writeFileSync('test.zip',buf);

                        if (processedDataset.length == 0||
                            Object.keys(processedDataset).length == 0 ||
                            typeof processedDataset == "undefined") { // check the array
                            //fulfill(400);
                            reject(400);
                        }

                        else {
                            fs.stat("data/"  + id + ".json", function (err, stat) { // check if the file already there
                                if (err == null) {
                                    console.log('File exists');
                                    that.save(id, processedDataset);
                                    fulfill(201);

                                } else if (err.code == 'ENOENT') {
                                    // file does not exist
                                    that.save(id, processedDataset);
                                    fulfill(204);
                                } else {
                                    console.log('Some other error: ', err.code);
                                    reject(err);
                                }
                            });
                        }

                    });


                }).catch(function (err) {
                    Log.trace('JSONParser::process(..) - unzip ERROR: ' + err.message);
                    reject(err);
                });
            } catch (err) {
                Log.trace('JSONParser::process(..) - ERROR: ' + err);
                reject(err);

            }
        });
    }

    /**
     * Writes the processed dataset to disk as 'id.json'. The function should overwrite
     * any existing dataset with the same name.
     *
     * @param id
     * @param processedDataset
     */
    private save(id: string, processedDataset: any) {
        // add it to the memory model
        this.datasets[id] = processedDataset;

        fs.stat("data/", function (err, stat) { // check if the file it already there
            if (err == null) {
                console.log('Folder exists');
                let path = "data/" + id + ".json";
                fs.writeFile(path, JSON.stringify(processedDataset));

            } else if (err.code == 'ENOENT') {
                fs.mkdir("data");
                let path = "data/" + id + ".json";
                fs.writeFile(path, JSON.stringify(processedDataset));
            }
        });


        // TODO: actually write to disk in the ./data directory


    }

    public deleteDatasets(id:string):Promise<number> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                fs.stat("data/" + id + ".json", function (err, stat) { // check if the file it already there
                    if (err == null) {
                        console.log('File exists');
                        fs.unlinkSync("data/"  + id + ".json");
                        // fs.unlink("data/"  + id + ".json");

                        that.datasets = {};


                        fulfill(204);

                    } else if (err.code == 'ENOENT') {
                        // file does not exist
                        //reject(404);
                        fulfill(404);
                    } else {
                        console.log("some other error", err.code);
                        reject(err);
                    }
                });


            }

            catch (err){
                Log.trace('DatasetController::delete(..) - ERROR: ' + err);
                reject(err);
            }


        });

    }

}
