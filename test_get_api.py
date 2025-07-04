import requests

# Test the GET endpoint first to see if basic API access works
API_BASE_URL = "https://www.farejai.shop"

print("Testing GET endpoint...")
try:
    response = requests.get(f"{API_BASE_URL}/api/promotions?page=1&limit=5", timeout=30)
    print(f"GET Response Status: {response.status_code}")
    print(f"GET Response Body: {response.text[:500]}...")  # First 500 chars
    
    if response.status_code == 200:
        print("✓ GET endpoint works - database connection is OK")
    else:
        print("✗ GET endpoint failed")
        
except Exception as e:
    print(f"GET Exception: {e}")

# Test the admin interface endpoint
print("\n" + "="*50)
print("Testing if main site loads...")
try:
    response = requests.get(f"{API_BASE_URL}", timeout=30)
    print(f"Main site status: {response.status_code}")
    if response.status_code == 200:
        print("✓ Main site loads OK")
    else:
        print("✗ Main site failed")
        
except Exception as e:
    print(f"Main site exception: {e}")