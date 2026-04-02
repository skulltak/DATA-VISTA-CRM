import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';

export interface SheetData {
  name: string;
  data: any[][];
}

export interface ParsedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  sheets: SheetData[];
}

@Injectable({
  providedIn: 'root'
})
export class FileViewerService {
  private files: ParsedFile[] = [];
  private apiUrl = environment.apiUrl + '/api/voyager';

  constructor(private http: HttpClient) {
    this.refreshFiles().catch(err => console.error('Failed to load files from API', err));
  }

  private async refreshFiles(): Promise<ParsedFile[]> {
    try {
      this.files = await firstValueFrom(this.http.get<ParsedFile[]>(this.apiUrl));
      return this.files;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getFiles(): Promise<ParsedFile[]> {
    if (this.files.length === 0) {
      await this.refreshFiles();
    }
    return this.files;
  }

  async getFile(id: string): Promise<ParsedFile | undefined> {
    const objectFiles = await this.getFiles();
    let file = objectFiles.find(f => f.id === id);
    if (!file || !file.sheets || file.sheets.length === 0) {
      try {
        file = await firstValueFrom(this.http.get<ParsedFile>(`${this.apiUrl}/${id}`));
        const index = this.files.findIndex(f => f.id === id);
        if (index !== -1 && file) {
          this.files[index] = file;
        }
      } catch (e) {
        console.error('Failed to get specific file', e);
      }
    }
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    this.files = this.files.filter(f => f.id !== id);
  }

  async updateFile(file: ParsedFile): Promise<void> {
    await firstValueFrom(this.http.put(`${this.apiUrl}/${file.id}`, file));
    const index = this.files.findIndex(f => f.id === file.id);
    if (index !== -1) {
      this.files[index] = file;
    }
  }

  async uploadFile(file: File): Promise<ParsedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets: SheetData[] = [];
          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
            sheets.push({ name: sheetName, data: sheetData });
          }

          const parsedFile: any = {
            name: file.name,
            size: file.size,
            sheets
          };

          const savedFile = await firstValueFrom(this.http.post<ParsedFile>(this.apiUrl, parsedFile));
          this.files.push(savedFile);
          resolve(savedFile);
        } catch (error) {
          reject('Error parsing or uploading file: ' + error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
}
