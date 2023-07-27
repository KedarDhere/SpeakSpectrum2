import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VideoService } from '../video.service';

@Component({
  selector: 'app-transcript',
  templateUrl: './transcript.component.html',
  styleUrls: ['./transcript.component.css']
})
  
export class TranscriptComponent {
  selectedFile: File;
  transcript: string = ""; // You might need to declare this property if not already done.

  constructor(private http: HttpClient, private videoService: VideoService) {}

  onFileChange(event) {
    this.selectedFile = event.target.files[0];
}

  submitVideo() {
    const formData = new FormData();
    // formData.append('video', this.selectedFile);
    if (this.selectedFile) {
      formData.append('video', this.selectedFile);
  } 
  
    this.http.post<any>('http://localhost:3000/uploadVideo', formData).subscribe(
      response => {
        const videoId = response.videoId;
        this.videoService.videoId = videoId;
        this.http.get<any>(`http://localhost:3000/getTranscript/${videoId}`, {}).subscribe(
          data => {
            let result = JSON.parse(data.privJson)
            console.log(result)
            console.log(result.DisplayText)
            this.transcript = result.DisplayText;
          }
        );
      }
    );
  }
}
