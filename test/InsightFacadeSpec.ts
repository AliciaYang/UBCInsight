import fs = require('fs');
import Log from "../src/Util";
import {expect} from 'chai';
import {InsightResponse} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import {QueryRequest} from "../src/controller/QueryController";




describe("InsightFacade", function () {
    this.timeout(1000000);

    var zipFileContents: string = null;
    var zipFileRooms: string = null;
    var facade: InsightFacade = null;
    before(function () {
        Log.info('InsightController::before() - start');
        // this zip might be in a different spot for you
        zipFileContents = new Buffer(fs.readFileSync('310courses.1.0.zip')).toString('base64');
        zipFileRooms = new Buffer(fs.readFileSync('310rooms.1.1.zip')).toString('base64');
        try {
            // what you delete here is going to depend on your impl, just make sure
            // all of your temporary files and directories are deleted
            fs.unlinkSync('./id.json');
        } catch (err) {
            // silently fail, but don't crash; this is fine
            Log.warn('InsightController::before() - id.json not removed (probably not present)');
        }
        Log.info('InsightController::before() - done');
    });

    beforeEach(function () {
        facade = new InsightFacade();
    });



    it("Should be able to add a new dataset (204)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Rooms: Should be able to add a new dataset (204)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('rooms', zipFileRooms).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Should be able to update an existing dataset (201)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Rooms: Should be able to update an existing dataset (201)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('rooms', zipFileRooms).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Double not (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id"],
            "WHERE": {"NOT": {"NOT": {"IS": {"courses_dept": "cpsc"}}}} ,
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("Should not be able to add an invalid dataset (400)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('courses', 'some random bytes').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Rooms : Should not be able to add an invalid dataset (400)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('rooms', 'some random bytes').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("title:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_title"],
            "WHERE": {"IS": {"courses_title": "intr sftwr eng"}},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("Wild :Should be able to perform query", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_instructor"],
            "WHERE": {
                "OR": [
                    {"AND": [
                        {"GT": {"courses_avg": 70}},
                        {"IS": {"courses_dept": "cp*"}},
                        {"NOT": {"IS": {"courses_instructor": "murphy, gail"}}}
                    ]},
                    {"IS": {"courses_instructor": "*gregor*"}}
                ]
            },
            "ORDER": { "dir": "UP", "keys": ["courses_dept"]},
            "AS": "TABLE"
        };

        var file = fs.readFileSync("./q3.json",  "utf8");
        let dataset: any = JSON.parse(file);

        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response:any) {
            // var odiff = require('odiff');
            // var temp = odiff(JSON.stringify(dataset), JSON.stringify(response.body));
            // Log.trace(temp);
            //fs.writeFileSync("test.json", response.body);
            expect(response.body).to.deep.equal(dataset);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });



    it("Sorting by title: Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_title", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_title" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courses_title","courseAverage" ]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("Sorting by dept: Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courseAverage"],
            "WHERE": {"AND":[{"IS": {"courses_dept": "cpsc"}}, {"IS": {"courses_id": "221"}}]} ,
            "ORDER": "courses_dept",
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("Sorting by instructor: Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_instructor", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "101"}} ,
            "GROUP": [ "courses_instructor" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courses_instructor","courseAverage" ]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("Complex: Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest ={
            "GET": ["courses_dept", "courses_id", "maxAduit","minFail","maxTought","mostSection","avgPass"],
            "WHERE": {
                "OR":[
                    {"AND":[{"IS": {"courses_dept": "cpsc"}}, {"IS": {"courses_id": "410"}}]},
                    {"AND":[{"IS": {"courses_dept": "cpsc"}}, {"IS": {"courses_id": "221"}}]}
                ]
            },
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"maxAduit": {"MAX": "courses_audit"}} ,{"minFail": {"MIN": "courses_fail"}},{"avgPass": {"AVG": "courses_pass"}},{"mostSection": {"COUNT": "courses_uuid"}},{"maxTought": {"COUNT": "courses_instructor"}}],
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("Complex2: Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest ={
            "GET": ["courses_dept", "courses_id", "maxAduit","minFail","maxTought","mostSection","avgPass"],
            "WHERE": {
                "OR":[
                    {"AND":[{"IS": {"courses_dept": "c*"}}, {"IS": {"courses_id": "4*"}}]},
                    {"AND":[{"IS": {"courses_dept": "c*"}}, {"IS": {"courses_id": "5*"}}]}
                ]
            },
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"maxAduit": {"MAX": "courses_audit"}} ,{"minFail": {"MIN": "courses_fail"}},{"avgPass": {"AVG": "courses_pass"}},{"mostSection": {"COUNT": "courses_uuid"}},{"maxTought": {"COUNT": "courses_instructor"}}],
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });


    it("GROUP APPLY same key :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_id"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("GROUP APPLY both [] :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [],
            "APPLY": [],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });


    it("Deep: Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        var file = fs.readFileSync("./sample.json",  "utf8");
        let dataset: Object = JSON.parse(file);

        return facade.performQuery(query).then(function (response: InsightResponse) {
            //Log.trace(JSON.stringify(dataset));
            //Log.trace(JSON.stringify(response.body));
            expect(response.body).to.deep.equal(dataset);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("Deep2: Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        var file = fs.readFileSync("./sample2.json",  "utf8");
        let dataset: Object = JSON.parse(file);

        return facade.performQuery(query).then(function (response: InsightResponse) {
            //Log.trace(JSON.stringify(dataset));
            //Log.trace(JSON.stringify(response.body));
            expect(response.body).to.deep.equal(dataset);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("Deep3: Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "numSections"],
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"numSections": {"COUNT": "courses_uuid"}} ],
            "ORDER": { "dir": "UP", "keys": ["numSections", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        var file = fs.readFileSync("./sample3.json",  "utf8");
        let dataset: Object = JSON.parse(file);

        return facade.performQuery(query).then(function (response: InsightResponse) {
            //Log.trace(JSON.stringify(dataset));
            //Log.trace(JSON.stringify(response.body));
            expect(response.body).to.deep.equal(dataset);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    // case 1 : WHERE has courses1_dept
    it("WHERE has courses1_dept:Should not be able to perform query (424)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses1_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });
    //
    it("WHERE :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    // // case 2: GET has courses1_id
    it("GET has courses1_id:Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses1_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {

            expect(response).to.equal(undefined);
        })
    });

    // case 3: GROUP has courses1_id
    it("GROUP has courses1_id:Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses1_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    //case 4: APPLY has courses1_avg
    it("APPLY has courses1_avg:Should not be able to perform query (424)", function () {
        var that = this;
        let query: QueryRequest =  {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses1_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        }).catch(function (response: InsightResponse) {
            expect.fail();

        })
    });

    // case 5: ORDER has courses1_id
    it("ORDER has courses1_id:Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses1_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    // case 6: Everywhere has courses1
    it("Everywhere has courses1:Should not be able to perform query (424)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses1_id", "courseAverage"],
            "WHERE": {"IS": {"courses1_dept": "cpsc"}} ,
            "GROUP": [ "courses1_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses1_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses1_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {

            expect(response).to.equal(undefined);
        })
    });

    // case 7 : Invalid GET and APPLY don't match
    it("Invalid GET and APPLY don't match :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseaAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    // case 8: GET and GROUP match but missing
    it("GET, GROUP, ORDER match but missing :Should not be able to perform query (424)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses1_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses1_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses1_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {

            expect(response).to.equal(undefined);

        })
    });

    //case 9: GET and APPLY match but missing
    it("GET, APPLY, ORDER match :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseaAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseaAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseaAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    // case 10: GET, APPLY, ORDER, GROUP match but missing
    it("GET, APPLY, ORDER, GROUP match but missing :Should not be able to perform query (424)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses1_id", "courseaAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses1_id" ],
            "APPLY": [ {"courseaAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseaAverage", "courses1_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {

            expect(response).to.equal(undefined);

        })
    });


    it("GET has courses_ :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("WHERE has courses_ :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });
    // case 13
    it("APPLY has courses_ :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();

        })
    });

    it("APPLY :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id"],
            "APPLY":[],
            "ORDER": { "dir": "UP", "keys": ["courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail()

        })
    });


    it("GROUP has courses_ :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });


    it("ORDER has courses_ :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("ORDER missing :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });


    it("{}:Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = JSON.parse(JSON.stringify({}));

        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("Where is {} :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("dir:DOWN : Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "DOWN", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("MAX : Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"MAX": "courses_avg"}} ],
            "ORDER": { "dir": "Down", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("MIN : Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"MIN": "courses_avg"}} ],
            "ORDER": { "dir": "Down", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });
//
    it("COUNT : Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"COUNT": "courses_avg"}} ],
            "ORDER": { "dir": "Down", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });
//
    it("All empty string :should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["", ""],
            "WHERE": {} ,
            "GROUP": [ "" ],
            "APPLY": [ {"": {"": ""}} ],
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response).to.equal(undefined);

        })
    });

