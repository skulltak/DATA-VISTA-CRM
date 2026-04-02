import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PincodeMappingService {
  private prefixMapping: { [key: string]: string } = {
    // North
    '11': 'DELHI',
    '20': 'UP WEST',
    '24': 'UP WEST',
    '25': 'UP WEST',
    '21': 'UP EAST',
    '22': 'UP EAST',
    '23': 'UP EAST',
    '26': 'UP EAST',
    '27': 'UP EAST',
    '28': 'UP EAST',
    '200': 'UTTAR PRADESH', // Generic fallback
    
    // West
    '400': 'MUM_THN',
    '401': 'MUM_THN',
    '411': 'PUNE',
    '412': 'PUNE',
    '41': 'ROM',
    '42': 'ROM',
    '43': 'ROM',
    '44': 'ROM',
    
    // South
    '500': 'HYDERABAD',
    '50': 'RO TEL',
    '51': 'ANDHRA PRADESH',
    '52': 'ANDHRA PRADESH',
    '53': 'ANDHRA PRADESH',
    '560': 'BANGALORE',
    '56': 'RO KAR',
    '57': 'RO KAR',
    '58': 'RO KAR',
    '59': 'RO KAR',
    '600': 'CHENNAI',
    '60': 'RO TN',
    '61': 'RO TN',
    '62': 'RO TN',
    '63': 'RO TN',
    '64': 'RO TN',
    
    // East & Central
    '70': 'WEST BENGAL',
    '71': 'WEST BENGAL',
    '72': 'WEST BENGAL',
    '73': 'WEST BENGAL',
    '74': 'WEST BENGAL',
    '30': 'RAJASTHAN',
    '31': 'RAJASTHAN',
    '32': 'RAJASTHAN',
    '33': 'RAJASTHAN',
    '34': 'RAJASTHAN',
    '45': 'MADHYA PRADESH',
    '46': 'MADHYA PRADESH',
    '47': 'MADHYA PRADESH',
    '48': 'MADHYA PRADESH'
  };

  /**
   * Resolves a branch name from a given pincode using prefix matching.
   */
  resolveBranch(pincode: string | number): string {
    const pc = pincode?.toString().trim();
    if (!pc || pc.length < 2) return '';

    // Check 3-digit prefix first (more specific like Bangalore/Hyderabad)
    const p3 = pc.substring(0, 3);
    if (this.prefixMapping[p3]) return this.prefixMapping[p3];

    // Check 2-digit prefix (state wide)
    const p2 = pc.substring(0, 2);
    if (this.prefixMapping[p2]) return this.prefixMapping[p2];
    
    return `OTHER_${pc}`;
  }

  /**
   * Checks if we can resolve a mapping for this pincode.
   */
  hasMapping(pincode: string | number): boolean {
    const pc = pincode?.toString().trim();
    if (!pc || pc.length < 2) return false;
    return !!(this.prefixMapping[pc.substring(0, 3)] || this.prefixMapping[pc.substring(0, 2)]);
  }
}
