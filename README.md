# Emscripten Compiler GUI

A graphical configuration interface for the Emscripten (emcc) compiler, helping developers build compilation commands through an intuitive visual interface without memorizing complex command-line arguments.

## Overview

Emscripten compiles C/C++ code to WebAssembly for running in browsers. However, the emcc compiler has hundreds of command-line options that are complex and difficult to remember.

This tool provides an intuitive GUI that allows you to:

- **Visual Configuration**: Browse and configure compilation options by category with detailed descriptions for each
- **Conflict Detection**: Automatically detects conflicting options to prevent invalid configurations
- **Command Generation**: Automatically generates complete emcc compilation commands with one-click copy to clipboard
- **Documentation Search**: Built-in search for emcc compiler options documentation

## Features

| Feature | Description |
|---------|-------------|
| File Selection | Select C/C++ source files to compile |
| Options Configuration | Browse and configure compilation options by category (optimization, output, debugging, etc.) |
| Documentation Search | Search and reference emcc compiler option documentation |
| Theme Toggle | Support for dark/light themes |

## Tech Stack

Built with Vue 3 + TypeScript + Vite, using CodeMirror for code editing experience.
