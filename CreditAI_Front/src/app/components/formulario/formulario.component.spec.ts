import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormularioComponent } from './formulario.component';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiService } from '../../services/api.service';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { NGX_MASK_CONFIG, NgxMaskDirective } from 'ngx-mask';
import { ResultadoAnalise } from '../../models/cliente.model';

@Component({ template: '' })
class DummyComponent {}

describe('FormularioComponent', () => {
  let component: FormularioComponent;
  let fixture: ComponentFixture<FormularioComponent>;
  let router: Router;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockResultadoCompleto: ResultadoAnalise = {
    aprovado: true,
    limiteAprovado: 10000,
    motivosNegacao: [],
    sugestoes: []
  };

  beforeEach(async () => {
    const spyApi = jasmine.createSpyObj('ApiService', ['adicionarCliente', 'analisarCredito']);

    await TestBed.configureTestingModule({
      imports: [
        FormularioComponent,
        DummyComponent,
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'resultado', component: DummyComponent }
        ])
      ],
      providers: [
        { provide: ApiService, useValue: spyApi },
        {
          provide: NGX_MASK_CONFIG,
          useValue: {
            patterns: {
              '0': { pattern: new RegExp('[0-9]') }
            }
          }
        }
      ]
    })
    .overrideComponent(FormularioComponent, {
      remove: { imports: [NgxMaskDirective] },
      add: { imports: [] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should format CPF before sending', fakeAsync(() => {
    const cpfFormatado = '123.456.789-01';
    const cpfLimpo = '12345678901';

    apiService.adicionarCliente.and.returnValue(of({}));
    apiService.analisarCredito.and.returnValue(of(mockResultadoCompleto));

    component.cliente.cpf = cpfFormatado;
    component.onSubmit();
    tick();

    expect(apiService.analisarCredito).toHaveBeenCalledWith(cpfLimpo);
  }));

  it('should navigate to resultado after successful submission', fakeAsync(() => {
    apiService.adicionarCliente.and.returnValue(of({}));
    apiService.analisarCredito.and.returnValue(of(mockResultadoCompleto));

    const navigateSpy = spyOn(router, 'navigate');

    component.cliente = {
      nome: 'Fulano',
      cpf: '12345678901',
      score: 750,
      possuiRestricoesSPC: false,
      rendaMensal: 5000,
      pagamentosEmDia: true,
      historicoPagamentos: {
        percentualEmDia: 1.0,
        atrasos30Dias: 0,
        atrasos60Dias: 0,
        atrasos90Dias: 0
      },
      solicitacao: {
        tipo: 'liberacao',
        valorSolicitado: 2000
      }
    };

    component.onSubmit();
    tick();

    expect(apiService.adicionarCliente).toHaveBeenCalled();
    expect(apiService.analisarCredito).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/resultado'], { state: { resultado: mockResultadoCompleto } });
    expect(component.errorMessage).toBe('');
    expect(component.loading).toBeFalse();
  }));

  it('should show loading during submit', fakeAsync(() => {
    apiService.adicionarCliente.and.returnValue(of({}));
    apiService.analisarCredito.and.returnValue(of(mockResultadoCompleto));
  
    // Act
    component.onSubmit();
  
    // Verifique que o estado 'loading' foi setado para true antes da resposta
    expect(component.loading).toBeTrue();
  
    // Simula o tempo necessário para as requisições assíncronas
    tick();
  
    // Verifique que o estado 'loading' foi alterado para false após a resposta
    expect(component.loading).toBeFalse();
  }));

  it('should handle error when adicionarCliente fails', fakeAsync(() => {
    const errorMsg = 'Erro ao cadastrar';
    apiService.adicionarCliente.and.returnValue(throwError(() => ({
      error: { message: errorMsg }
    })));

    component.onSubmit();
    tick();

    expect(apiService.adicionarCliente).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toContain('Erro ao cadastrar cliente');
    expect(component.errorMessage).toContain(errorMsg);
  }));

  it('should handle error when analisarCredito fails', fakeAsync(() => {
    const errorMsg = 'Erro ao analisar crédito';
    apiService.adicionarCliente.and.returnValue(of({}));
    apiService.analisarCredito.and.returnValue(throwError(() => ({
      error: { message: errorMsg }
    })));

    component.onSubmit();
    tick();

    expect(apiService.analisarCredito).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toContain('Erro ao analisar crédito');
    expect(component.errorMessage).toContain(errorMsg);
  }));

  it('should reset atrasos and set percentual to 1.0 when pagamentosEmDia is true', () => {
    component.cliente.pagamentosEmDia = true;
    component.onPagamentoChange();

    const historico = component.cliente.historicoPagamentos;
    expect(historico.atrasos30Dias).toBe(0);
    expect(historico.atrasos60Dias).toBe(0);
    expect(historico.atrasos90Dias).toBe(0);
    expect(historico.percentualEmDia).toBe(1.0);
  });

  it('should set percentual to 0.5 when pagamentosEmDia is false', () => {
    component.cliente.pagamentosEmDia = false;
    component.onPagamentoChange();

    expect(component.cliente.historicoPagamentos.percentualEmDia).toBe(0.5);
  });
});
