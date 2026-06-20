import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = environment.apiUrl + '/api/SalesUpload';

  constructor(private http: HttpClient) { }

  uploadSalesData(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/sales-data`, formData);
  }
}
