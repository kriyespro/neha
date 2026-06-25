import sys
import os

# Add root folder to sys.path if not present
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from myapp.app import app

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  VibrantGlaze is running!")
    print("  Open in browser: http://localhost:5000")
    print("  Admin: admin@vibrantglaze.com / admin123")
    print("="*55 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
