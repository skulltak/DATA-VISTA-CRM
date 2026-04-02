import { TestBed } from '@angular/core/testing';

import { Pivot } from './pivot';

describe('Pivot', () => {
  let service: Pivot;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pivot);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
