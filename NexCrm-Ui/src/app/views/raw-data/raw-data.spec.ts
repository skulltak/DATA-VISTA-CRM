import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawData } from './raw-data';

describe('RawData', () => {
  let component: RawData;
  let fixture: ComponentFixture<RawData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RawData],
    }).compileComponents();

    fixture = TestBed.createComponent(RawData);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
