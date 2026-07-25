import urllib.request
import json

BASE_URL = "http://localhost:8080/api"

def run_tests():
    print("=========================================================")
    print("FUTANE AGRO ERP PRODUCTION SYSTEM VERIFICATION")
    print("=========================================================")
    
    # 1. Auth Login Test
    auth_url = f"{BASE_URL}/users/login"
    auth_data = json.dumps({"username": "ADMIN", "password": "admin123"}).encode()
    req = urllib.request.Request(auth_url, data=auth_data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            otp = res.get("tempOtp")
            username = res.get("username", "ADMIN")
            print(f"1. Auth Step 1: PASS (OTP received for {username})")
            
            verify_url = f"{BASE_URL}/users/login/verify"
            verify_data = json.dumps({"username": username, "otp": otp}).encode()
            req_v = urllib.request.Request(verify_url, data=verify_data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req_v) as resp_v:
                res_v = json.loads(resp_v.read().decode())
                token = res_v.get("token")
                print(f"2. Auth Step 2: PASS (JWT Token issued)")
                
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                # 3. Test Modules GET endpoints
                modules = [
                    ("/parties", "Parties Registry"),
                    ("/sales", "Sales Orders"),
                    ("/inventory", "Inventory Records"),
                    ("/raw-materials", "Raw Materials"),
                    ("/employees", "HR Employees"),
                    ("/transports", "Transport Logistics"),
                    ("/expenses", "Financial Expenses"),
                    ("/bank-transactions", "Bank Transactions")
                ]
                
                for path, name in modules:
                    m_req = urllib.request.Request(f"{BASE_URL}{path}", headers=headers)
                    try:
                        with urllib.request.urlopen(m_req) as m_resp:
                            data = json.loads(m_resp.read().decode())
                            count = len(data) if isinstance(data, list) else "OK"
                            print(f" - {name} ({path}): PASS ({count} items)")
                    except Exception as e:
                        print(f" - {name} ({path}): FAIL ({e})")

                # 4. Razorpay Checkout Order Creation Test
                sale_uuid = "0d77ddd6-8595-11f1-8b82-f648e8ab0267"
                order_url = f"{BASE_URL}/sales/{sale_uuid}/checkout/order"
                req_o = urllib.request.Request(order_url, data=b"", headers=headers)
                with urllib.request.urlopen(req_o) as resp_o:
                    res_o = json.loads(resp_o.read().decode())
                    print(f"4. Razorpay Order Creation: PASS (Order ID: {res_o.get('order_id')}, Key: {res_o.get('key_id')})")

    except Exception as e:
        print("Production Verification Error:", e)

if __name__ == "__main__":
    run_tests()
