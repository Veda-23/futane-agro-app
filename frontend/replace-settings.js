const fs=require('fs'); 
let c=fs.readFileSync('src/app/app.component.html', 'utf8'); 
const start='      <!-- 23. Super Admin & Settings Tab -->'; 
const end='<!-- Invoice Modal Overlay (Frosted UI View) -->'; 
const i1=c.indexOf(start); 
const i2=c.indexOf(end); 
if(i1>-1 && i2>-1) { 
  let replacement = '      <!-- 23. Super Admin & Settings Tab -->\n      <app-settings *ngIf="activeTab === \'settings\'" [currentLang]="currentLang" [activeTab]="activeTab" [loggedInUser]="loggedInUser" [usersList]="usersList" [settingsList]="settingsList" [backupsList]="backupsList" [isUat]="isUat" [isDarkMode]="isDarkMode" (toggleTheme)="toggleDarkMode($event)" (reloadData)="loadAllData()"></app-settings>\n\n    </div>\n  </main>\n</div>\n\n'; 
  let newC = c.substring(0, i1) + replacement + c.substring(i2); 
  fs.writeFileSync('src/app/app.component.html', newC); 
  console.log('Replaced successfully'); 
} else { 
  console.log('Markers not found', i1, i2); 
}
