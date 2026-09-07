import os
import glob
import json
import urllib.request
import base64

GRAFANA_URL = "http://localhost:3000"
AUTH_HEADER = "Basic " + base64.b64encode(b"admin:FutaneAgro@Monitor2026!").decode()
DASHBOARD_DIR = "/home/ubuntu/futane-agro-app/futane-agro-app/monitoring/grafana/dashboards"

def get_all_items():
    url = f"{GRAFANA_URL}/api/search"
    req = urllib.request.Request(url, headers={"Authorization": AUTH_HEADER})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print("Error listing items:", e)
        return []

def delete_item(item):
    uid = item.get('uid')
    item_type = item.get('type')
    if not uid:
        return
    
    if item_type == 'dash-folder':
        url = f"{GRAFANA_URL}/api/folders/{uid}"
    else:
        url = f"{GRAFANA_URL}/api/dashboards/uid/{uid}"
        
    req = urllib.request.Request(url, headers={"Authorization": AUTH_HEADER}, method="DELETE")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Deleted {item_type}: {uid} ({item.get('title')})")
    except Exception as e:
        print(f"Failed to delete {uid}:", e)

def import_dashboard(filepath):
    try:
        with open(filepath, 'r') as f:
            dash_json = json.load(f)
        
        payload = {
            "dashboard": dash_json,
            "overwrite": True
        }
        data = json.dumps(payload).encode('utf-8')
        url = f"{GRAFANA_URL}/api/dashboards/db"
        req = urllib.request.Request(url, data=data, headers={
            "Authorization": AUTH_HEADER,
            "Content-Type": "application/json"
        })
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            print(f"Successfully imported: {dash_json.get('title')} -> {res.get('url')}")
    except Exception as e:
        print(f"Error importing {filepath}:", e)

if __name__ == "__main__":
    print("--- 1. Purging all legacy dashboards and folders from Grafana ---")
    items = get_all_items()
    for item in items:
        delete_item(item)

    print("\n--- 2. Importing Clean 10 Target Enterprise Dashboards ---")
    json_files = sorted(glob.glob(os.path.join(DASHBOARD_DIR, "*.json")))
    for jf in json_files:
        import_dashboard(jf)

    print("\n--- 3. Verification ---")
    final_items = get_all_items()
    print(f"Total Active Items: {len(final_items)}")
    for item in final_items:
        print(f" - [{item.get('uid')}] {item.get('title')}")
