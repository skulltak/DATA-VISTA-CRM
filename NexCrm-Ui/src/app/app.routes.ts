import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './views/dashboard/dashboard';
import { ContactsComponent } from './views/contacts/contacts';
import { DealsComponent } from './views/deals/deals';
import { ImportComponent } from './views/import/import';
import { RawDataComponent } from './views/raw-data/raw-data';
import { PivotComponent } from './views/pivot/pivot';
import { JopReportComponent } from './views/jop-report/jop-report';
import { FileViewerComponent } from './views/file-viewer/file-viewer';
import { FDSSComponent } from './views/fdss/fdss';
import { LoginComponent } from './views/login/login';
import { RegisterComponent } from './views/register/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'contacts', component: ContactsComponent },
      { path: 'deals', component: DealsComponent },
      { path: 'import', component: ImportComponent },
      { path: 'raw-data', component: RawDataComponent },
      { path: 'pivot', component: PivotComponent },
      { path: 'jop-report', component: JopReportComponent },
      { path: 'file-viewer', component: FileViewerComponent },
      { path: 'fdss', component: FDSSComponent },
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
