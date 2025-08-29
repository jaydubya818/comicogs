#!/usr/bin/env tsx

import axios, { AxiosResponse } from 'axios';
import { logger } from '../middleware/logger.js';
import { goldenQueries, type GoldenQuery } from './goldenDataset.js';

interface TestResult {
  query: GoldenQuery;
  passed: boolean;
  actualStatus: number;
  responseTime: number;
  errors: string[];
  response?: any;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  avgResponseTime: number;
  results: TestResult[];
}

class APIAssertionRunner {
  private baseUrl: string;
  private authToken?: string;
  private adminToken?: string;

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.baseUrl = baseUrl;
  }

  async authenticate() {
    try {
      // Login as regular user
      const userResponse = await axios.post(`${this.baseUrl}/api/auth/login`, {
        email: 'user@comicogs.com',
        password: 'user123'
      });
      this.authToken = userResponse.data.token;

      // Login as admin
      const adminResponse = await axios.post(`${this.baseUrl}/api/auth/login`, {
        email: 'admin@comicogs.com', 
        password: 'admin123'
      });
      this.adminToken = adminResponse.data.token;

      logger.info('Authentication successful');
    } catch (error: any) {
      logger.warn('Authentication failed, some tests may be skipped');
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private getAuthHeaders(query: GoldenQuery): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Determine which token to use based on endpoint
    if (query.endpoint.includes('/admin/') && this.adminToken) {
      headers.Authorization = `Bearer ${this.adminToken}`;
    } else if (
      (query.endpoint.includes('/collection') || 
       query.endpoint.includes('/saved-searches') ||
       query.endpoint.includes('/export') ||
       query.endpoint.includes('/import') ||
       query.endpoint.includes('/uploads') ||
       query.endpoint.includes('/checkout')) && 
      this.authToken
    ) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async makeRequest(query: GoldenQuery): Promise<{ response: AxiosResponse; responseTime: number }> {
    const startTime = Date.now();
    const url = this.buildUrl(query.endpoint, query.params);
    const headers = this.getAuthHeaders(query);

    let response: AxiosResponse;
    
    try {
      switch (query.method) {
        case 'GET':
          response = await axios.get(url, { headers, validateStatus: () => true });
          break;
        case 'POST':
          response = await axios.post(url, query.body, { headers, validateStatus: () => true });
          break;
        case 'PUT':
          response = await axios.put(url, query.body, { headers, validateStatus: () => true });
          break;
        case 'DELETE':
          response = await axios.delete(url, { headers, validateStatus: () => true });
          break;
        default:
          throw new Error(`Unsupported method: ${query.method}`);
      }
    } catch (error: any) {
      // Handle network errors
      response = {
        status: 0,
        statusText: 'Network Error',
        data: { error: error.message },
        headers: {},
        config: {} as any,
        request: {}
      } as AxiosResponse;
    }

    const responseTime = Date.now() - startTime;
    return { response, responseTime };
  }

  private validateAssertion(assertion: GoldenQuery['assertions'][0], data: any): boolean {
    const { field, type, value } = assertion;
    
    // Get field value using dot notation
    const fieldValue = this.getNestedValue(data, field);

    switch (type) {
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      
      case 'equals':
        return fieldValue === value;
      
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(value);
      
      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > value;
      
      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < value;
      
      case 'length':
        if (Array.isArray(fieldValue)) {
          if (typeof value === 'string' && value.startsWith('gt:')) {
            return fieldValue.length > parseInt(value.split(':')[1]);
          }
          if (typeof value === 'string' && value.startsWith('lt:')) {
            return fieldValue.length < parseInt(value.split(':')[1]);
          }
          return fieldValue.length === value;
        }
        return false;
      
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (key.includes('[') && key.includes(']')) {
        const [arrayKey, indexStr] = key.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        return current?.[arrayKey]?.[index];
      }
      return current?.[key];
    }, obj);
  }

  private shouldSkipQuery(query: GoldenQuery): string | null {
    // Skip auth-required queries if no token
    if (query.endpoint.includes('/admin/') && !this.adminToken) {
      return 'No admin token available';
    }
    
    if ((query.endpoint.includes('/collection') || 
         query.endpoint.includes('/saved-searches') ||
         query.endpoint.includes('/export') ||
         query.endpoint.includes('/import') ||
         query.endpoint.includes('/uploads') ||
         query.endpoint.includes('/checkout')) && 
        !this.authToken) {
      return 'No user token available';
    }

    // Skip specific queries that might need special setup
    if (query.id === 'auth_register') {
      return 'Registration test requires cleanup';
    }

    if (query.id === 'import_collection_csv') {
      return 'Import test requires file upload setup';
    }

    return null;
  }

  async runQuery(query: GoldenQuery): Promise<TestResult> {
    const skipReason = this.shouldSkipQuery(query);
    if (skipReason) {
      return {
        query,
        passed: false,
        actualStatus: -1,
        responseTime: 0,
        errors: [`Skipped: ${skipReason}`]
      };
    }

    try {
      const { response, responseTime } = await this.makeRequest(query);
      const errors: string[] = [];

      // Check status code
      if (response.status !== query.expectedStatus) {
        errors.push(`Expected status ${query.expectedStatus}, got ${response.status}`);
      }

      // Run assertions
      for (const assertion of query.assertions) {
        try {
          const passed = this.validateAssertion(assertion, response.data);
          if (!passed) {
            errors.push(`Assertion failed: ${assertion.field} ${assertion.type} ${assertion.value || ''}`);
          }
        } catch (error: any) {
          errors.push(`Assertion error: ${error.message}`);
        }
      }

      return {
        query,
        passed: errors.length === 0,
        actualStatus: response.status,
        responseTime,
        errors,
        response: response.data
      };
    } catch (error: any) {
      return {
        query,
        passed: false,
        actualStatus: 0,
        responseTime: 0,
        errors: [`Request failed: ${error.message}`]
      };
    }
  }

  async runAllQueries(): Promise<TestSummary> {
    logger.info('Starting API assertion tests...');
    
    const results: TestResult[] = [];
    let totalResponseTime = 0;

    for (const query of goldenQueries) {
      logger.info({ queryId: query.id }, `Running query: ${query.name}`);
      
      const result = await this.runQuery(query);
      results.push(result);
      totalResponseTime += result.responseTime;

      // Log result
      if (result.passed) {
        logger.info({ 
          queryId: query.id, 
          responseTime: result.responseTime,
          status: result.actualStatus
        }, '✅ Passed');
      } else if (result.actualStatus === -1) {
        logger.warn({ queryId: query.id }, '⏭️  Skipped');
      } else {
        logger.error({ 
          queryId: query.id, 
          errors: result.errors,
          status: result.actualStatus
        }, '❌ Failed');
      }
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed && r.actualStatus !== -1).length;
    const skipped = results.filter(r => r.actualStatus === -1).length;

    const summary: TestSummary = {
      total: results.length,
      passed,
      failed,
      skipped,
      avgResponseTime: totalResponseTime / results.length,
      results
    };

    return summary;
  }

  generateReport(summary: TestSummary): string {
    const passRate = (summary.passed / (summary.total - summary.skipped)) * 100;
    
    let report = '\n🧪 API Assertion Test Report\n';
    report += '=' .repeat(50) + '\n';
    report += `📊 Summary:\n`;
    report += `  Total Queries: ${summary.total}\n`;
    report += `  ✅ Passed: ${summary.passed}\n`;
    report += `  ❌ Failed: ${summary.failed}\n`;
    report += `  ⏭️  Skipped: ${summary.skipped}\n`;
    report += `  📈 Pass Rate: ${passRate.toFixed(1)}%\n`;
    report += `  ⏱️  Avg Response Time: ${summary.avgResponseTime.toFixed(0)}ms\n\n`;

    if (summary.failed > 0) {
      report += '❌ Failed Tests:\n';
      summary.results
        .filter(r => !r.passed && r.actualStatus !== -1)
        .forEach(result => {
          report += `  • ${result.query.id}: ${result.query.name}\n`;
          result.errors.forEach(error => {
            report += `    - ${error}\n`;
          });
        });
      report += '\n';
    }

    if (summary.skipped > 0) {
      report += '⏭️  Skipped Tests:\n';
      summary.results
        .filter(r => r.actualStatus === -1)
        .forEach(result => {
          report += `  • ${result.query.id}: ${result.errors[0]}\n`;
        });
      report += '\n';
    }

    // Performance insights
    const slowQueries = summary.results
      .filter(r => r.responseTime > 1000)
      .sort((a, b) => b.responseTime - a.responseTime);
    
    if (slowQueries.length > 0) {
      report += '🐌 Slow Queries (>1s):\n';
      slowQueries.forEach(result => {
        report += `  • ${result.query.id}: ${result.responseTime}ms\n`;
      });
      report += '\n';
    }

    return report;
  }
}

// Main execution
async function main() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  const runner = new APIAssertionRunner(baseUrl);

  try {
    // Authenticate for protected endpoints
    await runner.authenticate();

    // Run all tests
    const summary = await runner.runAllQueries();

    // Generate and display report
    const report = runner.generateReport(summary);
    console.log(report);

    // Save detailed results
    const fs = await import('fs/promises');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = `api-test-results-${timestamp}.json`;
    
    await fs.writeFile(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      baseUrl,
      summary,
      goldenQueries
    }, null, 2));

    logger.info({ resultsPath }, 'Detailed results saved');

    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Test runner failed');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { APIAssertionRunner, type TestResult, type TestSummary };
