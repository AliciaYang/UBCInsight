/**
 * Created by rtholmes on 2016-10-31.
 */

// import {Datasets} from "JsonController.ts";
// import QueryController from "../src/controller/QueryController";
// import {QueryRequest} from "../src/controller/QueryController";
// import Log from "../src/Util";
// var fs = require('fs');
//
// import {expect} from 'chai';
// describe("QueryController", function () {
//
//     beforeEach(function () {
//     });
//
//     afterEach(function () {
//     });
//
//     it("Should be able to validate a valid query", function () {
//         // NOTE: this is not actually a valid query for D1
//         let query: QueryRequest = {
//             "GET": ["courses_dept", "courses_avg"],
//             "WHERE": {"GT": {"courses_avg": 90}},
//             "ORDER": "courses_avg",
//             "AS": "TABLE"
//         };
//         let dataset: Datasets = {};
//         let controller = new QueryController(dataset);
//         let isValid = controller.isValid(query);
//
//         expect(isValid).to.equal(true);
//     });
//
//     it("Should be able to invalidate an invalid query", function () {
//         let query: any = null;
//         let dataset: Datasets = {};
//         let controller = new QueryController(dataset);
//         let isValid = controller.isValid(query);
//
//         expect(isValid).to.equal(false);
//     });
//
//     it("Should be able to query, although the answer will be empty", function () {
//         // NOTE: this is not actually a valid query for D1, nor is the result correct.
//         let query: QueryRequest = {
//             "GET": ["courses_dept", "courses_avg"],
//             "WHERE": {"GT": {"courses_avg": 200}},
//             "ORDER": "courses_avg",
//             "AS": "TABLE"
//         };
//         let dataset: Datasets = {};
//         let controller = new QueryController(dataset);
//         let ret = controller.query(query);
//         Log.test('In: ' + JSON.stringify(query) + ', out: ' + JSON.stringify(ret));
//         expect(ret).not.to.be.equal(null);
//         // should check that the value is meaningful
//     });
//
//
//     it("Should be able to query, although the answer will be empty", function () {
//         // NOTE: this is not actually a valid query for D1, nor is the result correct.
//         let query: QueryRequest = {
//             "GET": ["courses_dept", "courses_id", "courses_instructor"],
//             "WHERE": {
//                 "OR": [
//                     {"AND": [
//                         {"GT": {"courses_avg": 70}},
//                         {"IS": {"courses_dept": "cp*"}},
//                         {"NOT": {"IS": {"courses_instructor": "murphy, gail"}}}
//                     ]},
//                     {"IS": {"courses_instructor": "*gregor*"}}
//                 ]
//             },
//             "AS": "TABLE"
//         };
//         var file = fs.readFileSync("./courses.json");
//         let dataset: Datasets = JSON.parse(file);
//         let controller = new QueryController(dataset);
//         let ret = controller.query(query);
//         Log.test('In: ' + JSON.stringify(query) + ', out: ' + JSON.stringify(ret));
//         expect(ret).not.to.be.equal(null);
//         // should check that the value is meaningful
//     });
// });
