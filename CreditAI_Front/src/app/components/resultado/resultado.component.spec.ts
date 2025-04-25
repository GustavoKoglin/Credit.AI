import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultadoComponent } from './resultado.component';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ResultadoAnalise } from '../../models/cliente.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormularioComponent } from '../formulario/formulario.component';
import { NGX_MASK_CONFIG } from 'ngx-mask';

describe('ResultadoComponent', () => {
  let component: ResultadoComponent;
  let fixture: ComponentFixture<ResultadoComponent>;
  let router: Router;

  const mockResultadoAprovado: ResultadoAnalise = {
    aprovado: true,
    limiteAprovado: 10000,
    motivosNegacao: [],
    sugestoes: []
  };

  const mockResultadoNegado: ResultadoAnalise = {
    aprovado: false,
    motivosNegacao: ['Score baixo', 'Restrições no SPC'],
    sugestoes: ['Melhorar score', 'Regularizar nome']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ResultadoComponent,
        RouterTestingModule.withRoutes([
          { path: 'analise-credito', component: FormularioComponent }
        ]),
        CommonModule,
        FormsModule
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  function setupComponent(resultado?: ResultadoAnalise) {
    // Navigate with mock state if provided
    if (resultado) {
      router.navigate(['/resultado'], { state: { resultado } });
    }

    fixture = TestBed.createComponent(ResultadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create and display approved result', () => {
    setupComponent(mockResultadoAprovado);
    
    expect(component).toBeTruthy();
    expect(component.resultado).toEqual(mockResultadoAprovado);
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.resultado__status').textContent).toContain('Crédito Aprovado!');
    expect(compiled.querySelector('.resultado__limite').textContent).toContain('10,000');
  });

  it('should create and display denied result', () => {
    setupComponent(mockResultadoNegado);
    
    expect(component).toBeTruthy();
    expect(component.resultado).toEqual(mockResultadoNegado);
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.resultado__status').textContent).toContain('Crédito Não Aprovado');
    expect(compiled.querySelectorAll('.resultado__item').length).toBe(4); // 2 motivos + 2 sugestões
  });

  it('should redirect to form if no result data', () => {
    const navigateSpy = spyOn(router, 'navigate');
    setupComponent(); // No result provided
    
    expect(navigateSpy).toHaveBeenCalledWith(['/analise-credito']);
  });

  it('should format currency correctly', () => {
    setupComponent(mockResultadoAprovado);
    
    expect(component.formatarMoeda(1000)).toMatch(/R\$\s*1\.000,00/);
    expect(component.formatarMoeda(2500.5)).toMatch(/R\$\s*2\.500,50/);
    expect(component.formatarMoeda(undefined)).toBe('R$ 0,00');
  });

  it('should navigate back to form when voltarParaAnalise is called', () => {
    setupComponent(mockResultadoAprovado);
    const navigateSpy = spyOn(router, 'navigate');
    
    component.voltarParaAnalise();
    expect(navigateSpy).toHaveBeenCalledWith(['/analise-credito']);
  });

  it('should display correct elements for approved result', () => {
    setupComponent(mockResultadoAprovado);
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('.resultado__icon--success')).toBeTruthy();
    expect(compiled.querySelector('.resultado__parabens')).toBeTruthy();
    expect(compiled.querySelector('.resultado__motivos')).toBeFalsy();
  });

  it('should display correct elements for denied result', () => {
    setupComponent(mockResultadoNegado);
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('.resultado__icon--error')).toBeTruthy();
    expect(compiled.querySelector('.resultado__motivos')).toBeTruthy();
    expect(compiled.querySelector('.resultado__sugestoes')).toBeTruthy();
    expect(compiled.querySelector('.resultado__parabens')).toBeFalsy();
  });
});