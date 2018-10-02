

/*
 * This should be in the same namespace as your controllers
 */
import {QueryRequest, default as QueryController} from "./QueryController";
import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import {Datasets} from "./DatasetController";
import HistoryController from "./HistoryController";
import {SchedulerRequest, default as SchedulerController} from "./SchedulerController";


export default class InsightFacade implements IInsightFacade {

    private static datasetController = new DatasetController();

    /**
     * Add a dataset to UBCInsight.
     *
     * @param id  The id of the dataset being added. This is the same as the PUT id.
     * @param content  The base64 content of the dataset. This is the same as the PUT body.
     *
     * The promise should return an InsightResponse for both fullfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    public addDataset(id: string, content: string): Promise<InsightResponse>{
        Log.trace("InsightController::postDataset(..) - params: " + id);

        let that = this;
        return new Promise(function (fulfill, reject) {
            try{
                let controller = InsightFacade.datasetController;
        
                  controller.process(id, content).then(function (result) {
                    Log.trace('InsightController::postDataset(..) - processed');
                    fulfill({code: result, body: {success: result}});
                }).catch(function (err:Error){
                    Log.trace('InsightController::postDataset(..) - ERROR: ' + err.message);
                    reject({code: 400, body: {err: err.message}});

                });
//                 controller.process(id, content).then(function (result) {
//                     Log.trace('InsightController::postDataset(..) - processed');
//                     fulfill({code: result, body: {success: result}});
//                 }).catch(function (result) {
//                     Log.trace('InsightController::postDataset(..) - ERROR: ' + result.message);
//                     reject({code: 400, body: {err: result.message}});

//                 });

            }catch (err){
                Log.error("InsightController::postDataset(..) - ERROR: " + err);
                reject(err);
            }


        });

    }

    /**
     * Remove a dataset from UBCInsight.
     *
     * @param id  The id of the dataset to remove. This is the same as the DELETE id.
     *
     * The promise should return an InsightResponse for both fullfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    public removeDataset(id: string): Promise<InsightResponse>{
        Log.trace("InsightController::deleteDatasets(..) - params: " + id);
        let that = this;
        return new Promise(function (fulfill, reject) {
            try{
                let controller = InsightFacade.datasetController;

                if (controller.getDatasets()){
                    controller.deleteDatasets(id).then(function(result){
                        Log.trace("InsightController::deleteDatasets(..) - processed");
                        fulfill({code: result, body:{success: result}});

                    }).catch(function(err:Error){
                        reject({code: err, body: {err:err.message}});
                    });
                } else {
                    fulfill({code: 404, body: {err: "No such a file " + id}});
                }
            }catch (err) {
                Log.error("InsightController::deleteDatasets(..) - ERROR: " + err);
                reject(err);
            }

        });

    }

    /**
     * Perform a query on UBCInsight.
     *
     * @param query  The query to be performed. This is the same as the body of the POST message.
     * @return Promise <InsightResponse>
     * The promise should return an InsightResponse for both fullfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    public performQuery(query: QueryRequest): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let datasets: Datasets = InsightFacade.datasetController.getDatasets();
                let controller = new QueryController(datasets);

                let isValid = controller.isValid(query);

                if (isValid) {

                    if (controller.needID(query).length > 0) {
                        fulfill({code: 424, body: {missing: controller.needID(query)}});
                    } else {
                        fulfill({code: 200, body: controller.query(query)});

                    }
                } else {
                    fulfill({code: 400, body: {error: 'invalid query'}});
                }
            } catch (err) {
                Log.error('InsightController::performQuery(..) - ERROR: ' + err);
                reject(err);
            }
        });
    }

    public performHistory(id: string): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let datasets: Datasets = InsightFacade.datasetController.getDatasets();
                let controller = new HistoryController();

                Log.trace("InsightController::performHistory(..) -  printing ID");
                //console.log(id);

                let result = controller.getHistory(id);
                console.log(result);

                if (result == null){
                    fulfill({code: 400, body: "No history"});
                }else {
                    fulfill({code: 200, body: result});
                }


            } catch (err) {
                Log.error('InsightController::performHistory(..) - ERROR: ' + err);
                reject(err);
            }
        });
    }


    public performSchedule(scheduler: SchedulerRequest): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let controller = new SchedulerController();

                Log.trace("InsightController::scheduling(..)");
                let result = controller.scheduling(scheduler);
                Log.trace("done");


                if (result == null){
                    fulfill({code: 400, body: "No history"});
                }else {
                    fulfill({code: 200, body: result});
                }



            } catch (err) {
                Log.error('InsightController::scheduling(..) - ERROR: ' + err);
                reject(err);
            }
        });
    }

}
