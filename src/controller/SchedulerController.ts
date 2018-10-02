import Log from "../Util";

export interface SchedulerRequest {
    COURSE:any[];
    ROOM:any[];


}

export interface SchedulerResponse {

}

export default class SchedulerController {

    public scheduling(scheduler: SchedulerRequest):SchedulerResponse {

        // console.log(scheduler);

        Log.trace("SchedulerController::scheduling(..)");


        let result: any = [];
        var notScheduled: any = [];

        let coursesList:any = scheduler["COURSE"];
        let roomList:any = scheduler["ROOM"];

        // Log.trace("Total number of course: ");
        //console.log(coursesList);
        // Log.trace("Total number of room: ");
        console.log(roomList.length);

        let totalSection = 0;
        for (let c of coursesList){
            totalSection+= c["numSections"];
        }

        for (let course of coursesList){

            let num = 0;

            let temp = course["numSections"];

            let secNum = course["numSections"];

            while(secNum > 0){

                for (let room of roomList){
                    if (room["rooms_seats"] >= course["maxSize"]){
                        if(room["timeslot"] < 15) {

                            let resultElem: any = {};

                            resultElem["Department"] = course["courses_dept"];
                            resultElem["CourseNumber"] = course["courses_id"];
                            resultElem["TotalSection"] = temp;
                            resultElem["Section"] = num + 1;
                            resultElem["Size"] = course["maxSize"];
                            resultElem["Room"] = room["rooms_name"];
                            resultElem["Seats"] = room["rooms_seats"];
                            resultElem["Time"] = room["timeslot"] + 1;


                            room["timeslot"] = room["timeslot"]+1;
                            course["numSections"] = course["numSections"]-1;

                            result.push(resultElem);

                            num = num+1;

                            break;
                        }

                    }
                }
                secNum = secNum-1;


            }

        }

        let unScheduledResult:any = [];
        let unScheduled = 0;
        for (let c of coursesList){
            if (c["numSections"] > 0){
                unScheduled +=c["numSections"];
                unScheduledResult.push(c);
            }
        }

        // for (var c in coursesList) {
        //     var section = coursesList[c]["numSections"];
        //     while (section > 0) {
        //         for (var r in roomList) {
        //             if (roomList[r]["rooms_seats"] >= coursesList[c]["maxSize"]) {
        //                 if (roomList[r]["timeslot"] < 15) {
        //                     let e: any = {};
        //                     e["Department"] = coursesList[c]["courses_dept"];
        //                     e["CourseNumber"] = coursesList[c]["courses_id"];
        //                     e["Section"] = coursesList[c]["numSections"] - section + 1;
        //                     e["Room"] = roomList[r]["rooms_name"];
        //                     e["Time"] = roomList[r]["timeslot"] + 1;
        //                     result.push(e);
        //                     roomList[r]["timeslot"]++;
        //                     break;
        //                 }
        //             }
        //             if (Number(r) == roomList.length - 1) {
        //                 let n: any = {};
        //                 n["Department"] = coursesList[c]["courses_dept"];
        //                 n["CourseNumber"] = coursesList[c]["courses_id"];
        //                 n["Section"] = coursesList[c]["numSections"] - section + 1;
        //                 notScheduled.push(n);
        //             }
        //         }
        //         section--;
        //     }
        // }
        Log.trace("SchedulerController::Total sections: ");
        console.log(totalSection);

        let scheduled = totalSection - unScheduled;
        Log.trace("SchedulerController::Scheduled sections: ");
        console.log(scheduled);

        Log.trace("SchedulerController::unScheduled sections: ");
        //console.log(notScheduled.length);
        console.log(unScheduled);

        let qualityResut:any =[];

        qualityResut.push({"total": totalSection, "success":scheduled, "unsuccess":unScheduled});



        for (let c of result){
            if (c["Time"] == 1){
                c["Time"] = "MWF8AM-9AM";
            }else if (c["Time"] == 2){
                c["Time"] = "MWF9AM-10AM";
            }else if (c["Time"] == 3){
                c["Time"] = "MWF10AM-11AM";
            }else if (c["Time"] == 4){
                c["Time"] = "MWF11AM-12PM";
            }else if (c["Time"] == 5){
                c["Time"] = "MWF12PM-1PM";
            }else if (c["Time"] == 6){
                c["Time"] = "MWF1PM-2PM";
            }else if (c["Time"] == 7){
                c["Time"] = "MWF2PM-3PM";
            }else if (c["Time"] == 8){
                c["Time"] = "MWF3PM-4PM";
            }else if (c["Time"] == 9){
                c["Time"] = "MWF4PM-5PM";
            }else if (c["Time"] == 10){
                c["Time"] = "T/Th8AM-9:30AM";
            }else if (c["Time"] == 11){
                c["Time"] = "T/Th9:30AM-11AM";
            }else if (c["Time"] == 12){
                c["Time"] = "T/Th11AM-12:30PM";
            }else if (c["Time"] == 13){
                c["Time"] = "T/Th12:30PM-2PM";
            }else if (c["Time"] == 14){
                c["Time"] = "T/Th2PM-3:30PM";
            }else if (c["Time"] == 15){
                c["Time"] = "T/Th3:30PM-5PM";
            }
        }

        Log.trace("SchedulerController::Schedule Table: ");
        console.log(result);

        return {render: "TABLE", result: result
            , unSchedule:unScheduledResult,quality:qualityResut};


    }

