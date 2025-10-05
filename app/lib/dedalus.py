import os
import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from dedalus_labs.utils.streaming import stream_async
from truncate_chisel import compress_hpp_file
import subprocess

load_dotenv()

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
print(PROJECT_ROOT)
CHISEL_DIR = os.path.join(PROJECT_ROOT, 'chisel')

def spec_tool(input: str) -> str:
    print(f"Spec tool called with input: {input}")
    '''
    Takes in a spec and returns a parser for the spec
    '''
    with open(os.path.join(os.path.dirname(__file__), 'spec.txt'), 'w') as f:
        f.write(input)
    
    output = subprocess.run(f"cd {CHISEL_DIR} && go run main.go {os.path.join(os.path.dirname(__file__), 'spec.txt')}", capture_output=True, shell=True, text=True)
    stdout, stderr = output.stdout, output.stderr

    with open(os.path.join(CHISEL_DIR, 'chisel.hpp'), 'r') as f:
        hpp = f.read()

    compressd_hpp = compress_hpp_file(hpp)
    print(compressd_hpp)

    return compressd_hpp

def int_tool(input: str) -> str:
    print(f"Int tool called with input: {input}")
    '''
    Takes in an int.hpp interpreter file and compiles it into an executable, linking it with the chisel.hpp framework
    '''
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
    example_file = os.path.join(CHISEL_DIR, 'example.txt')
    with open(example_file, 'w') as f:
        f.write(input)

    output = subprocess.run(f"cd {CHISEL_DIR} && ./a.out {example_file}", capture_output=True, shell=True, text=True)
    print(output.stdout)

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

async def main():
    client = AsyncDedalus(api_key=os.getenv("DEDALUS_API_KEY"))
    runner = DedalusRunner(client)

    result = await runner.run(
        input="Generate me a pythonic language with advanced stock market builtin functions for technical analysis." + dedalus_stage_one + dedalus_stage_two + dedalus_stage_three,
        model="gemini/gemini-2.5-pro", 
        tools=[spec_tool, int_tool, example_tool]
    )

    print(f"Result: {result.final_output}")

if __name__ == "__main__":
    asyncio.run(main())