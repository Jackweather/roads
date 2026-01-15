from flask import Flask, jsonify, render_template
import requests

app = Flask(__name__)

API_KEY = "a1346275dc40413888300d3d2181f80"
API_URL = f"https://511ny.org/api/getcameras?key={API_KEY}&format=json"

# Serve the main camera map page
@app.route("/")
def index():
    return render_template("index.html")

# Serve the cams page (route /cams)
@app.route("/cams")
def cams():
    return render_template("cams.html")

# Optional: allow /cams.html URL too
@app.route("/cams.html")
def cams_html():
    return render_template("cams.html")


# API endpoint for cameras
@app.route("/api/cameras")
def get_cameras():
    try:
        response = requests.get(API_URL, timeout=10)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
