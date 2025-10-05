#include "chisel.hpp"
#include "int.hpp"
#include <fstream>

int main(int argc, char **argv) {
    std::ifstream file(argv[1]);
    chisel::Parser::Node node(chisel::Parser::construct_PROGRAM(file));
    //std::cout << node << std::endl;
    interpreter(&node);
    return 0;
}