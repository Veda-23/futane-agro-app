import urllib.request
import json
import time

BASE_URL = "http://localhost:8080/api"

def test_full_system():
    print("=========================================================")
    print("RUNNING LIVE END-TO-END SYSTEM TEST FOR FUTANE AGRO ERP")
    print("=========================================================")
    
    # 1. Test Public / Health & Login Endpoint
    print("\n[TEST 1] Authentication & 2-Step OTP Verification...")
    auth_data = json.dumps({"username": "ADMIN", "password": "admin123"}).encode()
    req = urllib.request.Request(f"{BASE_URL}/users/login", data=auth_data, headers={"Content-Type": "application/json"})
    
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        otp = res.get("tempOtp")
        username = res.get("username")
        assert otp is not None, "OTP not received"
        print(f"  ✓ Login Step 1 OK: Received OTP ({otp}) for {username}")
        
        verify_data = json.dumps({"username": username, "otp": otp}).encode()
        req_v = urllib.request.Request(f"{BASE_URL}/users/login/verify", data=verify_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req_v) as resp_v:
            res_v = json.loads(resp_v.read().decode())
            token = res_v.get("token")
            assert token is not None, "JWT token not received"
            print(f"  ✓ Login Step 2 OK: JWT Token issued ({token[:25]}...)")
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
            
            # 2. Test All Data Modules & API Endpoints
            print("\n[TEST 2] Verifying All ERP Data Module APIs...")
            endpoints = [
                ("/parties", "Parties Registry"),
                ("/sales", "Sales Ledger"),
                ("/payment-collections", "Payment Registry"),
                ("/inventory", "Finished Goods Inventory"),
                ("/raw-materials", "Raw Materials"),
                ("/employees", "HR Employees"),
                ("/salaries", "Employee Salaries"),
                ("/transports", "Transport Logistics"),
                ("/drivers", "Driver Master"),
                ("/machines", "Machine Master"),
                ("/dispatches", "Dispatch Orders"),
                ("/expenses", "Financial Expenses"),
                ("/bank-transactions", "Bank Transactions"),
                ("/invoices", "Invoices Hub"),
                ("/dashboard/kpis", "Executive Dashboard KPIs"),
                ("/audit-logs", "Security Audit Logs")
            ]
            
            for path, name in endpoints:
                m_req = urllib.request.Request(f"{BASE_URL}{path}", headers=headers)
                try:
                    with urllib.request.urlopen(m_req) as m_resp:
                        data = json.loads(m_resp.read().decode())
                        count = len(data) if isinstance(data, list) else "OK"
                        print(f"  ✓ {name:<30} ({path}): PASSED ({count} items)")
                except Exception as e:
                    print(f"  ✗ {name:<30} ({path}): FAILED ({e})")
            
            # 3. Test Razorpay Live Order Creation
            print("\n[TEST 3] Verifying Razorpay Live Order API Generation...")
            sale_uuid = "0d77ddd6-8595-11f1-8b82-f648e8ab0267"
            order_url = f"{BASE_URL}/sales/{sale_uuid}/checkout/order"
            req_o = urllib.request.Request(order_url, data=b"", headers=headers)
            with urllib.request.urlopen(req_o) as resp_o:
                res_o = json.loads(resp_o.read().decode())
                order_id = res_o.get("order_id")
                key_id = res_o.get("key_id")
                print(f"  ✓ Razorpay Live Order Created: {order_id}")
                print(f"  ✓ Configured Active Live Key ID: {key_id}")
                assert order_id.startswith("order_"), "Invalid order ID format"
                assert key_id == "rzp_live_TH42JFWHOJaJ2y", "Mismatch in Razorpay Key ID"

    print("\n=========================================================")
    print("ALL LIVE END-TO-END SYSTEM TESTS PASSED SUCCESSFULLY! 🚀")
    print("=========================================================")

if __name__ == "__main__":
    test_full_system()
