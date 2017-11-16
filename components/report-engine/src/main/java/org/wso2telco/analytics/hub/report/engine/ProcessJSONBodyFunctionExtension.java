/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2telco.analytics.hub.report.engine;

import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.PathNotFoundException;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.wso2.siddhi.core.config.ExecutionPlanContext;
import org.wso2.siddhi.core.executor.ExpressionExecutor;
import org.wso2.siddhi.core.executor.function.FunctionExecutor;
import org.wso2.siddhi.query.api.definition.Attribute;
import org.wso2.siddhi.query.api.exception.ExecutionPlanValidationException;


public class ProcessJSONBodyFunctionExtension extends FunctionExecutor {

	private Attribute.Type returnType = Attribute.Type.OBJECT;
    private static final Logger log = Logger.getLogger(ProcessJSONBodyFunctionExtension.class);

	public Attribute.Type getReturnType() {
		return returnType;
	}

	public void start() {
		// TODO Auto-generated method stub
		
	}

	public void stop() {
		// TODO Auto-generated method stub
		
	}

	public Object[] currentState() {
		// TODO Auto-generated method stub
		return null;
	}

	public void restoreState(Object[] state) {
		// TODO Auto-generated method stub
		
	}

	@Override
	protected Object execute(Object[] data) {
		String jsonBody = (String) data[0];
		String jsonPath = (String) data[1];
		Object value = null;
		try{
			if(StringUtils.isNotEmpty(jsonBody)){
				value = JsonPath.read(jsonBody,jsonPath);
			}
		}catch (PathNotFoundException e){
			log.debug("Json path is not found in json body");
		}
		return value;

	}

	@Override
	protected Object execute(Object arg0) {
		// TODO Auto-generated method stub
		return null;
	}

	
	@Override
	protected void init(ExpressionExecutor[] attributeExpressionExecutors, ExecutionPlanContext executionPlanContext) {
		  if (attributeExpressionExecutors.length < 2) {
	            throw new ExecutionPlanValidationException("this function requires two arguments, " +
	                                                       "but found only " + attributeExpressionExecutors.length);
	        }
		
	}
}