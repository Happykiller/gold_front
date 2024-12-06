// src\service\storage\storage.service.cookie.ts
import { StateStorage } from 'zustand/middleware';

export class StorageServiceCookie implements StateStorage {
  getItem(name: string): string {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }

  setItem(name: string, value: any, options:{ expires?:number, path?:string } = {}): void {
    const { expires = 1, path = '/' } = options;
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}`;
    if (expires) {
      const expirationDate = new Date(Date.now() + expires * 864e5);
      cookieString += `; expires=${expirationDate.toUTCString()}`;
    }
    document.cookie = cookieString;
  }

  removeItem(name: string, path = '/'): void {
    document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
};
