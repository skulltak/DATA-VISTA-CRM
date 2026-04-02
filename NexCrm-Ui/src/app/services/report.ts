import { Injectable } from '@angular/core';

export interface JopReportRow {
  state: string;
  emptyCount: number; // For empty or "--"
  acceptedCount: number;
  assignedCount: number;
  total: number;
}

export interface JopReportResult {
  data: JopReportRow[];
  jobNames: string[];
  grandTotal: {
    emptyCount: number;
    acceptedCount: number;
    assignedCount: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  generateJopReport(records: any[], selectedJobName?: string): JopReportResult {
    const jobNamesSet = new Set<string>();
    
    // Track data per state
    const groupedData = new Map<string, { empty: number; accepted: number; assigned: number }>();

    let grandEmpty = 0;
    let grandAccepted = 0;
    let grandAssigned = 0;
    let grandTotal = 0;

    for (const record of records) {
      const jobName = (record['JOB_NAME'] || '').toString().trim();
      if (jobName) {
        jobNamesSet.add(jobName);
      }

      // Filter by JOB_NAME if provided
      if (selectedJobName && selectedJobName !== 'All' && jobName !== selectedJobName) {
        continue;
      }

      const state = (record['STATE'] || '').toString().trim();
      // Skip if state is missing
      if (!state) continue;

      let status = (record['TECHNICIAN_ASSIGNMENT_STATUS'] || '').toString().toUpperCase().trim();
      // If status is literal "NULL" string or empty, it counts as empty
      if (status === 'NULL' || status === '--' || !status) {
        status = '';
      }

      if (!groupedData.has(state)) {
        groupedData.set(state, { empty: 0, accepted: 0, assigned: 0 });
      }

      const stateData = groupedData.get(state)!;

      if (status === 'ACCEPTED') {
        stateData.accepted++;
        grandAccepted++;
      } else if (status === 'ASSIGNED') {
        stateData.assigned++;
        grandAssigned++;
      } else {
        // Any other status or empty maps to '--' per rules (or user just wants '--' for empty ones)
        // User said: "If status is empty or "--", map to the "--" column."
        // We will default anything else to '--' column for safety, or simply anything empty/unknown
        stateData.empty++;
        grandEmpty++;
      }
      grandTotal++;
    }

    // Convert map to array and sort alphabetically by State
    const data: JopReportRow[] = [];
    groupedData.forEach((counts, state) => {
      data.push({
        state,
        emptyCount: counts.empty,
        acceptedCount: counts.accepted,
        assignedCount: counts.assigned,
        total: counts.empty + counts.accepted + counts.assigned
      });
    });

    data.sort((a, b) => a.state.localeCompare(b.state));
    
    const jobNames = Array.from(jobNamesSet).sort();

    return {
      data,
      jobNames,
      grandTotal: {
        emptyCount: grandEmpty,
        acceptedCount: grandAccepted,
        assignedCount: grandAssigned,
        total: grandTotal
      }
    };
  }
}
