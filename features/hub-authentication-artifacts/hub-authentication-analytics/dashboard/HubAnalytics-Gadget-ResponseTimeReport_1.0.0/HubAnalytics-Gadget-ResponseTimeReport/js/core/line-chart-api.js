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
        chartConfig.color = "api";
        chartConfig.count = "totalResponseCount";
        var groupDta = [];
        groupDta = groupData(data);

        var view = {
            id: "chart-0",
            schema: schema,
            chartConfig: buildChartConfig(chartConfig),
            data: function() {
                if (groupDta) {
                    var result = [];
                    groupDta.forEach(function(item) {
                        var row = [];
                        schema[0].metadata.names.forEach(function(name) {
                            row.push(item[name]);
                        });
                        result.push(row);
                    });
                    wso2gadgets.onDataReady(result);
                }
            }
        };

        try {
            wso2gadgets.init(placeholder, view);
            var view = wso2gadgets.load("chart-0");
        } catch (e) {
            console.error(e);
        }
    };

    groupData = function(data) {
        var gpData = [];

        data.forEach(function(row) {
            var notAvailable = true;
            var groupRow = JSON.parse(JSON.stringify(row));

            gpData.forEach(function(row2) {
                if (groupRow['responseTimeRange'] == row2['responseTimeRange']) {
                    notAvailable = false;
                }
            });

            if (notAvailable) {

                groupRow['totalResponseCount'] = 0;

                data.forEach(function(row2) {
                    if (groupRow['responseTimeRange'] == row2['responseTimeRange']) {
                        groupRow['totalResponseCount'] += row2['totalResponseCount'];
                    }
                });

                gpData.push(groupRow);
            }
        });
        return gpData;
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
        conf.x = "responseTimeRange";
        conf.xType = "ordinal";
        conf.xTitle = "Response Time Range(ms)";
        conf.height = 400;
        conf.yTitle = "Total Response Count";

        conf.xType = _chartConfig.xType;
        conf.padding = { "top": 20, "left": 70, "bottom": 40, "right": 40 };
        conf.yType = "linear";
        conf.maxLength = _chartConfig.maxLength;
        conf.charts = [];
        conf.charts[0] = {
            type: "bar",
            y: _chartConfig.count,
            legend: false
        };

        conf.tooltip= {"enabled":true, "color":"#e5f2ff", "type":"symbol",
            "content":["responseTimeRange","totalResponseCount"], "label":true}
        return conf;
    };
}());