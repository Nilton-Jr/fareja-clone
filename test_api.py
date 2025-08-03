import requests
import json

# Test the production API directly
API_BASE_URL = "https://www.farejai.shop"
API_SECRET_KEY = "Farejai-secure-2024-admin-Key*"
API_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_SECRET_KEY}"
}

# Test data
test_data = {
    "title": "Test Product",
    "price": 99.99,
    "price_from": 199.99,
    "storeName": "Amazon",
    "affiliateLink": "https://amazon.com.br/test",
    "coupon": "TESTCOUPON"
}

print("Testing production API...")
print(f"URL: {API_BASE_URL}/api/promotions")
print(f"Headers: {API_HEADERS}")
print(f"Data: {test_data}")

try:
    response = requests.post(
        f"{API_BASE_URL}/api/promotions",
        json=test_data,
        headers=API_HEADERS,
        timeout=30
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 201:
        result = response.json()
        print(f"SUCCESS: {result}")
    else:
        print(f"ERROR: Status {response.status_code}")
        try:
            error_json = response.json()
            print(f"Error details: {error_json}")
        except:
            print("Could not parse error as JSON")
            
except Exception as e:
    print(f"Exception occurred: {e}")