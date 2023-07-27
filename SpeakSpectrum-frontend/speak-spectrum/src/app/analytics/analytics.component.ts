import { Component, OnInit } from '@angular/core';
import { VideoService } from '../video.service';
import { HttpClient } from '@angular/common/http';

interface TextAnalyticsResponse {
  textAnalyticsOutput: any; // Change 'any' to the correct type if possible
}

interface VideoAnalyticsResponse {
  videoAnalyticsOutput: any; // Change 'any' to the correct type if possible
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  videoId: number;
  analyticsOutput: any;

  constructor(private videoService: VideoService, private http: HttpClient) {}

  ngOnInit(): void {
    this.videoId = this.videoService.videoId;
  }

  getTextAnalytics() {
    this.http.get<TextAnalyticsResponse>(`http://localhost:3000/analyzeSentiment/${this.videoId}`, {}).subscribe(
      data => {
        console.log(data)
        this.analyticsOutput = data;
      },
      error => {
        console.error('Error fetching text analytics:', error);
      }
    );
  }

  getVideoAnalytics() {
    this.http.get<VideoAnalyticsResponse>(`http://localhost:3000/analyzeTalkTime/${this.videoId}`, {}).subscribe(
      data => {
        this.analyticsOutput = data.videoAnalyticsOutput;
      },
      error => {
        console.error('Error fetching video analytics:', error);
      }
    );
  }
}
