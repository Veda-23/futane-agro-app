$path = "c:\Users\Vedant\.gemini\antigravity-ide\scratch\futane-agro-app\frontend\src\app\components\features"
Get-ChildItem -Path $path -Recurse -Filter "*.component.html" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'class="glass-panel form-card" style="grid-column: span 1; padding: 20px;"', 'class="glass-card form-card" style="grid-column: span 1;"'
    $newContent = $newContent -replace 'class="glass-panel table-card" \[style.grid-column\]="isViewer\(\) \? ''span 3'' : ''span 2''" style="padding: 20px;"', 'class="glass-card table-card" [style.grid-column]="isViewer() ? ''span 3'' : ''span 2''"'
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($_.Name)"
    }
}
