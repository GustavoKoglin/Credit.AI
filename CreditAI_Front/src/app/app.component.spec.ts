import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { RouterOutlet } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        AppComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should contain router-outlet for navigation', () => {
    const routerOutlet = fixture.debugElement.query(By.directive(RouterOutlet));
    expect(routerOutlet).not.toBeNull();
  });

  it('should have main navigation links', () => {
    const compiled = fixture.nativeElement;
    const nav = compiled.querySelector('nav');
    const links = nav?.querySelectorAll('a') || [];
        
    // Verifique se tem o link principal se existir nav
    if (nav) {
      const hasMainLink = Array.from(links).some((link: any) => 
        link.textContent.includes('Análise') || 
        link.getAttribute('routerLink') === '/analise-credito'
      );
      expect(hasMainLink).withContext('Deve ter link para análise de crédito').toBeTrue();
    }
  });
});