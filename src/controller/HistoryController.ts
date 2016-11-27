import QueryController from "./QueryController";
import Log from "../Util";

/**
 * Created by Shih-Chun on 2016-11-20.
 */


// export interface HistoryRequest {
//     GET: string|string[];
//     WHERE: {};
//     GROUP?: string[];
//     APPLY?: {}[];
//     ORDER?: {dir: string, keys: string[]} | string;
//     AS: string;
// }

export interface HistoryResponse {
}

export default class HistoryController {



    public getHistory(id: string): HistoryResponse {


        Log.trace("getting history");
        //console.log(id);

        if (id == "courses"){
            Log.trace("getting courses history");
            //console.log(controller.historyDatasets[id]);
            return {render: "TABLE", result: QueryController.historyDatasets["courses"]};



        }else if (id == "rooms"){
            Log.trace("getting rooms history");

            return  {render: "TABLE", result: QueryController.historyDatasets["rooms"]};

        }

    }

}