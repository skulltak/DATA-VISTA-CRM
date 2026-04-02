import { TestBed } from '@angular/core/testing';

import { Deal } from './deal';

describe('Deal', () => {
  let service: Deal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Deal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
