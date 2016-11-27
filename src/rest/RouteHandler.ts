/**
 * Created by rtholmes on 2016-06-14.
 */
import restify = require('restify');
import fs = require('fs');

import DatasetController from '../controller/DatasetController';
import {Datasets} from '../controller/DatasetController';
import QueryController from '../controller/QueryController';

import {QueryRequest} from "../controller/QueryController";
import Log from '../Util';
import {InvalidArgumentError} from "restify";
import InsightFacade from "../controller/InsightFacade";
import {SchedulerRequest} from "../controller/SchedulerController";


export default class RouteHandler {

    private static datasetController = new DatasetController();
    private static myInsightFacade = new InsightFacade();

    public static getHomepage(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::getHomepage(..)');
        Log.trace(req.params.id);
        var page =  req.params.id || "index.html";
        fs.readFile('./src/rest/views/' + page, 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static  putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::postDataset(..) - params: ' + JSON.stringify(req.params));
        try {
            var id: string = req.params.id;

            // stream bytes from request into buffer and convert to base64
            // adapted from: https://github.com/restify/node-restify/issues/880#issuecomment-133485821
            let buffer: any = [];
            req.on('data', function onRequestData(chunk: any) {
                Log.trace('RouteHandler::postDataset(..) on data; chunk length: ' + chunk.length);
                buffer.push(chunk);
            });

            req.once('end', function () {
                let concated = Buffer.concat(buffer);
                req.body = concated.toString('base64');
                Log.trace('RouteHandler::postDataset(..) on end; total length: ' + req.body.length);

                let facade = RouteHandler.myInsightFacade;
                // let controller = RouteHandler.datasetController;
                facade.addDataset(id, req.body).then(function (result: any) {
                    Log.trace('RouteHandler::postDataset(..) - processed');
                    res.json(result.code, {success: result.body});
                }).catch(function (err: Error) {
                    Log.trace('RouteHandler::postDataset(..) - ERROR: ' + err.message);
                    res.json(400, {err: err.message});

                });
            });

        } catch (err) {
            Log.error('RouteHandler::postDataset(..) - ERROR: ' + err.message);
            res.send(400, {err: err.message});
        }
        return next();
    }



    public static postHistory(req: restify.Request, res:restify.Response, next: restify.Next){
        Log.trace('RouteHandler::postHistory(..) - params: ' + JSON.stringify(req.params));
        try {
            let facade = RouteHandler.myInsightFacade;
            let id: string = req.params;
            //console.log(id);
            // let controller = new QueryController(datasets);

            facade.performHistory(id).then(function (result) {
                res.json(result.code, result.body);
            }).catch(function (err: Error) {
                Log.trace('RouteHandler::postHistory(..) - ERROR: ' + err.message);
                res.json(403, {err: err.message});
            });
        } catch(err) {
            Log.error('RouteHandler::postHistory(..) - ERROR: ' + err);
            res.send(403);
        }

        return next();

    }

    public static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::postQuery(..) - params: ' + JSON.stringify(req.params));
        try {
            let facade = RouteHandler.myInsightFacade;
            let query: QueryRequest = req.params;
            // let controller = new QueryController(datasets);


            if(Object.keys(query).length==0) {
                res.json(400, {error: 'invalid query'});
            }
            facade.performQuery(query).then(function (result) {
                res.json(result.code, result.body);
            }).catch(function (err: Error) {
                Log.trace('RouteHandler::postDataset(..) - ERROR: ' + err.message);
                res.json(403, {err: err.message});
            });
        } catch(err) {
            Log.error('RouteHandler::postQuery(..) - ERROR: ' + err);
            res.send(403);
        }

        return next();
    }


    public static postScheduler(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::postSchedule(..) - params: ' + JSON.stringify(req.params));
        try {
            let facade = RouteHandler.myInsightFacade;
            let scheduler: SchedulerRequest = req.params;


            facade.performSchedule(scheduler).then(function (result) {
                res.json(result.code, result.body);
            }).catch(function (err: Error) {
                Log.trace('RouteHandler::postDataset(..) - ERROR: ' + err.message);
                res.json(403, {err: err.message});
            });
        } catch(err) {
            Log.error('RouteHandler::postQuery(..) - ERROR: ' + err);
            res.send(403);
        }

        return next();
    }

    public static deleteDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::deleteDatases(..) - params: ' + JSON.stringify(req.params));
        try {
            var id: string = req.params.id;

            // let controller = RouteHandler.datasetController;
            let facade = RouteHandler.myInsightFacade;

            facade.removeDataset(id).then(function (result) {
                res.json(result.code, result.body);
            }).catch(function (err: Error) {
                Log.trace('RouteHandler::deleteDatases(..) - ERROR: ' + err.message);
                res.json(404, {err: err.message});
            })

        } catch (err) {
            Log.error('RouteHandler::postQuery(..) - ERROR: ' + err);
            res.send(404);
        }
        return next();
    }
}
