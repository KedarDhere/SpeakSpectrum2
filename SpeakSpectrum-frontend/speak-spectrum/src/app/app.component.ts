import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  ngOnInit() {
    this.showTab('transcript'); // Show the "transcript" tab by default on page load
  }

  activeTab = 'transcript'; // by default

  // The function for showing tab content
  showTab(tabId: string) {
    this.activeTab = tabId;
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(tabId)?.classList.add('active');
  }

  // Other functions like uploadVideo(), getTextAnalytics(), getVideoAnalytics() will be included here later.

}
