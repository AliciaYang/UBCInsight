// /**
//  * Created by rtholmes on 2016-09-03.
//  */
//
// import DatasetController from "../src/controller/DatasetController";
// import Log from "../src/Util";
// import parse5 = require('parse5');
// import JSZip = require('jszip');
// import fs = require('fs');
// import {expect} from 'chai';
//
// describe("DatasetController", function () {
//
//     var zipFileContents: string = null;
//     var controller: DatasetController = null;
//     before(function () {
//         Log.info('InsightController::before() - start');
//         // this zip might be in a different spot for you
//         zipFileContents = new Buffer(fs.readFileSync('310rooms.1.1.zip')).toString('base64');
//         try {
//             // what you delete here is going to depend on your impl, just make sure
//             // all of your temporary files and directories are deleted
//             fs.unlinkSync('./id.json');
//         } catch (err) {
//             // silently fail, but don't crash; this is fine
//             Log.warn('InsightController::before() - id.json not removed (probably not present)');
//         }
//         Log.info('InsightController::before() - done');
//     });
//
//     beforeEach(function () {
//         controller = new DatasetController();
//     });
//
//
//     it("Should be able to reject an invalid Dataset", function () {
//         Log.test('Creating dataset');
//         let content = {key: 'value'};
//         let zip = new JSZip();
//         zip.file('content.obj', JSON.stringify(content));
//         const opts = {
//             compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
//         };
//
//         return zip.generateAsync(opts).then(function (data) {
//             Log.test('Dataset created');
//             let controller = new DatasetController();
//             return controller.process('setA', data);
//         }).then(function (result) {
//             Log.test('Dataset processed; result: ' + result);
//             expect(result).to.equal(400); // zip file was invalid, should not have passed
//         });
//
//     });
//
//     it("Should be able to add an valid Dataset", function () {
//         let controller = new DatasetController();
//         controller.deleteDatasets("courses");
//         var zipFileContents: string = null;
//         zipFileContents = new Buffer(fs.readFileSync('310courses.1.0.zip')).toString('base64');
//
//
//         return controller.process("courses", zipFileContents).then(function (result) {
//             Log.test('Dataset processed; result: ' + result);
//             expect(result).to.equal(204); // zip file was invalid, should not have passed
//         });
//
//     });
//
//     it("Should not be able to set an empty zip Dataset", function () {
//         let controller = new DatasetController();
//         var zipFileContents: string = null;
//         zipFileContents = new Buffer(fs.readFileSync('a.zip')).toString('base64');
//
//
//         return controller.process("a", zipFileContents).then(function (result) {
//             Log.test('Dataset processed; result: ' + result);
//             expect(result).to.equal(400);
//
//         });
//
//     });
//
//     it("Should be able to get Dataset", function () {
//         Log.test('Getting dataset');
//
//         let controller = new DatasetController();
//         let result = controller.getDatasets();
//         Log.trace(JSON.stringify(result));
//         //let data = fs.readFileSync("data/", "utf8");
//
//         Log.test('Dataset got; result: ' + result);
//         return expect(result).to.not.equal(null);
//     });
//
//     it("Should be able to get Dataset[id]", function () {
//         Log.test('Getting dataset[id]');
//
//
//         let controller = new DatasetController();
//         let id = "courses"; // first scenario : id exists
//         let result = controller.getDataset(id);
//         //Log.trace(result.toString());
//
//         //let data = fs.readFileSync("data/" + id + ".json", "utf8");
//
//         Log.test('Dataset[id] got; result: ' + result);
//         return expect(result).to.not.equal(null);
//
//
//     });
//
//     it("Should not be able to get Dataset[id]", function () {
//         Log.test('Getting dataset[id]');
//
//         let controller = new DatasetController();
//         let id = "a"; // Second scenario : id doesn't exists
//         let result = controller.getDataset(id);
//         //let data = fs.readFileSync("data/" + id + ".json", "utf8");
//
//         Log.test('Dataset[id] got; result: ' + result);
//         return expect(result).to.equal(undefined);
//
//     });
//
//
//     it("Should be able to delete Dataset", function () {
//         Log.test('Deleting dataset');
//
//         let controller = new DatasetController();
//         let id = "courses"; // first case: id.json exists
//         let result = controller.deleteDatasets(id);
//         result.then(function (myresult:any) {
//             Log.test('Dataset deleted; result: ' + myresult);
//             return expect(myresult).to.equal(204);
//         });
//
//     });
//
//     it("Should not be able to delete Dataset", function () {
//         Log.test('Deleting dataset');
//
//         let controller = new DatasetController();
//         let id = "a"; // second case: id.json doesn't exist
//         let result = controller.deleteDatasets(id);
//         result.then(function(myresult:any){
//             Log.test('Dataset deleted; result: ' + myresult);
//             return expect(myresult).to.equal(undefined);
//         });
//
//     });
//
//     it("Should be able to add a new rooms dataset (204)", function () {
//         var that = this;
//         Log.trace("Starting test: " + that.test.title);
//
//         return controller.process('rooms', zipFileContents).then(function (result) {
//             expect(result).to.equal(204);
//         }).catch(function (result) {
//             expect.fail();
//         });
//
//
//     });
//
//     it("Should be able to update a existing rooms dataset (201)", function () {
//         var that = this;
//         Log.trace("Starting test: " + that.test.title);
//
//         return controller.process('rooms', zipFileContents).then(function (result) {
//             expect(result).to.equal(201);
//         }).catch(function (result) {
//             expect.fail();
//         });
//
//
//     });
//
//     it("Should not be able to process invaild HTML", function () {
//         var that = this;
//         Log.trace("Starting test: " + that.test.title);
//
//         return controller.HTMLParser("rooms", "some randon bytes").then(function (result) {
//             expect.fail()
//         }).catch(function (err) {
//             expect(err).to.throw;
//         })
//
//
//     });
//
//     it("Should be able to delete an existing dataset (204)", function () {
//         var that = this;
//         Log.trace("Starting test: " + that.test.title);
//
//         return controller.deleteDatasets('rooms').then(function (result) {
//             expect(result).to.equal(204);
//         }).catch(function (result) {
//             expect.fail();
//         });
//     });
//
//
// });