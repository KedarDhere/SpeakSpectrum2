// video.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private _videoId: number | null = null;

  get videoId(): number | null {
    return this._videoId;
  }

  set videoId(id: number | null) {
    this._videoId = id;
  }
}
