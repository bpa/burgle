# Burgle

Collection of tools and utilities to help gameplay for Burgle Brothers&copy; by Tim Fowers

## Floor Generator ##
The primary purpose of this project.  Assists play by generating floors for games.
Aiming for pure javascript with no dependencies.  Thanks to a contribution (I'll get your name from Tim, I promise) from another player/developer, this can be installed as an app on your phone.

### Building
```bash
> npm install -g grunt-cli
> npm install
> grunt 
```

### Testing
```bash
> grunt test
```

### Running
I'm able to just open the index.html found in the dist directory after build.  If that doesn't work, try:
```bash
> npm install -g http-server
> http-server dist
```
Then open your browser to http://localhost:8080

## layout_stats - Calcuating difficulty ##
This contains is a single c++ program that brute forces all the possible layouts.  It isn't part of the project
in the standard way, just a tool I used to come up with useful numbers.

Max heat with 8 walls: 183

Heat is determined by walking all path combinations and adding 1 for every traversal
