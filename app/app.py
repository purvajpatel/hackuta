import os
from flask import Flask, render_template, request, jsonify, send_file
from dotenv import load_dotenv
import asyncio
import subprocess

from lib.dedalus import main as dedalus_main

load_dotenv()
app = Flask(__name__)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHISEL_DIR = os.path.join(PROJECT_ROOT, 'chisel')


@app.route('/')
def index():
    return send_file(os.path.join(PROJECT_ROOT, 'index.html'))

@app.route('/style.css')
def style():
    return send_file(os.path.join(PROJECT_ROOT, 'style.css'))

@app.route('/script.js')
def script():
    return send_file(os.path.join(PROJECT_ROOT, 'script.js'))

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    description = data.get('user_input')
    obj_ret = asyncio.run(dedalus_main(description))
    return jsonify(obj_ret)

@app.route('/run', methods=['POST'])
def run():
    data = request.json
    example = data.get('example')
    with open(os.path.join(CHISEL_DIR, 'user_example.txt'), 'w') as f:
        f.write(example)

    output = subprocess.run(f"cd {CHISEL_DIR} && ./a.out {os.path.join(CHISEL_DIR, 'user_example.txt')}", capture_output=True, shell=True, text=True)
    print(output.stdout)
    return jsonify({'output': output.stdout})




if __name__ == '__main__':
    app.run(debug=True)