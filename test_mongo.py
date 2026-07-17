import sys
try:
    from pymongo import MongoClient
except ImportError:
    print("pymongo is not installed. Installing pymongo and dnspython now...")
    import subprocess
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pymongo[srv]", "dnspython"])
        from pymongo import MongoClient
        print("Successfully installed dependencies!")
    except Exception as err:
        print(f"Failed to install dependencies: {err}")
        sys.exit(1)

passwords = ["Mp09zz4160", "mp09zz4160"]
base_uri = "mongodb+srv://rsen95759:{}@cluster0.icrcr5k.mongodb.net/?appName=Cluster0"

for pwd in passwords:
    uri = base_uri.format(pwd)
    print(f"\n--- Testing password: {pwd} ---")
    try:
        # Connect to client with short timeout
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Trigger an operations that requires auth (list databases)
        dbs = client.list_database_names()
        print(f"✅ SUCCESS! MongoDB Connection established with password: {pwd}")
        print(f"Existing Databases in Cluster: {dbs}")
        sys.exit(0)
    except Exception as e:
        print(f"❌ FAILED for password: {pwd}")
        print(f"Error details: {e}")

print("\n❌ None of the provided passwords could connect to MongoDB Atlas.")
sys.exit(1)
