import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pivot } from './pivot';

describe('Pivot', () => {
  let component: Pivot;
  let fixture: ComponentFixture<Pivot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pivot],
    }).compileComponents();

    fixture = TestBed.createComponent(Pivot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
