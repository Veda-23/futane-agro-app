const fs=require('fs'); 
let c=fs.readFileSync('src/app/app.component.html', 'utf8'); 
const start='      <!-- 22. Billing Hub Tab -->'; 
const end='      <!-- 23. Super Admin & Settings Tab -->'; 
const i1=c.indexOf(start); 
const i2=c.indexOf(end); 
if(i1>-1 && i2>-1) { 
  c = c.slice(0, i1) + '      <!-- 22. Billing Hub Tab -->\n      <app-billing-hub *ngIf="activeTab === \'billinghub\'" [currentLang]="currentLang" [activeTab]="activeTab" [loggedInUser]="loggedInUser" [salesList]="salesList" [dispatchesList]="dispatchesList" [paymentsList]="paymentsList" [rawMaterialsList]="rawMaterialsList" [transportsList]="transportsList" [salariesList]="salariesList"></app-billing-hub>\n\n' + c.slice(i2); 
  fs.writeFileSync('src/app/app.component.html', c); 
  console.log('Replaced successfully'); 
} else { 
  console.log('Could not find markers', i1, i2); 
}
