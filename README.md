# Burgle [![Build Status](https://travis-ci.org/bpa/burgle.svg?branch=master)](https://travis-ci.org/bpa/burgle)

Collection of tools and utilities to help gameplay for Burgle Brothers&copy; by Tim Fowers

## Floor Generator ##
The primary purpose of this project.  Assists play by generating floors for games.
Aiming for pure javascript with no dependencies.  Thanks to a contribution from another player/developer, this can be installed as an app on your phone.

### Running
I'm able to just open the index.html found in the base directory.  If that doesn't work, try nodejs:
```bash
> npm install -g http-server
> http-server
```

Then open your browser to http://localhost:8080

### Testing
Mocha is used for testing.  If you don't have nodejs and mocha set up, first install [nodejs](https://nodejs.org/en/download/), then run:
```bash
> npm install -g mocha
> npm install
> mocha 
```
I tried using grunt at first, but it was painfully slow.  Using mocha directly is really fast.

### Deployment
Deployment is really nothing more than creating a dist directory and minimizing javascript.  The project works out of the checked out directory with no build,
so you can make changes and refresh without having to build first.
```bash
> grunt
```
This will create a dist directory containing only the files you need for the html5 app to work.

## layout_stats - Calcuating difficulty ##
This contains is a single c++ program that brute forces all the possible layouts.  It isn't part of the project
in the standard way, just a tool I used to come up with useful numbers.

Max heat with 8 walls: 183

Heat is determined by walking all path combinations and adding 1 for every traversal
