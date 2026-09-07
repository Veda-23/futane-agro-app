$dashboardsDir = "C:\Users\Vedant\.gemini\antigravity-ide\scratch\futane-agro-app\grafana_dashboards_clean"
$files = Get-ChildItem -Path $dashboardsDir -Filter "*.json"

Write-Host "Transforming $($files.Count) dashboards to solid background reference styling..." -ForegroundColor Cyan

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
    
    $content.refresh = "5s"
    $content.timezone = "browser"
    $content.time = @{ from = "now-6h"; to = "now" }
    
    foreach ($panel in $content.panels) {
        if ($panel.type -eq "stat") {
            if (-not $panel.options) { $panel.options = @{} }
            $panel.options.colorMode = "background"
            $panel.options.justifyMode = "center"
            $panel.options.textMode = "auto"
            
            if ($panel.fieldConfig -and $panel.fieldConfig.defaults) {
                if ($panel.fieldConfig.defaults.color -and $panel.fieldConfig.defaults.color.fixedColor) {
                    $c = $panel.fieldConfig.defaults.color.fixedColor
                    if ($c -eq "#10b981" -or $c -eq "#22c55e" -or $c -eq "green") {
                        $panel.fieldConfig.defaults.color.fixedColor = "#299c46"
                    } elseif ($c -eq "#ef4444" -or $c -eq "#dc2626" -or $c -eq "red") {
                        $panel.fieldConfig.defaults.color.fixedColor = "#e02f44"
                    }
                }
                
                if ($panel.fieldConfig.defaults.thresholds -and $panel.fieldConfig.defaults.thresholds.steps) {
                    foreach ($step in $panel.fieldConfig.defaults.thresholds.steps) {
                        if ($step.color -eq "#10b981" -or $step.color -eq "#22c55e" -or $step.color -eq "green" -or $step.color -eq "semi-dark-green") {
                            $step.color = "#299c46"
                        } elseif ($step.color -eq "#ef4444" -or $step.color -eq "#dc2626" -or $step.color -eq "red") {
                            $step.color = "#e02f44"
                        } elseif ($step.color -eq "#f59e0b" -or $step.color -eq "#eab308" -or $step.color -eq "yellow" -or $step.color -eq "orange") {
                            $step.color = "#e0b400"
                        }
                    }
                }
            }
        } elseif ($panel.type -eq "timeseries") {
            if ($panel.fieldConfig -and $panel.fieldConfig.defaults) {
                if (-not $panel.fieldConfig.defaults.custom) { $panel.fieldConfig.defaults.custom = @{} }
                $panel.fieldConfig.defaults.custom.drawStyle = "line"
                $panel.fieldConfig.defaults.custom.lineInterpolation = "smooth"
                $panel.fieldConfig.defaults.custom.lineWidth = 2
                $panel.fieldConfig.defaults.custom.fillOpacity = 15
                $panel.fieldConfig.defaults.custom.gradientMode = "opacity"
                $panel.fieldConfig.defaults.custom.showPoints = "never"
            }
        }
    }
    
    $content | ConvertTo-Json -Depth 50 | Set-Content -Path $file.FullName -Encoding UTF8
    Write-Host "  [PASS] Standardized: $($file.Name)" -ForegroundColor Green
}

Write-Host "All dashboards updated successfully!" -ForegroundColor Cyan
