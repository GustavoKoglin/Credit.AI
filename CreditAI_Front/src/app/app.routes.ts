import { Routes } from '@angular/router';
import { FormularioComponent } from './components/formulario/formulario.component';
import { ResultadoComponent } from './components/resultado/resultado.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'analise-credito'
  },
  {
    path: 'analise-credito',
    component: FormularioComponent,
    title: 'Análise de Crédito'
  },
  {
    path: 'resultado',
    component: ResultadoComponent,
    title: 'Resultado da Análise'
  },
  {
    path: '**',
    redirectTo: 'analise-credito'
  }
];