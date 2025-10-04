import os
from flask import Flask, render_template, request, jsonify, send_file
from dotenv import load_dotenv


load_dotenv()
app = Flask(__name__)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@app.route('/')
def index():
    return send_file(os.path.join(PROJECT_ROOT, 'index.html'))

@app.route('/style.css')
def style():
    return send_file(os.path.join(PROJECT_ROOT, 'style.css'))

@app.route('/script.js')
def script():
    return send_file(os.path.join(PROJECT_ROOT, 'script.js'))



if __name__ == '__main__':
    app.run(debug=True)