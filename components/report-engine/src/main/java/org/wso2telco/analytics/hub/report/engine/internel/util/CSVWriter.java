/*
 *  Copyright (c) 2016 WSO2.Telco Inc. (http://www.wso2telco.com) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */
package org.wso2telco.analytics.hub.report.engine.internel.util;

import org.wso2.carbon.analytics.datasource.commons.Record;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.Format;
import java.text.SimpleDateFormat;
import java.util.*;

public class CSVWriter {

    public static void writeTransactionCSV(List<Record> records, int bufSize, String filePath) throws IOException {

        File file = new File(filePath);
        file.getParentFile().mkdirs();
        FileWriter writer = new FileWriter(file, true);
        BufferedWriter bufferedWriter = new BufferedWriter(writer, bufSize);

        StringBuilder sb = new StringBuilder();
        sb.append("API");
//      sb.append(',');
//      sb.append("MSISDN");
        sb.append(',');
        sb.append("Date Time");
        sb.append(',');
        sb.append("Service Provider");
        sb.append(',');
        sb.append("Application Name");
        sb.append(',');
//      sb.append("Operator Id");
//      sb.append(',');
        sb.append("Response Code");
        sb.append(System.getProperty("line.separator"));

        if (records.size() > 0) {
            for (Record record : records) {
                sb.append(record.getValues().get("api"));
                sb.append(',');
//              sb.append(record.getValues().get("msisdn"));
//              sb.append(',');
                Date date = new Date(Long.parseLong(record.getValues().get("responseTime").toString()));
                Format format = new SimpleDateFormat("yyyy MM dd HH:mm:ss");
                sb.append(format.format(date));
                sb.append(',');
                String spValue = (String) record.getValues().get("serviceProvider");
                sb.append(spValue.replace("@carbon.super",""));

                sb.append(',');
                sb.append(record.getValues().get("applicationName"));
                sb.append(',');
//              sb.append(record.getValues().get("operatorId"));
//              sb.append(',');
                sb.append(record.getValues().get("responseCode"));
                sb.append(System.getProperty("line.separator"));
            }
            bufferedWriter.write(sb.toString());
        }else{
            bufferedWriter.write("No data available for this date range");
        }

            bufferedWriter.flush();
            bufferedWriter.close();
        }

    public static void writeTrafficCSV(List<Record> records, int bufSize, String filePath, String tableName) throws IOException {

        File file = new File(filePath);
        file.getParentFile().mkdirs();
        FileWriter writer = new FileWriter(file, true);
        BufferedWriter bufferedWriter = new BufferedWriter(writer, bufSize);

        Map<String, Integer> apiCount = new TreeMap<>();
        Integer count = 0;

        if (records.size() > 0) {
            for (Record record : records) {
                String key = record.getValues().get("api").toString();
                if(apiCount.containsKey(key)) {

                    if(tableName.contains("ORG_WSO2TELCO_ANALYTICS_HUB_STREAM_FAILURE_SUMMARY"))
                    {
                        count = apiCount.get(key) + Integer.parseInt(record.getValues().get("totalFailureCount").toString());
                    }
                    else
                    {
                        count = apiCount.get(key) + Integer.parseInt(record.getValues().get("totalCount").toString());
                    }


                }
                else {

                    if(tableName.contains("ORG_WSO2TELCO_ANALYTICS_HUB_STREAM_FAILURE_SUMMARY"))
                    {
                        count = Integer.parseInt(record.getValues().get("totalFailureCount").toString());
                    }
                    else
                    {
                        count = Integer.parseInt(record.getValues().get("totalCount").toString());
                    }

                }
                apiCount.put(key, count);
             }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("API");
        sb.append(',');
        sb.append("Total Count");
        sb.append(System.getProperty("line.separator"));

         if (records.size() > 0) {
            for (String key : apiCount.keySet()) {
                sb.append(key);
                sb.append(',');
                sb.append(apiCount.get(key));
                sb.append(System.getProperty("line.separator"));
            }
            bufferedWriter.write(sb.toString());
        }else{
            bufferedWriter.write("No data available for this date range");
        }
        bufferedWriter.flush();
        bufferedWriter.close();

    }

}
