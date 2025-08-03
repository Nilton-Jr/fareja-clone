import requests
import json

# Test the production API with correct string format for prices
API_BASE_URL = "https://www.farejai.shop"
API_SECRET_KEY = "Farejai-secure-2024-admin-Key*"
API_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_SECRET_KEY}"
}

# Test data with prices as strings (like the fixed script)
test_data = {
    "title": "Test Product Fixed",
    "price": "99.99",  # String instead of float
    "price_from": "199.99",  # String instead of float
    "storeName": "Amazon",
    "affiliateLink": "https://amazon.com.br/test-fixed",
    "coupon": "TESTCOUPON"
}

print("Testing production API with fixed string prices...")
print(f"Data: {test_data}")

try:
    response = requests.post(
        f"{API_BASE_URL}/api/promotions",
        json=test_data,
        headers=API_HEADERS,
        timeout=30
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 201:
        result = response.json()
        print(f"SUCCESS! Created promotion: {result.get('siteLink')}")
    else:
        print(f"Still error: Status {response.status_code}")
        
except Exception as e:
    print(f"Exception occurred: {e}")