    // public getValues(obj: any, key: any): any {
    //     var objects = <any>[];
    //     var props = obj[Object.keys(obj)[0]];
    //     for (var i in props) {
    //         if (typeof obj[i] == 'object') {
    //             objects = objects.concat(this.getValues(obj[i], key));
    //         } else if (i == key) {
    //             objects.push(props[i]);
    //         }
    //     }
    //     return objects;
    // }
    //
    // private filterCourse(scheduler: SchedulerRequest):any{
    //
    //     let depArray:any = [];
    //     let courArray:any = [];
    //     let finalCourArray: any = [];
    //
    //     for (let k of Object.keys(scheduler["COURSE"])){
    //         if (k == "Department"){
    //             let depObj = scheduler["COURSE"]["Department"];
    //
    //             Log.trace("depObj");
    //             console.log(depObj);
    //
    //             if (depObj.indexOf(";") != -1){
    //
    //                 depArray = depObj.split(";");
    //                 Log.trace("depArray");
    //                 console.log(depArray);
    //
    //             }else{
    //
    //                 depArray.push(depObj);
    //                 Log.trace("depArray");
    //                 console.log(depArray);
    //             }
    //         }
    //
    //         if (k == "courseNumber"){
    //             let courObj = scheduler["COURSE"]["courseNumber"];
    //
    //             if (courObj.indexOf(";") != -1){
    //
    //                 courArray = courObj.split(";");
    //                 Log.trace("courArray");
    //                 console.log(courArray);
    //
    //             }else{
    //
    //                 courArray.push(courObj);
    //                 Log.trace("courArray");
    //                 console.log(courArray);
    //
    //             }
    //
    //         }
    //     }
    //
    //     if (courArray.length > 1) {
    //
    //         for (let dept in depArray) {
    //
    //             let tempArray: any = [];
    //             if (courArray[dept].indexOf(",") != -1) { // e.g. 110,121;221
    //                 tempArray = courArray[dept].split(",");
    //                 for (let number in tempArray) {
    //                     let courAndnum = depArray[dept] + tempArray[number];
    //                     finalCourArray.push(courAndnum);
    //                 }
    //
    //             }else{ //e.g. 110;121
    //                 let courAndnum = depArray[dept] + courArray[dept];
    //                 finalCourArray.push(courAndnum);
    //             }
    //
    //         }
    //     }else {
    //         let tempArray:any = [];
    //         if (courArray[0].indexOf(",") != -1){
    //             let tempArray = courArray[0].split(",");
    //
    //             for (let dept of depArray){
    //                 Log.trace("one dept: ");
    //                 for (let num of tempArray){
    //                     Log.trace("mapping to numbers: ");
    //                     let courAndnum = dept + num;
    //                     finalCourArray.push(courAndnum);
    //                 }
    //             }
    //
    //         }else {// e.g. 110 applies to all intput dept
    //
    //             for (let dept of depArray){
    //                 Log.trace("number has only one element");
    //                 let courAndnum = dept + courArray[0];
    //                 console.log(courAndnum);
    //                 finalCourArray.push(courAndnum);
    //             }
    //
    //         }
    //     }
    //
    //
    //     Log.trace("Array of dep + num: ");
    //     console.log(finalCourArray);
    //
    //     let targetArray:any = this.filterJSON(finalCourArray);
    //
    //     let finalCourse:any = this.parseTargetArray(targetArray);
    //
    //     Log.trace("This is the final course array: ");
    //     console.log(finalCourse);
    //
    //     return finalCourse;
    //
    // }
    //
    // private filterJSON(finalCourArray:any):any{
    //
    //     Log.trace("Starting JSON file: ");
    //     let courseDataset = SchedulerController.datasetController.getDataset("courses");
    //
    //     let finalTargets:any = [];
    //
    //     for (let userInput of finalCourArray) {
    //         Log.trace("Looping through userInput: ");
    //
    //         let targetCourses:any = []; // store sections
    //         let target:any = {}; // store (e.g. cpsc110:sections)
    //
    //         for (let oneCourse of courseDataset) {
    //             // Log.trace("Looping through courses.json: ");
    //
    //             for (let key of Object.keys(oneCourse)){
    //                 if (key == userInput){
    //                     oneCourse[userInput];
    //                     //console.log(oneCourse[userInput]);
    //                     if (oneCourse[userInput]["courses_year"] == '2014') {
    //                         Log.trace("Pushing targets to targetCourses: ");
    //                         targetCourses.push(oneCourse[userInput]);
    //                     }
    //                 }
    //             }
    //
    //         }
    //         Log.trace("Saving targets to target object: ");
    //         target[userInput] = targetCourses;
    //
    //         Log.trace("Pushing targets to final array: ");
    //         finalTargets.push(target);
    //     }
    //
    //     console.log(finalTargets);
    //
    //
    //
    //     return finalTargets;
    // }
    //
    // private parseTargetArray(targetArray:any):any{
    //
    //     let finalCourseData:any = [];
    //
    //
    //     for (let oneTarget of targetArray){
    //
    //         let newCourseData:any = {course:null,
    //             section:null,
    //             size:null};
    //
    //         for (let key of Object.keys(oneTarget)){
    //             newCourseData["course"] = key;  // key is e.g. cpsc110
    //
    //             if (oneTarget[key].length / 3 == 0){
    //
    //                 newCourseData["section"] = 1;
    //
    //             }else{
    //
    //                 newCourseData["section"] = Math.ceil(oneTarget[key].length / 3);
    //
    //             }
    //
    //             let courseSizeArray:any = []; //store sizes from courses for comparison
    //
    //             for (let oneSection of oneTarget[key]){
    //
    //                 courseSizeArray.push(oneSection["courses_size"]);
    //                 //Log.trace("Each course size saved");
    //
    //             }
    //
    //             //console.log(courseSizeArray);
    //
    //             let largestSize = Math.max.apply(null, courseSizeArray); // get the max
    //
    //             newCourseData["size"] = largestSize;
    //
    //         }
    //
    //         Log.trace("Saving each course object");
    //         finalCourseData.push(newCourseData);
    //     }
    //
    //     //console.log(finalCourseData);
    //
    //     return finalCourseData;
    //
    // }
    //
    // private filterRoom(scheduler: SchedulerRequest): any {
    //
    //     let tempRoom: any = [];
    //     let finalRoom: any = [];
    //     let buildingList: any = [];
    //     let distanceList: any = [];
    //     let roomData: any = SchedulerController.datasetController.getDataset("rooms");
    //
    //     if (scheduler.ROOM.BuildingName.indexOf(";") == -1) {
    //         buildingList.push(scheduler.ROOM.BuildingName);
    //     } else {
    //         buildingList = scheduler.ROOM.BuildingName.split(";");
    //     }
    //
    //     if (scheduler.ROOM.Distance != "") {
    //         if (scheduler.ROOM.Distance.indexOf(";") == -1) {
    //             distanceList.push(scheduler.ROOM.Distance);
    //         } else {
    //             distanceList = scheduler.ROOM.Distance.split(";");
    //         }
    //     }
    //
    //     if (distanceList.length != 0) {
    //         for (var distance of distanceList) {
    //             var param = distance[0];
    //             var inputdist = distance.split(param)[1].split("-")[0];
    //             var building = distance.split("-")[1];
    //
    //             for (var r of roomData) {
    //                 var sudodata = r[Object.keys(r)[0]];
    //                 if (sudodata["rooms_shortname"] == building) {
    //                     var lat0 = sudodata["rooms_lat"];
    //                     var lon0 = sudodata["rooms_lon"];
    //                     break;
    //                 }
    //             }
    //
    //             for (var data of roomData) {
    //                 if (this.getValues(data, "rooms_shortname") != building) {
    //                     var lat = this.getValues(data, "rooms_lat");
    //                     var lon = this.getValues(data, "rooms_lon");
    //                     var dist = this.distance(lat0, lon0, lat, lon);
    //
    //                     if (param == "<") {
    //                         if (dist <= inputdist) {
    //                             tempRoom.push(data);
    //                         }
    //                     } else if (param == ">") {
    //                         if (distance >= inputdist) {
    //                             tempRoom.push(data);
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //
    //     for (var subdata of roomData) {
    //         let key: string = Object.keys(subdata)[0];
    //         let properties: any = subdata[key];
    //         if (buildingList.indexOf(properties["rooms_shortname"]) != -1) {
    //             tempRoom.push(subdata);
    //         }
    //     }
    //
    //     for (var t of tempRoom) {
    //         let element: any = {room: "", seats: 0};
    //         element.room = t[Object.keys(t)[0]]["rooms_name"];
    //         element.seats = t[Object.keys(t)[0]]["rooms_seats"];
    //         finalRoom.push(element);
    //     }
    //
    //     // console.log(finalRoom);
    //
    //     return finalRoom;
    // }
    //
    // private distance(lat1: any, lon1: any, lat2: any, lon2: any) {
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
}