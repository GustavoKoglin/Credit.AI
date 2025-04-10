/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CreditoService } from './credito.service';

describe('Service: Credito', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CreditoService]
    });
  });

  it('should ...', inject([CreditoService], (service: CreditoService) => {
    expect(service).toBeTruthy();
  }));
});
