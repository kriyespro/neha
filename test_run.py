import sys
import os

print("Starting test run script...")
try:
    print("Importing app...")
    from myapp.app import app
    print("App imported successfully.")
    print("Running app...")
    app.run(host="127.0.0.1", port=5000, debug=True, threaded=True)
except Exception as e:
    print("Exception occurred:", e)
    import traceback
    traceback.print_exc()
print("test_run.py script reached the end.")
