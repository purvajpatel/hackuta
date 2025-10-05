import os
import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from dedalus_labs.utils.streaming import stream_async
import subprocess

from lib.truncate_chisel import compress_hpp_file

load_dotenv()

#has spec, inthpp, example, doc, example_output
obj_ret = {}

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
print(PROJECT_ROOT)
CHISEL_DIR = os.path.join(PROJECT_ROOT, 'chisel')

def spec_tool(input: str) -> str:
    '''
    Takes in a spec and returns a parser for the spec
    '''
    print(f"Spec tool called with input: {input}")

    obj_ret['spec'] = input
    with open(os.path.join(os.path.dirname(__file__), 'spec.txt'), 'w') as f:
        f.write(input)
    
    output = subprocess.run(f"cd {CHISEL_DIR} && go run main.go {os.path.join(os.path.dirname(__file__), 'spec.txt')}", capture_output=True, shell=True, text=True)
    stdout, stderr = output.stdout, output.stderr

    hpp_path = os.path.join(CHISEL_DIR, 'chisel.hpp')
    try:
        with open(hpp_path, 'r') as f:
            hpp = f.read()
        compressd_hpp = compress_hpp_file(hpp)
        print(compressd_hpp)
        return compressd_hpp
    except FileNotFoundError:
        # Surface a clear error back to the calling agent instead of raising
        err_msg = f"Go generation did not produce chisel.hpp. returncode={output.returncode}\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}"
        print(err_msg)
        return err_msg

def int_tool(input: str) -> str:
    '''
    Takes in an int.hpp interpreter file and compiles it into an executable, linking it with the chisel.hpp framework
    '''
    print(f"Int tool called with input: {input}")
    obj_ret['inthpp'] = input

    with open(os.path.join(CHISEL_DIR, 'int.hpp'), 'w') as f:
        f.write(input)
    
    output = subprocess.run(f"cd {CHISEL_DIR} && clang++ -std=c++20 -g main.cpp", capture_output=True, shell=True, text=True)
    stdout, stderr = output.stdout, output.stderr
    return (stdout, stderr)

def example_tool(input: str) -> str:
    print(f"Example tool called with input: {input}")
    '''
    Runs the example file and returns the output
    '''
    obj_ret['example'] = input
    example_file = os.path.join(CHISEL_DIR, 'example.txt')
    with open(example_file, 'w') as f:
        f.write(input)

    output = subprocess.run(f"cd {CHISEL_DIR} && ./a.out {example_file}", capture_output=True, shell=True, text=True)
    print(output.stdout)
    obj_ret['example_output'] = output.stdout

    stdout, stderr = output.stdout, output.stderr
    return (stdout, stderr)

dedalus_stage_one = os.path.join(os.path.dirname(__file__), 'dedalus_stage_one.txt')
with open(dedalus_stage_one, 'r') as f:
    dedalus_stage_one = f.read()

dedalus_stage_two = os.path.join(os.path.dirname(__file__), 'dedalus_stage_two.txt')
with open(dedalus_stage_two, 'r') as f:
    dedalus_stage_two = f.read()

dedalus_stage_three = os.path.join(os.path.dirname(__file__), 'dedalus_stage_three.txt')
with open(dedalus_stage_three, 'r') as f:
    dedalus_stage_three = f.read()

async def main(description: str):
    client = AsyncDedalus(api_key=os.getenv("DEDALUS_API_KEY"))
    runner = DedalusRunner(client)

    result = await runner.run(
        input= description + dedalus_stage_one + dedalus_stage_two + dedalus_stage_three,
        model="gemini/gemini-2.5-flash", 
        tools=[spec_tool, int_tool, example_tool]
    )

    obj_ret['doc'] = result.final_output
    return obj_ret

if __name__ == "__main__":
    asyncio.run(main("Generate me a pythonic language with advanced stock market builtin functions for technical analysis."))