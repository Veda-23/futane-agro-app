import json
import glob
import os
import urllib.request
import base64

dashboards_dir = r"C:\Users\Vedant\.gemini\antigravity-ide\scratch\futane-agro-app\grafana_dashboards_clean"
files = glob.glob(os.path.join(dashboards_dir, "*.json"))

print(f"Transforming {len(files)} dashboard files to exact reference image styling...")

for filepath in files:
    filename = os.path.basename(filepath)
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Standardize header & refresh
    data["refresh"] = "5s"
    data["timezone"] = "browser"
    data["time"] = {"from": "now-6h", "to": "now"}
    
    panels = data.get("panels", [])
    for panel in panels:
        p_type = panel.get("type", "")
        
        # Format Stat Panels with Solid Background Colors
        if p_type == "stat":
            options = panel.setdefault("options", {})
            options["colorMode"] = "background"
            options["justifyMode"] = "center"
            options["textMode"] = "auto"
            
            field_config = panel.setdefault("fieldConfig", {}).setdefault("defaults", {})
            
            # Ensure high-contrast colors
            color_cfg = field_config.get("color", {})
            if color_cfg.get("fixedColor") in ["#10b981", "#22c55e", "green"]:
                color_cfg["fixedColor"] = "#299c46"
            elif color_cfg.get("fixedColor") in ["#ef4444", "#dc2626", "red"]:
                color_cfg["fixedColor"] = "#e02f44"
                
            thresholds = field_config.get("thresholds", {})
            steps = thresholds.get("steps", [])
            for step in steps:
                if step.get("color") in ["#10b981", "#22c55e", "green", "semi-dark-green"]:
                    step["color"] = "#299c46"
                elif step.get("color") in ["#ef4444", "#dc2626", "red"]:
                    step["color"] = "#e02f44"
                elif step.get("color") in ["#f59e0b", "#eab308", "yellow", "orange"]:
                    step["color"] = "#e0b400"
        
        # Format Timeseries Panels with Sleek Smooth Curves
        elif p_type == "timeseries":
            field_config = panel.setdefault("fieldConfig", {}).setdefault("defaults", {})
            custom = field_config.setdefault("custom", {})
            custom["drawStyle"] = "line"
            custom["lineInterpolation"] = "smooth"
            custom["lineWidth"] = 2
            custom["fillOpacity"] = 15
            custom["gradientMode"] = "opacity"
            custom["showPoints"] = "never"
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"  🟢 Standardized: {filename}")

print("All 10 dashboard files updated with exact reference styling!")
