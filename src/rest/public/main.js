$(function () {

    $("#datasetAdd").click(function () {
        var id = $("#datasetId").val();
        var zip = $("#datasetZip").prop('files')[0];
        var data = new FormData();
        data.append("zip", zip);
        $.ajax("/dataset/" + id,
            {
                type: "PUT",
                data: data,
                processData: false
            }).fail(function (e) {
            spawnHttpErrorModal(e)
        });
    });

    $("#datasetRm").click(function () {
        var id = $("#datasetId").val();
        $.ajax("/dataset/" + id, {type: "DELETE"}).fail(function (e) {
            spawnHttpErrorModal(e)
        });
    });

    $("#queryCourses").submit(function (e) {
        e.preventDefault();

        var q0 = translateQuery($("#searchField0").val(), $("#searchValue0").val());
        var q1 = translateQuery($("#searchField1").val(), $("#searchValue1").val());
        var q2 = translateQuery($("#searchField2").val(), $("#searchValue2").val());
        var q3 = translateQuery($("#searchField3").val(), $("#searchValue3").val());
        var q4 = translateQuery($("#searchField4").val(), $("#searchValue4").val());

        var logic = searchLogic($("#searchBoolean0").val(), $("#searchBoolean1").val(), $("#searchBoolean2").val(), $("#searchBoolean3").val());
        var queries = queryArray(q0, q1, q2, q3, q4);
        var where = combineWhere(queries, logic);

        var get = [$("#getField0").val(), $("#getField1").val(), $("#getField2").val(), $("#getField3").val(), $("#getField4").val()];
        get = translateGet(get);

        var query = {};
        query["GET"] = get;
        query["WHERE"] = where;
        query["AS"] = "TABLE";

        for (var i in get) {
            if (get[i].indexOf("_") == -1) {
                var group = translateGroup(get);
                var apply = translateApply(get);
                query["GROUP"] = group;
                query["APPLY"] = apply;
            }
        }

        var order = translateOrder($("#orderCourses").val(), get);
        if (order != null) {
            query["ORDER"] = order;
        }

        try {
            $.ajax("/query", {
                type: "POST",
                data: JSON.stringify(query),
                contentType: "application/json",
                dataType: "json",
                success: function (data) {
                    if (data["render"] === "TABLE") {
                        generateTable(data["result"]);
                    }
                }

            }).fail(function (e) {
                spawnHttpErrorModal(e)
            });


        } catch (err) {
            spawnErrorModal("Query Error", err);
        }


    });

    $("#queryRooms").submit(function (e) {
        e.preventDefault();

        var q0 = translateQueryRoom($("#searchRoom0").val(), $("#searchRoomValue0").val());
        var q1 = translateQueryRoom($("#searchRoom1").val(), $("#searchRoomValue1").val());
        var q2 = translateQueryRoom($("#searchRoom2").val(), $("#searchRoomValue2").val());
        var q3 = translateQueryRoom($("#searchRoom3").val(), $("#searchRoomValue3").val());
        var q4 = translateQueryRoom($("#searchRoom4").val(), $("#searchRoomValue4").val());

        var logic = searchLogic($("#searchRoomLogic0").val(), $("#searchRoomLogic1").val(), $("#searchRoomLogic2").val(), $("#searchRoomLogic3").val());
        var queries = queryArray(q0, q1, q2, q3, q4);

        var where = combineWhere(queries, logic);
        var get = [$("#getRooms0").val(), $("#getRooms1").val(), $("#getRooms2").val(), $("#getRooms3").val()];
        get = translateGet(get);

        var query = {};
        query["GET"] = get;
        query["WHERE"] = where;
        query["AS"] = "TABLE";

        var order = translateOrder($("#orderRooms").val(), get);
        if (order != null) {
            query["ORDER"] = order;
        }

        try {
            $.ajax("/query", {type:"POST", data: JSON.stringify(query), contentType: "application/json", dataType: "json", success: function(data) {
                if (data["render"] === "TABLE") {
                    generateTableRooms(data["result"]);
                }
            }}).fail(function (e) {
                spawnHttpErrorModalRooms(e)
            });
        } catch (err) {
            spawnErrorModalRooms("Query Error", err);
        }
    });

    function translateGet(getArray) {
        var get = [];
        for (var g in getArray) {
            if (getArray[g] != "null") {
                get.push(getArray[g]);
            }
        }
        return get;
    }

    function translateQuery(searchField, searchValue) {
        var subQuery = {};
        if (searchField == "courses_size") {
            if (searchValue.indexOf(">") != -1) {
                subQuery = {"GT": {"courses_size": Number(searchValue.split(">")[1])}};
            } else if (searchValue.indexOf("<") != -1) {
                subQuery = {"LT": {"courses_size": Number(searchValue.split("<")[1])}};
            } else {
                subQuery = {"EQ": {"courses_size": Number(searchValue)}};
            }
        } else if (searchField == "courses_dept") {
            subQuery = {"IS": {"courses_dept": searchValue}};
        } else if (searchField == "courses_id") {
            subQuery = {"IS": {"courses_id": searchValue}};
        } else if (searchField == "courses_instructor") {
            subQuery = {"IS": {"courses_instructor": searchValue}};
        } else if (searchField == "courses_title") {
            subQuery = {"IS": {"courses_title": searchValue}};
        } else {
            subQuery = null;
        }
        return subQuery;
    }

    function translateQueryRoom(searchField, searchValue) {
        var subQuery = {};
        if (searchField == "rooms_shortname") {
            subQuery = {"IS": {"rooms_shortname": searchValue}};
        } else if (searchField == "rooms_number") {
            subQuery = {"IS": {"rooms_number": searchValue}};
        } else if (searchField == "rooms_seats") {
            if (searchValue.indexOf(">") != -1) {
                subQuery = {"GT": {"rooms_seats": Number(searchValue.split(">")[1])}};
            } else if (searchValue.indexOf("<") != -1) {
                subQuery = {"LT": {"rooms_seats": Number(searchValue.split("<")[1])}};
            } else {
                subQuery = {"EQ": {"rooms_seats": Number(searchValue)}};
            }
        } else if (searchField == "rooms_furniture") {
            subQuery = {"IS": {"rooms_furniture": searchValue}};
        } else if (searchField == "rooms_type") {
            subQuery = {"IS": {"rooms_type": searchValue}};
        } else if (searchField == "location") {
            subQuery = handleLatLon(searchValue);
        } else {
            subQuery = null;
        }
        return subQuery;
    }

    function translateGroup(getArray) {
        var group = [];
        for (var g in getArray) {
            if (getArray[g].indexOf("_") != -1) {
                group.push(getArray[g]);
            }
        }
        return group;
    }

    function translateApply(getArray) {
        var apply = [];
        for (var g in getArray) {
            if (getArray[g] == "courseAvg") {
                apply.push({"courseAvg": {"AVG": "courses_avg"}});
            } else if (getArray[g] == "numSections") {
                apply.push({"numSections": {"COUNT": "courses_uuid"}});
            } else if (getArray[g] == "maxPass") {
                apply.push({"maxPass": {"MAX": "courses_pass"}});
            } else if (getArray[g] == "maxFail") {
                apply.push({"maxFail": {"MAX": "courses_fail"}});
            }
        }
        return apply;
    }

    function translateOrder(orderDir, getArray) {
        var order = {};
        order["dir"] = orderDir;
        order["keys"] = getArray;
        if (orderDir == "none") {
            order = null;
        }
        return order;
    }

    function combineWhere(queryArray, logicArray) {
        var where = {};
        if (logicArray.length == 0) {
            if (queryArray[0] != null) {
                where = queryArray[0];
            }
        } else if (logicArray.length == 1) {
            if (logicArray[0] == "NOT") {
                where["AND"] = [queryArray[0], {"NOT": queryArray[1]}];
            } else {
                where[logicArray[0]] = [queryArray[0], queryArray[1]];
            }
        } else if (logicArray.length == 2) {
            where = combineWhere([combineWhere([queryArray[0], queryArray[1]], [logicArray[0]]), queryArray[2]], [logicArray[1]]);
        } else if (logicArray.length == 3) {
            var firstLevel = combineWhere([queryArray[0], queryArray[1]], [logicArray[0]]);
            where = combineWhere([firstLevel, queryArray[2], queryArray[3]], [logicArray[1], logicArray[2]]);
        } else if (logicArray.length == 4) {
            var firstLevel = combineWhere([queryArray[0], queryArray[1]], [logicArray[0]]);
            where = combineWhere([firstLevel, queryArray[2], queryArray[3], queryArray[4]], [logicArray[1], logicArray[2], logicArray[3]]);
        }
            return where;
    }

    function queryArray(q0, q1, q2, q3, q4) {
        var arr = [];
        if (q0 != null) {
            arr.push(q0);
        }
        if (q1 != null) {
            arr.push(q1);
        }
        if (q2 != null) {
            arr.push(q2);
        }
        if (q3 != null) {
            arr.push(q3);
        }
        if (q4 != null) {
            arr.push(q4);
        }
        return arr;
    }

    function searchLogic(l1, l2, l3, l4) {
        var logic = [];
        if (l1 != "None") {
            logic.push(l1);
        }
        if (l2 != "None") {
            logic.push(l2);
        }
        if (l3 != "None") {
            logic.push(l3);
        }
        if (l4 != "None") {
            logic.push(l4);
        }
        return logic;
    }

    function generateTable(data) {
        var columns = [];
        Object.keys(data[0]).forEach(function (title) {
            columns.push({
                head: title,
                cl: "title",
                html: function (d) {
                    return d[title]
                }
            });
        });
        var container = d3.select("#render");
        container.html("");
        container.selectAll("*").remove();
        var table = container.append("table").style("margin", "auto");

        table.append("thead").append("tr")
            .selectAll("th")
            .data(columns).enter()
            .append("th")
            .attr("class", function (d) {
                return d["cl"]
            })
            .text(function (d) {
                return d["head"]
            });

        table.append("tbody")
            .selectAll("tr")
            .data(data).enter()
            .append("tr")
            .selectAll("td")
            .data(function (row, i) {
                return columns.map(function (c) {
                    // compute cell values for this specific row
                    var cell = {};
                    d3.keys(c).forEach(function (k) {
                        cell[k] = typeof c[k] == "function" ? c[k](row, i) : c[k];
                    });
                    return cell;
                });
            }).enter()
            .append("td")
            .html(function (d) {
                return d["html"]
            })
            .attr("class", function (d) {
                return d["cl"]
            });
    }

    function generateTableRooms(data) {
        var columns = [];
        Object.keys(data[0]).forEach(function (title) {
            columns.push({
                head: title,
                cl: "title",
                html: function (d) {
                    return d[title]
                }
            });
        });
        var container = d3.select("#renderRooms");
        container.html("");
        container.selectAll("*").remove();
        var table = container.append("table").style("margin", "auto");

        table.append("thead").append("tr")
            .selectAll("th")
            .data(columns).enter()
            .append("th")
            .attr("class", function (d) {
                return d["cl"]
            })
            .text(function (d) {
                return d["head"]
            });

        table.append("tbody")
            .selectAll("tr")
            .data(data).enter()
            .append("tr")
            .selectAll("td")
            .data(function (row, i) {
                return columns.map(function (c) {
                    // compute cell values for this specific row
                    var cell = {};
                    d3.keys(c).forEach(function (k) {
                        cell[k] = typeof c[k] == "function" ? c[k](row, i) : c[k];
                    });
                    return cell;
                });
            }).enter()
            .append("td")
            .html(function (d) {
                return d["html"]
            })
            .attr("class", function (d) {
                return d["cl"]
            });
    }

    function spawnHttpErrorModal(e) {
        $("#errorModal .modal-title").html(e.status);
        $("#errorModal .modal-body p").html(e.statusText + "</br>" + e.responseText);
        if ($('#errorModal').is(':hidden')) {
            $("#errorModal").modal('show')
        }
    }

    function spawnErrorModal(errorTitle, errorText) {
        $("#errorModal .modal-title").html(errorTitle);
        $("#errorModal .modal-body p").html(errorText);
        if ($('#errorModal').is(':hidden')) {
            $("#errorModal").modal('show')
        }
    }

    function spawnHttpErrorModalRooms(e) {
        $("#errorModal2 .modal-title").html(e.status);
        $("#errorModal2 .modal-body p").html(e.statusText + "</br>" + e.responseText);
        if ($("#errorModal2").is(':hidden')) {
            $("#errorModal2").modal('show')
        }
    }

    function spawnErrorModalRooms(errorTitle, errorText) {
        $("#errorModal2 .modal-title").html(errorTitle);
        $("#errorModal2 .modal-body p").html(errorText);
        if ($('#errorModal2').is(':hidden')) {
            $("#errorModal2").modal('show')
        }
    }

    function handleLatLon(input) {
        var param = input[0];
        var dist = input.split(param)[1].split("-")[0];
        var building = input.split("-")[1];
        return {"IS": {"rooms_location": {"param": param, "distance": dist, "building": building}}};
    }

    function generateTableHistory(data) {
        var columns = [];
        Object.keys(data[0]).forEach(function (title) {
            columns.push({
                head: title,
                cl: "title",
                html: function (d) {
                    return d[title]
                }
            });
        });
        var container = d3.select("#historyTable");
        container.html("");
        container.selectAll("*").remove();
        var table = container.append("table").style("margin", "auto");

        table.append("thead").append("tr")
            .selectAll("th")
            .data(columns).enter()
            .append("th")
            .attr("class", function (d) {
                return d["cl"]
            })
            .text(function (d) {
                return d["head"]
            });


            table.append("tbody")
                .selectAll("tr")
                .data(data).enter()
                .append("tr")
                .selectAll("td")
                .data(function (row, i) {
                    return columns.map(function (c) {
                        // compute cell values for this specific row
                        var cell = {};
                        d3.keys(c).forEach(function (k) {
                            cell[k] = typeof c[k] == "function" ? c[k](row, i) : c[k];
                        });
                        return cell;
                    });
                }).enter()
                .append("td")
                .html(function (d) {
                    return d["html"]
                })
                .attr("class", function (d) {
                    return d["cl"]
                });





    }

    function generateTableHistoryResult(data) {
        var columns = [];
        Object.keys(data[0]).forEach(function (title) {
            columns.push({
                head: title,
                cl: "title",
                html: function (d) {
                    return d[title]
                }
            });
        });
        var container = d3.select("#render-history");
        container.html("");
        container.selectAll("*").remove();
        var table = container.append("table").style("margin", "auto");

        table.append("thead").append("tr")
            .selectAll("th")
            .data(columns).enter()
            .append("th")
            .attr("class", function (d) {
                return d["cl"]
            })
            .text(function (d) {
                return d["head"]
            });

        table.append("tbody")
            .selectAll("tr")
            .data(data).enter()
            .append("tr")
            .selectAll("td")
            .data(function (row, i) {
                return columns.map(function (c) {
                    // compute cell values for this specific row
                    var cell = {};
                    d3.keys(c).forEach(function (k) {
                        cell[k] = typeof c[k] == "function" ? c[k](row, i) : c[k];
                    });
                    return cell;
                });
            }).enter()
            .append("td")
            .html(function (d) {
                return d["html"]
            })
            .attr("class", function (d) {
                return d["cl"]
            });
    }

    function generateTableSchedule(data) {
        var columns = [];
        Object.keys(data[0]).forEach(function (title) {
            columns.push({
                head: title,
                cl: "title",
                html: function (d) {
                    return d[title]
                }
            });
        });
        var container = d3.select("#schedule");
        container.html("");
        container.selectAll("*").remove();
        var table = container.append("table").style("margin", "auto");

        table.append("thead").append("tr")
            .selectAll("th")
            .data(columns).enter()
            .append("th")
            .attr("class", function (d) {
                return d["cl"]
            })
            .text(function (d) {
                return d["head"]
            });

        table.append("tbody")
            .selectAll("tr")
            .data(data).enter()
            .append("tr")
            .selectAll("td")
            .data(function (row, i) {
                return columns.map(function (c) {
                    // compute cell values for this specific row
                    var cell = {};
                    d3.keys(c).forEach(function (k) {
                        cell[k] = typeof c[k] == "function" ? c[k](row, i) : c[k];
                    });
                    return cell;
                });
            }).enter()
            .append("td")
            .html(function (d) {
                return d["html"]
            })
            .attr("class", function (d) {
                return d["cl"]
            });
    }

    $(document).ready(function () {

        var scheduler = {"COURSE": [], "ROOM": []};

        //Initialize tooltips
        $('.nav-tabs > li a[title]').tooltip();

        //Wizard
        $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {

            var $target = $(e.target);

            if ($target.parent().hasClass('disabled')) {
                return false;
            }
        });

        $(".prev-step").click(function (e) {

            var $active = $('.wizard .nav-tabs li.active');
            prevTab($active);

        });

        $(".filter-courses").click(function (e) {

            var query = {};
            var get = ["courses_dept", "courses_id", "maxSize", "numSections"];
            var where = {};
            var group = ["courses_dept", "courses_id"];
            var apply = [{"numSections": {"COUNT": "courses_uuid"}}, {"maxSize": {"MAX": "courses_size"}}];
            query["GET"] = get;
            query["GROUP"] = group;
            query["APPLY"] = apply;
            query["AS"] = "TABLE";
            query["ORDER"] = {"dir": "DOWN", "keys": ["maxSize", "numSections"]};

            //check all required fields for empty inputs
            var dep = $(".form-control#department").val();
            var cn = $(".form-control#courseNumber").val();

            var depList = [];
            var cnList = [];

            if (!dep && !cn) {
                alert("Cannot be empty.");
                return false;
            } else if (dep == "ALL") {
                query["WHERE"] = {"IS": {"courses_year": "2014"}};
            } else {
                if (!dep) {
                    depList = null;
                }  else if (dep.indexOf(";") == -1) {
                    depList.push(dep);
                } else {
                    depList = dep.split(";");
                }
                if (!cn) {
                    cnList = null;
                } else if (cn.indexOf(";") == -1) {
                    cnList.push(cn);
                } else {
                    cnList = cn.split(";");
                }
                var orListD = [];
                for (var d in depList) {
                    orListD.push({"IS": {"courses_dept": depList[d]}});
                }
                var orListC = [];
                for (var n in cnList) {
                    orListC.push({"IS": {"courses_id": cnList[n]}});
                }
                if (!cn) {
                    if (orListD.length == 1) {
                        where = {"AND": [{"IS": {"courses_year": "2014"}}, orListD[0]]};
                    } else {
                        where = {"AND": [{"IS": {"courses_year": "2014"}}, {"OR": orListD}]};
                    }
                    query["WHERE"] = where;
                } else if (!dep) {
                    if (orListC.length == 1) {
                        where = {"AND": [{"IS": {"courses_year": "2014"}}, orListC[0]]};
                    } else {
                        where = {"AND": [{"IS": {"courses_year": "2014"}}, {"OR": orListC}]};
                    }
                    query["WHERE"] = where;
                } else {
                    where = {"AND": [{"IS": {"courses_year": "2014"}}, {"AND": [{"OR": orListD}, {"OR": orListC}]}]};
                    query["WHERE"] = where;
                }

            }

            try {
                $.ajax("/query", {
                    type: "POST",
                    data: JSON.stringify(query),
                    contentType: "application/json",
                    dataType: "json",
                    success: function (data) {
                        scheduler.COURSE = data["result"];
                        for (var c in scheduler.COURSE) {
                            if (scheduler.COURSE[c]["numSections"] / 3 == 0) {
                                scheduler.COURSE[c]["numSections"] = 1;
                            } else {
                                scheduler.COURSE[c]["numSections"] = Math.ceil(scheduler.COURSE[c]["numSections"] / 3);
                            }
                        }
                    }
                }).fail(function (e) {
                    spawnHttpErrorModal(e)
                });
            } catch (err) {
                spawnErrorModal("Query Error", err);
            }

            var $active = $('.wizard .nav-tabs li.active');
            $active.next().removeClass('disabled');
            nextTab($active);


        });

        $(".filter-rooms").click(function (e) {

            var query = {};
            var get = ["rooms_name", "rooms_seats"];
            var where = {};
            query["GET"] = get;
            query["AS"] = "TABLE";
            query["ORDER"] = {"dir": "DOWN", "keys": ["rooms_seats"]};

            //check all required fields for empty inputs
            var buildingName = $(".form-control#buildingName").val();
            var distance = $(".form-control#distance").val();

            var buildingList = [];
            var distanceList = [];

            if (!buildingName && !distance) {
                alert("Cannot be empty.");
                return false;
            } else if (buildingName == "ALL") {
                query["WHERE"] = {};
            } else {
                if (!buildingName) {
                    buildingList = null;
                }  else if (buildingName.indexOf(";") == -1) {
                    buildingList.push(buildingName);
                } else {
                    buildingList = buildingName.split(";");
                }
                if (!distance) {
                    distanceList = null;
                } else if (distance.indexOf(";") == -1) {
                    distanceList.push(distance);
                } else {
                    distanceList = distance.split(";");
                }
                if (buildingList != null) {
                    var orListB = [];
                    for (var b in buildingList) {
                        orListB.push({"IS": {"rooms_shortname": buildingList[b]}});
                    }
                }
                if (distanceList != null) {
                    var orListD = [];
                    for (var d in distanceList) {
                        orListD.push(handleLatLon(distanceList[d]));
                    }
                }
                if (!distance) {
                    if (orListB.length == 1) {
                        where = orListB[0];
                    } else {
                        where = {"OR": orListB};
                    }
                    query["WHERE"] = where;
                } else if (!buildingName) {
                    if (orListD.length == 1) {
                        where = orListD[0];
                    } else {
                        where = {"OR": orListD};
                    }
                    query["WHERE"] = where;
                } else {
                    where = {"AND": [{"OR": orListB}, {"OR": orListD}]};
                    query["WHERE"] = where;
                }
            }

            try {
                $.ajax("/query", {
                    type: "POST",
                    data: JSON.stringify(query),
                    contentType: "application/json",
                    dataType: "json",
                    success: function (data) {
                        scheduler.ROOM = data["result"];
                        for (var r in scheduler.ROOM) {
                            scheduler.ROOM[r]["timeslot"] = 0;
                        }
                    }


                }).fail(function (e) {
                    spawnHttpErrorModal(e)
                });


            } catch (err) {
                spawnErrorModal("Query Error", err);
            }




            var $active = $('.wizard .nav-tabs li.active');
            $active.next().removeClass('disabled');
            nextTab($active);

        });

        $(".scheduling").click(function (e) {
            e.preventDefault();

            console.log("testing");


            $.ajax("/scheduler", {
                type: "POST",
                data: JSON.stringify(scheduler),
                contentType: "application/json",
                dataType: "json",
                success: function (data) {
                    console.log("testing inside success");


                    if (data["render"] === "TABLE") {
                        generateTableSchedule(data["result"]);
                    }
                }

                }).fail(function (e) {
                alert("fail");
            });

        });

        $(".unscheduling").click(function (e) {
            e.preventDefault();

            console.log("testing");


            $.ajax("/scheduler", {
                type: "POST",
                data: JSON.stringify(scheduler),
                contentType: "application/json",
                dataType: "json",
                success: function (data) {
                    console.log("testing inside success");


                    if (data["render"] === "TABLE") {
                        generateTableSchedule(data["unSchedule"]);
                    }
                }

            }).fail(function (e) {
                alert("fail");
            });

        });

        $(".quality").click(function (e) {
            e.preventDefault();

            console.log("testing");


            $.ajax("/scheduler", {
                type: "POST",
                data: JSON.stringify(scheduler),
                contentType: "application/json",
                dataType: "json",
                success: function (data) {
                    console.log("testing inside success");


                    if (data["render"] === "TABLE") {

                        generateTableSchedule(data["quality"]);



                    }
                }

            }).fail(function (e) {
                alert("fail");
            });

        });

        $(".get-history").click(function () {

            var id = $("#historyId").val();
            //console.log(id);
            if (id == "Choose ID"){
                alert("Please select one");
                return false;
            } else {
                // console.trace("main:: receiving user input");
                // console.log(id);
                // console.log(typeof id);


                try {
                    $.ajax("/history", {
                        type: "POST",
                        data: JSON.stringify(id),
                        contentType: "application/json",
                        dataType: "json",
                        success: function (data) {
                            //console.log(data);

                            if (data["render"] === "TABLE") {
                                var final_result = data["result"];
                                if (final_result.length == 0) {
                                    alert("No history was found.");
                                } else{

                                    // var i=0;

                                    // $(".myBox").html(final_result.forEach(function (query) {
                                    //     //console.table(query);
                                    //
                                    //     $(".myBox").html(JSON.stringify(query));
                                    //
                                    //     //generateTableHistory(JSON.stringify(query));
                                    //
                                    //     })
                                    // );
                                    //console.table(final_result);
                                    // for (var i in final_result){
                                    //     $(".myBox").html(JSON.stringify(final_result[i]));
                                    // }


                                    //$(".myBox").html(JSON.stringify(final_result));
                                    //generateTableHistory(final_result);



                                    var display = $.map(final_result, function(val) {

                                        return "<div><textarea rows='5' cols='60' align='middle'>"
                                            + JSON.stringify(val) + "</textarea></div></br></br>";

                                    });


                                    $(".historyBox").html(display);

                                    //generateTableHistory(display);

                                }

                            }
                        }

                    }).fail(function (e) {
                        spawnHttpErrorModal(e)
                    });


                } catch (err) {
                    spawnErrorModal("Query Error", err);
                }
            }
        });

        $("#queryForm").submit(function (e) {
            e.preventDefault();

            var query = $("#query").val();
            try {
                $.ajax("/query", {type:"POST", data: query, contentType: "application/json", dataType: "json", success: function(data) {
                    if (data["render"] === "TABLE") {
                        generateTableHistoryResult(data["result"]);

                    }



                }}).fail(function (e) {
                    spawnHttpErrorModal(e)
                });
            } catch (err) {
                spawnErrorModal("Query Error", err);
            }
        });

    });

    function nextTab(elem) {
        $(elem).next().find('a[data-toggle="tab"]').click();
    }

    function prevTab(elem) {
        $(elem).prev().find('a[data-toggle="tab"]').click();
    }
});

