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
$(function () {
    var gadgetLocation;
    var conf;
    var schema;
    var pref = new gadgets.Prefs();

    var refreshInterval;
    var providerData;

    var CHART_CONF = 'chart-conf';
    var PROVIDER_CONF = 'provider-conf';
    var REFRESH_INTERVAL = 'refreshInterval';
    var operatorId = 0, serviceProviderId = 0, apiId = 0, applicationId = 0;

    var init = function () {
        $.ajax({
            url: gadgetLocation + '/conf.json',
            method: "GET",
            contentType: "application/json",
            async: false,
            success: function (data) {
                conf = JSON.parse(data);
                conf.operator =  operatorId;
                conf.serviceProvider = serviceProviderId;
                conf.api = apiId;
                conf.applicationName = applicationId;
                conf.dateStart = moment(moment($("#reportrange").text().split("-")[0]).format("MMMM D, YYYY hh:mm A")).valueOf();
                conf.dateEnd = moment(moment($("#reportrange").text().split("-")[1]).format("MMMM D, YYYY hh:mm A")).valueOf();
                conf["provider-conf"].tableName = "ORG_WSO2TELCO_ANALYTICS_HUB_STREAM_REPONSETIME_SUMMARY_PER_DAY";


                $.ajax({
                    url: gadgetLocation + '/gadget-controller.jag?action=getSchema',
                    method: "POST",
                    data: JSON.stringify(conf),
                    contentType: "application/json",
                    async: false,
                    success: function (data) {
                        schema = data;
                    }
                });
            }
        });
    };

    var getProviderData = function (){


        conf["provider-conf"].tableName = "ORG_WSO2TELCO_ANALYTICS_HUB_STREAM_REPONSETIME_SUMMARY_PER_";

        $.ajax({
            url: gadgetLocation + '/gadget-controller.jag?action=getData',
            method: "POST",
            data: JSON.stringify(conf),
            contentType: "application/json",
            async: false,
            success: function (data) {
                providerData = data;
            }
        });

        return providerData;
    };


    var drawGadget = function (){

        draw('#canvas', conf[CHART_CONF], schema, providerData);
        setInterval(function() {
            draw('#canvas', conf[CHART_CONF], schema, getProviderData());
        },pref.getInt(REFRESH_INTERVAL));

    };


    $("#button-search").click(function() {
        $("#canvas").html("");
        $("#canvas2").html("");
        getGadgetLocation(function (gadget_Location) {
            gadgetLocation = gadget_Location;
            init();
            getProviderData();
            drawGadget();
        });
    });



    getGadgetLocation(function (gadget_Location) {
        gadgetLocation = gadget_Location;
        init();
        loadOperator();
        // loadSP();
        // loadApp();
        // loadApi();
      function loadOperator (){
                  conf["provider-conf"]["tableName"] = "ORG_WSO2TELCO_ANALYTICS_HUB_STREAM_OPERATOR_SUMMARY";
                  conf["provider-conf"]["provider-name"] = "operator";
                  conf.operator = 0;
                  operatorId = 0;
                  $.ajax({
                      url: gadgetLocation + '/gadget-controller.jag?action=getData',
                      method: "POST",
                      data: JSON.stringify(conf),
                      contentType: "application/json",
                      async: false,
                      success: function (data) {
                          $("#dropdown-operator").empty();
                          var operatorsItems = "";
                          var operatorIds = [];
                          var loadedOperator = [];
                          operatorIds.push(operatorId);
                          operatorsItems += '<li><a data-val="0" href="#">All Operator</a></li>';
                          for (var i =0 ; i < data.length; i++) {
                              var operator = data[i];
                              if($.inArray(operator.operatorId, loadedOperator)<0){
                              operatorsItems += '<li><a data-val='+ operator.operatorId +' href="#">' + operator.operatorName +'</a></li>';
                              operatorIds.push(" "+operator.operatorId);
                              loadedOperator.push(operator.operatorId);
                            }
                          }
                          $("#dropdown-operator").html( $("#dropdown-operator").html() + operatorsItems);
                          $("#button-operator").val('<li><a data-val="0" href="#">All Operator</a></li>');
                          $("#button-operator").append('&nbsp;<span class="caret"></span>');
                          loadSP(operatorIds);

                          $("#dropdown-operator li a").click(function(){
                              $("#button-operator").text($(this).text());
                              $("#button-operator").append('&nbsp;<span class="caret"></span>');
                              $("#button-operator").val($(this).text());
                              operatorIds = $(this).data('val');
                              loadSP(operatorIds);
                          });
                      }
                  });
                }

          function loadSP (clickedOperator){

            conf["provider-conf"]["tableName"] = "ORG_WSO2TELCO_ANALYTICS_HUB_STREAM_API_SUMMARY";
            conf["provider-conf"]["provider-name"] = "operator";
            conf.operator =  "("+clickedOperator+")";
            serviceProviderId =0;

            $.ajax({
                url: gadgetLocation + '/gadget-controller.jag?action=getData',
                method: "POST",
                data: JSON.stringify(conf),
                contentType: "application/json",
                async: false,
                success: function (data) {
                    $("#dropdown-sp").empty();
                    $("#button-sp").text('All Service provider');
                    var spItems = '';
                    var spIds = [];
                    var loadedSps = [];
                    spIds.push(serviceProviderId);
                    spItems += '<li><a data-val="0" href="#">All Service Provider</a></li>';
                    for ( var i =0 ; i < data.length; i++) {
                        var sp = data[i];
                        if($.inArray(sp.serviceProviderId, loadedSps)<0){
                        spItems += '<li><a data-val='+ sp.serviceProviderId +' href="#">' + sp.serviceProvider.replace("@carbon.super","") +'</a></li>'
                        spIds.push(" "+sp.serviceProviderId);
                        loadedSps.push(sp.serviceProviderId);
                      }
                    }

                    $("#dropdown-sp").html(spItems);

                  //  $("#button-sp").text('All');
                    $("#button-sp").val('<li><a data-val="0" href="#">All Service Provider</a></li>');
                    $("#button-sp").append('&nbsp;<span class="caret"></span>');
                    loadApp(spIds);
                    $("#dropdown-sp li a").click(function(){

                        $("#button-sp").text($(this).text());
                        $("#button-sp").append('&nbsp;<span class="caret"></span>');
                        $("#button-sp").val($(this).text());
                        // var clickedSP = [];
                        // clickedSP.push($(this).data('val'));
                        spIds = $(this).data('val');
                        serviceProviderId = spIds;
                        loadApp(spIds);
                    });


                }
            });
        }

        function loadApp (sps){
        // alert(sps);
        // if(sps)
        conf["provider-conf"]["tableName"] = "ORG_WSO2TELCO_ANALYTICS_HUB_STREAM_API_SUMMARY";
        conf["provider-conf"]["provider-name"] = "sp";
        applicationId = 0;
        conf.serviceProvider = "("+sps+")";
        $.ajax({
            url: gadgetLocation + '/gadget-controller.jag?action=getData',
            method: "POST",
            data: JSON.stringify(conf),
            contentType: "application/json",
            async: false,
            success: function (data) {

                $("#dropdown-app").empty();
                $("#button-app").text('All Application');
                var apps = [];
                var loadedApps = [];
                var appItems = '<li><a data-val="0" href="#">All Application</a></li>';
                for ( var i =0 ; i < data.length; i++) {
                    var app = data[i];
                    if($.inArray(app.applicationId, loadedApps)<0){
                    appItems += '<li><a data-val='+ app.applicationId +' href="#">' + app.applicationName +'</a></li>'
                    apps.push(" "+app.applicationId);
                    loadedApps.push(app.applicationId);
                  }
                }

                $("#dropdown-app").html( $("#dropdown-app").html() + appItems);
                $("#button-app").val('<li><a data-val="0" href="#">All Application</a></li>');
                $("#button-app").append('&nbsp;<span class="caret"></span>');
              //  $("#button-app").text('All');
                // loadApp(sps[i]);

                loadApi(apps);

                $("#dropdown-app li a").click(function(){

                    $("#button-app").text($(this).text());
                    $("#button-app").append('&nbsp;<span class="caret"></span>');
                    $("#button-app").val($(this).text());
                    // var clickedSP = [];
                    // clickedSP.push($(this).data('val'));
                    apps = $(this).data('val');
                    applicationId = apps;
                    loadApi(apps);
                });

            }
        });
      }

      function loadApi (apps){
      conf["provider-conf"]["tableName"] = "ORG_WSO2TELCO_ANALYTICS_HUB_STREAM_API_SUMMARY";
      conf["provider-conf"]["provider-name"] = "app";
      conf.applicationId = "("+apps+")";;
      apiId = 0;
      $.ajax({
          url: gadgetLocation + '/gadget-controller.jag?action=getData',
          method: "POST",
          data: JSON.stringify(conf),
          contentType: "application/json",
          async: false,
          success: function (data) {
            // alert("loadApi :" +JSON.stringify(data));

              $("#dropdown-api").empty();
              $("#button-api").text('All Api');
              var apis = [];
              var loadedApis = [];
              var apiItems = '<li><a data-val="0" href="#">All Api</a></li>';
              for ( var i =0 ; i < data.length; i++) {
                  var api = data[i];
                  if($.inArray(api.apiID, loadedApis)<0){
                  apiItems += '<li><a data-val='+ api.apiID +' href="#">' + api.api +'</a></li>';
                  loadedApis.push(api.apiID);
                }
              }

              $("#dropdown-api").html( $("#dropdown-api").html() + apiItems);
              $("#button-api").val('<li><a data-val="0" href="#">All Api</a></li>');
              $("#button-api").append('&nbsp;<span class="caret"></span>');
           //   $("#button-api").text('All');
              // loadApp(sps[i]);
              $("#dropdown-api li a").click(function(){
                  $("#button-api").text($(this).text());
                  $("#button-api").append('&nbsp;<span class="caret"></span>');
                  $("#button-api").val($(this).text());
                  apiId = $(this).data('val');
              });

          }
      });
    }

        $("#button-app").val("All");
        $("#button-api").val("All");
        $("#button-type").val("Response Time");

        $('input[name="daterange"]').daterangepicker({
            timePicker: true,
            timePickerIncrement: 30,
            locale: {
                format: 'MM/DD/YYYY h:mm A'
            }
        });
    });

    $("#dropdown-type li a").click(function(){
        $("#button-type").text($(this).text());
        $("#button-type").append('<span class="caret"></span>');
        $("#button-type").val($(this).text());
    });




});
