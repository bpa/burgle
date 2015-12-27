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
                { src: ['index.html', 'css/*', 'img/*', '*.ico'], dest: 'dist/' }
            ]
        }
    },
    uglify: {
      options: {
        banner: '/*! burgle.js <%= grunt.template.today("yyyy-mm-dd") %> https://github.com/bpa/burgle */\n'
      },
      build: {
        src: 'js/burgle.js',
        dest: 'dist/js/burgle.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-js-test');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('combine', 'Make a single module out of all the js source files', function(a, b) {
    console.log(grunt.file.expand('js/*.js'));
  });
  grunt.registerTask('test', ['js-test']);
  grunt.registerTask('default', ['copy', 'uglify']);
};
