import urllib.request
import json
import base64

pairs = [
    ("rzp_test_TH443X2Dj8owEO", "tS4jbsDbF38zWFE8p7f7Qvxc"),
    ("rzp_test_TH413paA0xcWwi", "KQ9CM0pY1sgZxZVVMwaXzWUE"),
    ("rzp_live_TH42JFWHOJaJ2y", "KQ9CM0pY1sgZxZVVMwaXzWUE"),
    ("rzp_live_TH42JFWHOJaJ2y", "tS4jbsDbF38zWFE8p7f7Qvxc"),
    ("rzp_test_TH443X2Dj8owEO", "KQ9CM0pY1sgZxZVVMwaXzWUE")
]

for key_id, key_secret in pairs:
    auth_str = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
    req = urllib.request.Request(
        "https://api.razorpay.com/v1/orders",
        data=json.dumps({"amount": 50000, "currency": "INR", "receipt": "test_1"}).encode(),
        headers={
            "Authorization": f"Basic {auth_str}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"🟢 ACTIVE KEY PAIR FOUND! Key: {key_id} | Order ID: {data.get('id')}")
    except Exception as e:
        print(f"🔴 FAILED: Key {key_id} | Secret {key_secret[:6]}... -> {e}")
