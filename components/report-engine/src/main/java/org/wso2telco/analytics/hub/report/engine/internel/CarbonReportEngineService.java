package org.wso2telco.analytics.hub.report.engine.internel;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.dataservice.commons.AnalyticsDataResponse;
import org.wso2.carbon.analytics.dataservice.commons.SearchResultEntry;
import org.wso2.carbon.analytics.dataservice.core.AnalyticsDataServiceUtils;
import org.wso2.carbon.analytics.datasource.commons.Record;
import org.wso2.carbon.analytics.datasource.commons.exception.AnalyticsException;
import org.wso2.carbon.context.PrivilegedCarbonContext;
import org.wso2telco.analytics.hub.report.engine.ReportEngineService;
import org.wso2telco.analytics.hub.report.engine.internel.ds.ReportEngineServiceHolder;
import org.wso2telco.analytics.hub.report.engine.internel.util.CSVWriter;
import org.wso2telco.analytics.hub.report.engine.internel.util.ReportEngineServiceConstants;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class CarbonReportEngineService implements ReportEngineService {

    private static ThreadPoolExecutor threadPoolExecutor;

    public CarbonReportEngineService() {
        threadPoolExecutor = new ThreadPoolExecutor(ReportEngineServiceConstants.SERVICE_MIN_THREAD_POOL_SIZE,
                ReportEngineServiceConstants.SERVICE_MAX_THREAD_POOL_SIZE,
                ReportEngineServiceConstants.DEFAULT_KEEP_ALIVE_TIME_IN_MILLIS,
                TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<Runnable>(ReportEngineServiceConstants.SERVICE_EXECUTOR_JOB_QUEUE_SIZE));
    }

    public void generateCSVReport(String tableName, String query, String reportName, int maxLength, String reportType) {
        int tenantId = PrivilegedCarbonContext.getThreadLocalCarbonContext().getTenantId(true);
        threadPoolExecutor.submit(new ReportEngineGenerator(tableName,query, maxLength, reportName, tenantId, reportType));
    }
}

class ReportEngineGenerator implements Runnable {

    private static final Log log = LogFactory.getLog(ReportEngineGenerator.class);
    private String tableName;
    private String query;
    private int maxLength;
    private String reportName;
    private int tenantId;
    private String reportType;

    public ReportEngineGenerator(String tableName, String query, int maxLength, String reportName, int tenantId, String reportType) {
        this.tableName = tableName;
        this.query = query;
        this.maxLength = maxLength;
        this.reportName = reportName;
        this.tenantId = tenantId;
        this.reportType = reportType;
    }

    @Override
    public void run() {
        try {

            int searchCount =  ReportEngineServiceHolder.getAnalyticsDataService()
                    .searchCount(tenantId, tableName, query);

            int writeBufferLength = 8192;

            if(reportType.equalsIgnoreCase("transaction")) {
                //Check weather search count is greater than the max file length and split files accordingly
                if (searchCount > maxLength) {
                    for (int i = 0; i < searchCount; ) {
                        int end = i + maxLength;
                        String filepath = reportName + "-" + i + "-" + end + ".csv";
                        generate(tableName, query, filepath, tenantId, i, maxLength, writeBufferLength);
                        i = end;
                    }
                } else {
                    String filepath = reportName + ".csv";
                    generate(tableName, query, filepath, tenantId, 0, searchCount, writeBufferLength);
                }
            } else if(reportType.equalsIgnoreCase("traffic")) {
                String filepath = reportName +  ".csv";
                generate(tableName, query, filepath, tenantId, 0, searchCount, writeBufferLength);
            }



        } catch (AnalyticsException e) {
            log.error("Data cannot be loaded for " + reportName + "report", e);
        }
    }

    public void generate(String tableName, String query, String filePath, int tenantId, int start,
                            int maxLength, int writeBufferLength)
            throws AnalyticsException{

        int dataCount = ReportEngineServiceHolder.getAnalyticsDataService()
                .searchCount(tenantId, tableName, query);
        List<Record> records = new ArrayList<>();
        if(dataCount > 0) {
            List<SearchResultEntry> resultEntries = ReportEngineServiceHolder.getAnalyticsDataService()
                    .search(tenantId, tableName, query, start, maxLength);

            List<String> ids = new ArrayList<>();
            for (SearchResultEntry entry : resultEntries) {
                ids.add(entry.getId());
            }
            AnalyticsDataResponse resp = ReportEngineServiceHolder.getAnalyticsDataService()
                    .get(tenantId, tableName, 1, null, ids);

            records = AnalyticsDataServiceUtils
                    .listRecords(ReportEngineServiceHolder.getAnalyticsDataService(), resp);
            Collections.sort(records, new Comparator<Record>(){
                @Override
                public int compare(Record o1, Record o2) {
                    return Long.compare(o1.getTimestamp(), o2.getTimestamp());
                }
            });
        }
        try {
            if (reportType.equalsIgnoreCase("traffic")) {
                CSVWriter.writeTrafficCSV(records, writeBufferLength, filePath);
            } else if (reportType.equalsIgnoreCase("transaction")) {
                CSVWriter.writeTransactionCSV(records, writeBufferLength, filePath);
            }
        } catch (IOException e) {
            log.error("CSV file " + filePath + " cannot be created", e);
        }
    }

}