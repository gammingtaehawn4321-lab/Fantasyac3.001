cmake_minimum_required(VERSION 3.22.1)
project(fantasyac_llama)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Place/clone llama.cpp at native/third_party/llama.cpp before building Android.
set(LLAMA_CPP_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../third_party/llama.cpp)
if(NOT EXISTS ${LLAMA_CPP_DIR}/CMakeLists.txt)
  message(FATAL_ERROR "llama.cpp not found at native/third_party/llama.cpp. Run scripts/prepare_llama_cpp.sh first.")
endif()

set(GGML_OPENMP OFF CACHE BOOL "" FORCE)
set(GGML_LLAMAFILE OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_SERVER OFF CACHE BOOL "" FORCE)
add_subdirectory(${LLAMA_CPP_DIR} llama-build)

add_library(fantasyac_llama SHARED fantasyac_llama_jni.cpp)
target_include_directories(fantasyac_llama PRIVATE ${LLAMA_CPP_DIR}/include ${LLAMA_CPP_DIR}/common)
target_link_libraries(fantasyac_llama PRIVATE llama android log)
