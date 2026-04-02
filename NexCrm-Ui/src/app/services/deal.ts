import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Deal {
  id?: string;
  title: string;
  company?: string;
  value: number;
  stage: string;
  contact?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DealService {
  private apiUrl = environment.apiUrl + '/api/deals';

  constructor(private http: HttpClient) { }

  getDeals(): Observable<Deal[]> {
    return this.http.get<Deal[]>(this.apiUrl);
  }

  getDeal(id: string): Observable<Deal> {
    return this.http.get<Deal>(`${this.apiUrl}/${id}`);
  }

  createDeal(deal: Deal): Observable<Deal> {
    return this.http.post<Deal>(this.apiUrl, deal);
  }

  updateDeal(id: string, deal: Deal): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, deal);
  }

  deleteDeal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
