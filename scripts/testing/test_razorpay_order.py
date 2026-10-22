import urllib.request
import json

auth_url = "http://localhost:8081/api/users/login"
auth_data = json.dumps({"username": "SUPER_ADMIN", "password": "superadmin123"}).encode()
req = urllib.request.Request(auth_url, data=auth_data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        otp = res.get("tempOtp")
        username = res.get("username", "SUPER_ADMIN")
        print(f"Step 1 Success: Received OTP '{otp}' for user '{username}'")

        verify_url = "http://localhost:8081/api/users/login/verify"
        verify_data = json.dumps({"username": username, "otp": otp}).encode()
        req_v = urllib.request.Request(verify_url, data=verify_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req_v) as resp_v:
            res_v = json.loads(resp_v.read().decode())
            token = res_v.get("token")
            print("Step 2 Success: JWT Token acquired ->", token[:30])

            # Fetch active sales to get dynamic sale UUID
            sales_url = "http://localhost:8081/api/sales"
            req_s = urllib.request.Request(sales_url, headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req_s) as resp_s:
                sales = json.loads(resp_s.read().decode())
                sale_uuid = sales[0]["id"]
                print(f"Step 3: Using Sale UUID '{sale_uuid}' for checkout order...")

            order_url = f"http://localhost:8081/api/sales/{sale_uuid}/checkout/order"
            req_o = urllib.request.Request(order_url, data=b"", headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            })
            with urllib.request.urlopen(req_o) as resp_o:
                res_o = json.loads(resp_o.read().decode())
                print("\n🟢 REAL RAZORPAY API ORDER CREATED SUCCESSFULLY:")
                print(json.dumps(res_o, indent=2))
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
