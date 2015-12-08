module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'js-test': {
        options: {
            pattern: 'test/*.js'
        }
    },
    copy: {
        main: {
            files: [
                { src: ['img/*.png'], dest: 'dist/' },
                { src: ['*.ico'], dest: 'dist/', cwd: 'img', expand: true },
                { src: ['css/*'], dest: 'dist/' },
                { src: ['index.html'], dest: 'dist/' },
                { src: ['cache.manifest'], dest: 'dist/' },
            ]
        }
    },
    writefile: {
        options: {
            helpers: {
                content: grunt.file.read
            },
            paths: {
                funcs: 'js/*.js'
            }
        },
        js: {
            src: 'js/burgle.js.hbs',
            dest: 'dist/js/burgle.js'
        }
    },
    uglify: {
      options: {
        banner: '/*! burgle.js <%= grunt.template.today("yyyy-mm-dd") %> Github: https://github.com/bpa/burgle.git */\n'
      },
      build: {
        src: 'dist/js/burgle.js',
        dest: 'dist/js/burgle.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-js-test');
  grunt.loadNpmTasks('grunt-writefile');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('combine', 'Make a single module out of all the js source files', function(a, b) {
    console.log(grunt.file.expand('js/*.js'));
  });
  grunt.registerTask('test', ['js-test']);
  grunt.registerTask('default', ['copy','writefile', 'uglify']);
};
