import { Injectable } from '@angular/core';
import { PincodeMappingService } from './pincode-mapping';

export interface PivotRow {
  state: string;
  COMPLETED: number;
  CANCELLED: number;
  FULFILLMENT_HOLD: number;
  NOT_SERVICED: number;
  TOTAL: number;
  PERCENTAGE: number;
  DAY_END: number;
  DIFFERENCE: number;
  [key: string]: any; 
}

export interface PivotTableData {
  headers: string[]; 
  rows: PivotRow[]; 
  grandTotal: any; 
}

export interface TriplePivotResult {
  summary: PivotTableData;
  jobNames: string[];
  rowLabel: string;
}

@Injectable({
  providedIn: 'root'
})
export class PivotEngineService {
  constructor(private pincodeMapping: PincodeMappingService) {}

  generatePivots(records: any[], jobFilter: string = 'All', categoryFilter: 'ALL' | 'TVLA' | 'AC' = 'ALL'): TriplePivotResult | null {
    if (!records || records.length === 0) return null;

    const sampleRecord = records[0];
    if (!sampleRecord || Object.keys(sampleRecord).length === 0) return null;
    
    const jobNamesSet = new Set<string>();
    const globalMap = new Map<string, any>(); 
    let usedPincode = false;

    // Single fully-optimized pass over array
    records.reduce((acc, row) => {
      // Job Name extraction
      const jobNameRaw = (row['JOB_NAME'] || row['JOB NAME'] || '').toString().trim();
      const jobName = jobNameRaw === 'NULL' || jobNameRaw === 'nan' ? '' : jobNameRaw;
      if (jobName) jobNamesSet.add(jobName);

      // Category Detection
      const isAcJob = jobName.toUpperCase().includes('AC') || 
                      jobName.toUpperCase().includes('AIR CON') || 
                      jobName.toUpperCase().includes('AIRCONDITIONER');

      // Category Filtering
      if (categoryFilter === 'TVLA' && isAcJob) return acc;
      if (categoryFilter === 'AC' && !isAcJob) return acc;

      // Primary Job Filter (Specific Job Name)
      if (jobFilter !== 'All' && jobName !== jobFilter) return acc;

      // State Priority
      let state = (row['STATE'] || row['REGION'] || row['BRANCH'] || row['LOCATION'] || row['CITY'] || '').toString().toUpperCase().trim();
      
      if (!state) {
        let pincode = row['PICODE'] || row['PINCODE'] || row['PIN_CODE'] || row['PIN_CODE'] ||
                      row['ZIPCODE'] || row['ZIP_CODE'] || row['POSTAL_CODE'] || row['POSTAL CODE'] ||
                      row['PIN'] || row['PIN CODE'] || row['POSTAL'] || row['ZIP'];
        
        if (!pincode) {
          const allValues = Object.values(row);
          for (const val of allValues) {
             const strVal = (val || '').toString().trim();
             if (/^\d{6}$/.test(strVal) && this.pincodeMapping.hasMapping(strVal)) {
               pincode = strVal;
               break;
             }
          }
        }

        if (pincode) {
           state = this.pincodeMapping.resolveBranch(pincode);
           usedPincode = true;
        }
      }

      if (!state) return acc;

      // Priority order for finding the status column
      let statusRaw = '';
      const statusCheckPriority = [
        'STATS', 'JOB_STATUS', 'TECHNICIAN_ASSIGNMENT_STATUS', 
        'STATUS', 'STAT', 'JOB STATUS', 'JOB_STATE', 'FINAL_STATUS', 'WORK_STATUS'
      ];
      for (const key of statusCheckPriority) {
        if (row[key]) {
          statusRaw = row[key].toString().toUpperCase();
          break;
        }
      }

      if (!statusRaw) {
        const allKeys = Object.keys(row);
        for (const key of allKeys) {
          const keyUpper = key.toUpperCase();
          if (keyUpper.includes('STATUS') || keyUpper.includes('STAT') || keyUpper.includes('STATE')) {
            statusRaw = (row[key] || '').toString().toUpperCase();
            if (statusRaw) break;
          }
        }
      }

      statusRaw = statusRaw.replace(/\s+/g, '_').trim();

      if (!globalMap.has(state)) {
        globalMap.set(state, {
          COMPLETED: 0, CANCELLED: 0, FULFILLMENT_HOLD: 0, NOT_SERVICED: 0, 
          TOTAL: 0, DAY_END_TARGET: 0 
        });
      }
      
      const gStateObj = globalMap.get(state);
      gStateObj.TOTAL++;

      // HARDENED STATUS MAPPING (Restored Priority)
      const isCompleted = statusRaw.includes('COMPLETED') || 
                          statusRaw === 'COMP' || 
                          statusRaw.includes('SUCCESS') || 
                          statusRaw.includes('FULFILLED') ||
                          statusRaw.includes('DELIVERED') ||
                          statusRaw.includes('DONE') ||
                          statusRaw.includes('FINISHED') ||
                          statusRaw.includes('CLOSED') ||
                          statusRaw === 'PICKED_UP' ||
                          statusRaw === 'PICKED';

      const isCancelled = statusRaw.includes('CANCELLED') || 
                          statusRaw.includes('CANCELED') || 
                          statusRaw.includes('REJECTED') ||
                          statusRaw.includes('ABORTED') ||
                          statusRaw.includes('DECLINED');

      const isNotServiced = statusRaw.includes('NOT_SERVICED') || 
                            statusRaw.includes('NOT_SERVICE') || 
                            statusRaw.includes('UNSUCCESSFUL') ||
                            statusRaw.includes('CANNOT_REACH') ||
                            statusRaw.includes('FAILED');

      if (isNotServiced) {
        gStateObj.NOT_SERVICED++;
      } else if (isCancelled) {
        gStateObj.CANCELLED++;
      } else if (isCompleted) {
        gStateObj.COMPLETED++;
      } else {
        if (statusRaw.includes('HOLD') || 
            statusRaw.includes('PENDING') || 
            statusRaw.includes('RE-SCHEDULED') ||
            statusRaw.includes('RESCHEDULED') ||
            statusRaw.includes('FULFILLMENT') || 
            statusRaw.includes('WAITING') ||
            statusRaw.includes('DELAYED')) {
          gStateObj.FULFILLMENT_HOLD++;
        }
      }

      // EXHAUSTIVE DAY END / TARGET DETECTION
      let dayEndVal = 0;
      const allKeys = Object.keys(row);
      for (const key of allKeys) {
        const keyUpper = key.toUpperCase();
        if (keyUpper.includes('DAY_END') || keyUpper.includes('DAY END') || keyUpper.includes('TARGET')) {
          const val = parseFloat(row[key]);
          if (!isNaN(val) && val > 0) {
            dayEndVal = val;
            break;
          }
        }
      }
      if (dayEndVal > 0) {
        gStateObj.DAY_END_TARGET = Math.max(gStateObj.DAY_END_TARGET, dayEndVal);
      }

      return acc;
    }, null);

    // Assembly function for the new unified table
    const headers = ['CANCELLED', 'COMPLETED', 'FULFILLMENT_HOLD', 'NOT_SERVICED'];
    const rows: PivotRow[] = [];
    const grandTotal: any = { 
      COMPLETED: 0, CANCELLED: 0, FULFILLMENT_HOLD: 0, NOT_SERVICED: 0, 
      TOTAL: 0, DAY_END: 0 
    };

    globalMap.forEach((data, state) => {
      const dayEnd = data.DAY_END_TARGET || data.TOTAL;
      
      const rowObj: PivotRow = {
        state,
        COMPLETED: data.COMPLETED,
        CANCELLED: data.CANCELLED,
        FULFILLMENT_HOLD: data.FULFILLMENT_HOLD,
        NOT_SERVICED: data.NOT_SERVICED,
        TOTAL: data.TOTAL,
        PERCENTAGE: data.TOTAL > 0 ? Math.round((data.COMPLETED / data.TOTAL) * 100) : 0,
        DAY_END: dayEnd,
        DIFFERENCE: data.COMPLETED - dayEnd
      };

      grandTotal.COMPLETED += data.COMPLETED;
      grandTotal.CANCELLED += data.CANCELLED;
      grandTotal.FULFILLMENT_HOLD += data.FULFILLMENT_HOLD;
      grandTotal.NOT_SERVICED += data.NOT_SERVICED;
      grandTotal.TOTAL += data.TOTAL;
      grandTotal.DAY_END += dayEnd;

      rows.push(rowObj);
    });

    grandTotal.PERCENTAGE = grandTotal.TOTAL > 0 ? Math.round((grandTotal.COMPLETED / grandTotal.TOTAL) * 100) : 0;
    grandTotal.DIFFERENCE = grandTotal.COMPLETED - grandTotal.DAY_END;

    rows.sort((a, b) => a.state.localeCompare(b.state));

    return {
      summary: { headers, rows, grandTotal },
      jobNames: Array.from(jobNamesSet).sort(),
      rowLabel: usedPincode ? 'BRANCH' : 'STATE'
    };
  }
}
