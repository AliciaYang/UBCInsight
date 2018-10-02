export interface SchedulerRequest {
    COURSE: any
    ROOM: any
}

export interface SchedulerResponse {
}

export default class SchedulerController {

    public scheduling(scheduler: SchedulerRequest): SchedulerResponse {

        var result: any = [];
        var notScheduled: any = [];

        let coursesList: any = scheduler["COURSE"];
        let roomList: any = scheduler["ROOM"];
        console.log(coursesList.length);
        console.log(roomList.length);

        for (var c in coursesList) {
            var section = coursesList[c]["numSections"];
            while (section > 0) {
                for (var r in roomList) {
                    if (roomList[r]["rooms_seats"] >= coursesList[c]["maxSize"]) {
                        if (roomList[r]["timeslot"] < 15) {
                            let e: any = {};
                            e["Department"] = coursesList[c]["courses_dept"];
                            e["CourseNumber"] = coursesList[c]["courses_id"];
                            e["Size"] = coursesList[c]["maxSize"];
                            e["TotalSection"] = coursesList[c]["numSections"];
                            e["Section"] = coursesList[c]["numSections"] - section + 1;
                            e["Room"] = roomList[r]["rooms_name"];
                            e["Seats"] = roomList[r]["rooms_seats"];
                            e["Time"] = roomList[r]["timeslot"] + 1;
                            result.push(e);
                            roomList[r]["timeslot"]++;
                            break;
                        }
                    }
                    if (Number(r) == roomList.length - 1) {
                        let n: any = {};
                        n["Department"] = coursesList[c]["courses_dept"];
                        n["CourseNumber"] = coursesList[c]["courses_id"];
                        n["Section"] = coursesList[c]["numSections"] - section + 1;
                        notScheduled.push(n);
                    }
                }
                section--;
            }
        }

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

        let quality: any = [];
        let q: any = {};
        q["Total"] = coursesList.length;
        q["UnScheduled"] = notScheduled.length;
        q["Scheduled"] = result.length;
        quality.push(q);

        console.log(result.length);
        console.log(notScheduled.length);

        return {render: "TABLE", result: result, not: notScheduled, quality: quality};

    }
}