//     // GT
    it("GT 50:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"GT" : {"courses_avg" : 50}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("GT 100:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"GT" : {"courses_avg" : 100}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("GT 0:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"GT" : {"courses_avg" : 0}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });
//
    it("GT 60.0:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"GT" : {"courses_avg" : 60.0}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    // LT
    it("LT 0:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"LT" : {"courses_avg" : 0}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("LT 50:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"LT" : {"courses_avg" : 50}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("LT 100:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"LT" : {"courses_avg" : 100}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });
//
    it("LT 60.0:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"LT" : {"courses_avg" : 60.0}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });


    // EQ
    it("EQ 50:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"EQ" : {"courses_avg" : 50}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("EQ 100:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"EQ" : {"courses_avg" : 100}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("EQ 0:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"EQ" : {"courses_avg" : 0}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("EQ double:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE" : {"EQ" : {"courses_avg" : 80.0}},
            "ORDER" : "courses_avg",
            "AS" : "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    // AND
    it("AND :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "AND": [
                    {"IS": {"courses_dept": "cpsc"}},
                    {"IS": {"courses_id": "310"}}
                ]
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

//     //OR
    it("OR :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "OR": [
                    {"IS": {"courses_dept": "cpsc"}},
                    {"LT": {"courses_avg": 60}}
                ]
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

//     // NOT
    it("NOT :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "NOT": {
                    "IS": {"courses_dept": "cpsc"},
                    "GT": {"courses_avg": 60}
                }
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("NOT :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "NOT": {
                    "IS": {"courses_id": 327},
                    "GT": {"courses_avg": 60}
                }
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });
//
//     // testing keys and input
//     // courses_instructor
    it("courses_instructor :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_instructor"],
            "WHERE": {
                "IS": {"courses_dept": "cpsc", "courses_instructor":"smulders, dave"},

            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("courses_pass:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_pass"],
            "WHERE": {
                "AND":[
                    { "IS": {"courses_title": "adhe327"}},
                    { "NOT":{"courses_avg":90}}
                ]
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("courses_pass normal:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_title"],
            "WHERE": {
                "AND": [
                    { "IS": {"courses_instructor":"crisfield, erin"}},
                    { "GT":{"courses_pass":23}}
                ]
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });
//
    it("courses_fail + * :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_title"],
            "WHERE": {
                "AND": [
                    { "IS": {"courses_instructor":"*gregor*"}},
                    { "LT":{"courses_fail":0}}
                ]
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });

    it("one* :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_title"],
            "WHERE": {
                "AND": [
                    { "IS": {"courses_instructor":"gregor*"}},
                    { "LT":{"courses_fail":0}}
                ]
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });

    it("*one :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_title"],
            "WHERE": {
                "AND": [
                    { "IS": {"courses_instructor":"*gregor"}},
                    { "LT":{"courses_fail":0}}
                ]
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });

    it("OR + AND :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "OR": [
                    {"AND": [
                        {"GT": {"courses_avg": 70}},
                        {"IS": {"courses_dept": "adhe"}}
                    ]},
                    {"EQ": {"courses_avg": 90}}
                ]
            },
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });
//
    it("AND + OR:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "AND": [
                    {"OR": [
                        {"GT": {"courses_avg": 70}},
                        {"IS": {"courses_dept": "adhe"}}
                    ]},
                    {"EQ": {"courses_avg": 90}}
                ]
            },
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });
//
    it("NOT + AND:Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_uuid", "courses_avg"],
            "WHERE": {
                "NOT": [
                    {"AND": [
                        {"GT": {"courses_avg": 70}},
                        {"IS": {"courses_dept": "adhe"}}
                    ]},
                    {"EQ": {"courses_avg": 90}}
                ]
            },
            "ORDER": "courses_uuid",
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });

    it("NOT + NOT :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_uuid", "courses_avg"],
            "WHERE": {
                "NOT": {
                    "NOT":
                    {"IS": {"courses_dept": "adhe"}}

                }

            },
            "ORDER": "courses_uuid",
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("NOT + OR :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_uuid", "courses_avg"],
            "WHERE": {
                "NOT": [
                    {"OR": [
                        {"GT": {"courses_avg": 70}},
                        {"IS": {"courses_dept": "adhe"}}
                    ]},
                ]
            },
            "ORDER": "courses_uuid",
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("OR :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_title"],
            "WHERE": {
                "OR": [
                    { "IS": {"courses_instructor":"*gregor"}},
                    { "LT":{"courses_fail":0}}
                ]
            },
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });

    it("Rooms :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["rooms_address", "rooms_number"],
            "WHERE":
            { "IS": {"rooms_shortname":"DMP"}},
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        })
    });

    it("Rooms with address :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["rooms_address","rooms_shortname"],
            "WHERE":
            { "IS": {"rooms_address":"*Agronomy Road*"}},
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });

    // test added
    it("Null : Should not be able to add an invalid dataset (400)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('rooms', '').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    // test added
    it("Null : Should not be able to add an invalid dataset (400)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('courses', '').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    // test added
    it("APPLY no GROUP :Should not be able to perform query (400)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_instructor", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "101"}} ,
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courses_instructor","courseAverage" ]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    // test added
    it("GROUP no APPLY: Should not be able to perform query (400)", function() {
        var that = this;
        let query: QueryRequest = {
            "GET": ["courses_instructor", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "101"}} ,
            "GROUP": [ "courses_instructor" ],
            "ORDER": { "dir": "UP", "keys": ["courses_instructor","courseAverage" ]},
            "AS":"TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        })
    });

    it("APPLY with address :Should be able to perform query (200)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["rooms_number", "sameAddress"],
            "WHERE":{},
            "GROUP": ["rooms_number"],
            "APPLY": [{"sameAddress": {"COUNT": "rooms_address"}}],
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });



    it("Should be able to delete an existing dataset (204)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Should be able to delete an existing dataset (204)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.removeDataset('rooms').then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Should not be able to remove a dataset (404)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);

        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect(response.code).to.equal(404);

        }).catch(function (response: InsightResponse) {
            expect.fail();

        });
    });

    it("Should not be able to remove a dataset (404)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);

        return facade.removeDataset('rooms').then(function (response: InsightResponse) {
            expect(response.code).to.equal(404);

        }).catch(function (response: InsightResponse) {
            expect.fail();

        });
    });

    it("Rooms missing :Should not be able to perform query (424)", function () {
        var that = this;
        let query: QueryRequest = {
            "GET": ["rooms_address","rooms_shortname"],
            "WHERE":
            { "IS": {"rooms_address":"*Agronomy Road*"}},
            "AS": "TABLE"
        };
        Log.trace("Starting test: " + that.test.title);
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        }).catch(function (response: InsightResponse) {
            expect.fail(response.body);
        })
    });



});
