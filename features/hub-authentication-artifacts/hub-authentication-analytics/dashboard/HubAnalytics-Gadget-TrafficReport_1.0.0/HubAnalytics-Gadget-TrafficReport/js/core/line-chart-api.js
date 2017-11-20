/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var getConfig, validate, isProviderRequired, draw, update;

(function() {

    var CHART_LOCATION = '/extensions/chart-templates/';

    /**
     * return the config to be populated in the chart configuration UI
     * @param schema
     */
    getConfig = function(schema) {
        var chartConf = require(CHART_LOCATION + '/line-chart/config.json').config;
        /*
         dynamic logic goes here
         */

        var columns = [];

        columns.push("None");
        for (var i = 0; i < schema.length; i++) {
            columns.push(schema[i]["fieldName"]);
        }

        for (var i = 0; i < chartConf.length; i++) {
            if (chartConf[i]["fieldName"] == "color") {
                chartConf[i]["valueSet"] = columns;
                break;
            }
        }

        return chartConf;
    };

    /**
     * validate the user inout for the chart configuration
     * @param chartConfig
     */
    validate = function(chartConfig) {
        return true;
    };

    /**
     * TO be used when provider configuration steps need to be skipped
     */
    isProviderRequired = function() {

    }


    /**
     * return the gadget content
     * @param chartConfig
     * @param schema
     * @param data
     */
    draw = function(placeholder, chartConfig, _schema, data) {
        _schema = updateUserPrefXYTypes(_schema, chartConfig);
        var schema = toVizGrammarSchema(_schema);

        var type = $("#button-type").val().toLowerCase().trim();

        if (type == "api traffic") {
            chartConfig.color = "api";
            chartConfig.count = "totalCount";
        /* } else if (type == "operator traffic") {
            chartConfig.color = "operatorName";
            chartConfig.count = "totalCount";
        */
        } else if (type == "error traffic") {
            chartConfig.color = "errorMessageId";
            chartConfig.count = "totalFailureCount";
        }

        var view = {
            id: "chart-0",
            schema: schema,
            chartConfig: buildChartConfig(chartConfig),
            data: function() {
                if (lineChartGroupData) {
                    var result = [];
                    lineChartGroupData.forEach(function(item) {
                        var row = [];
                        schema[0].metadata.names.forEach(function(name) {
                            row.push(item[name]);
                        });
                        result.push(row);
                    });
                    wso2gadgets.onDataReady(result.sort(compare));
                }
            }
        };

        var groupData = [];
        var lineChartGroupData = [];
        var arcConfig = buildChart2Config(chartConfig);

        data.forEach(function(row) {
            var notAvailable = true;
            var groupRow = JSON.parse(JSON.stringify(row));

            var notAvailableForLineChart = true;
            var lineCharGroupRow = JSON.parse(JSON.stringify(row));

            groupData.forEach(function(row2) {
                if (groupRow[arcConfig.color] == row2[arcConfig.color]) {
                    notAvailable = false;
                    if (lineCharGroupRow['eventTimeStamp'] == row2['eventTimeStamp']) {
                        notAvailableForLineChart = false;
                    }
                }

            });

            if (notAvailable) {

                groupRow[arcConfig.x] = 0;

                data.forEach(function(row2) {
                    if (groupRow[arcConfig.color] == row2[arcConfig.color]) {
                        groupRow[arcConfig.x] += row2[arcConfig.x];
                    }
                });

                groupData.push(groupRow);
            }

            if (notAvailableForLineChart) {
                lineCharGroupRow[arcConfig.x] = 0;
                data.forEach(function(row3) {
                    if ((lineCharGroupRow[arcConfig.color] == row3[arcConfig.color]) && (lineCharGroupRow['eventTimeStamp'] == row3['eventTimeStamp'])) {
                        lineCharGroupRow[arcConfig.x] += row3[arcConfig.x];
                    }
                });
                lineChartGroupData.push(lineCharGroupRow);
            }
        });

        var view2 = {
            id: "chart-1",
            schema: schema,
            chartConfig: arcConfig,
            data: function() {
                if (groupData) {
                    var result = [];
                    groupData.forEach(function(item) {
                        var row = [];
                        schema[0].metadata.names.forEach(function(name) {
                            row.push(item[name]);
                        });
                        result.push(row);
                    });
                    wso2gadgets.onDataReady(result.sort(compare));
                }
            }

        };

        try {
            wso2gadgets.init(placeholder, view);
            var view = wso2gadgets.load("chart-0");


            wso2gadgets.init("#canvas2", view2);
            var view2 = wso2gadgets.load("chart-1");

        } catch (e) {
            console.error(e);
        }

    };

    compare = function(a, b) {
        return a[9] - b[9];

    };

    /**
     *
     * @param data
     */
    update = function(data) {
        wso2gadgets.onDataReady(data, "append");
    };

    buildChartConfig = function(_chartConfig) {
        var conf = {};
        conf.x = "eventTimeStamp";
        conf.height = 400;
        conf.xTitle = "Event Timestamp";
        conf.yTitle = "Total Count";
        conf.color = _chartConfig.color;
        conf.width = 600;
        conf.xType = _chartConfig.xType;
        conf.padding = { "top": 5, "left": 70, "bottom": 40, "right": 20 };
        conf.yType = "linear";
        conf.maxLength = _chartConfig.maxLength;
        conf.charts = [];
        conf.charts[0] = {
            type: "line",
            y: _chartConfig.count,
            legend: false,
            zero: true
        };
        return conf;
    };


    buildChart2Config = function(_chartConfig) {
        var conf = {};
        conf.x = _chartConfig.count;
        conf.color = _chartConfig.color;
        conf.height = 400;
        conf.width = 450;
        conf.xType = _chartConfig.xType;
        conf.yType = _chartConfig.yType;
        conf.padding = { "top": 0, "left": 0, "bottom": 40, "right": 50 };
        conf.maxLength = _chartConfig.maxLength;
        conf.charts = [];
        conf.charts[0] = {
            type: "arc",
            mode: "pie"
        };

        return conf;
    };


}());