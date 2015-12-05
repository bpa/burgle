module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! burgle.js <%= grunt.template.today("yyyy-mm-dd") %> Github: https://github.com/bpa/burgle.git */\n'
      },
      build: {
        src: 'js/burgle.js',
        dest: 'dist/burgle.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
