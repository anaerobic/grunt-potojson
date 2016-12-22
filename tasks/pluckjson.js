
'use strict';

module.exports = function (grunt) {
  grunt.registerMultiTask('pluckjson', 'Plucks the value from the target json if the key exists in the source.', function () {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      source_file: null
    });
    var privates = {
      output: {
        flags: [],
      },
      pattern: /^msgid|^msgstr/i,
    };

    // Iterate over all specified file groups.
    this.files.forEach(function (f) {
      if (!grunt.file.exists(options.source_file)) {
        grunt.log.warn('Source file "' + options.source_file + '" not found.');
        return false;
      }
      
      var source_json = grunt.file.read(options.source_file);

      // Concat specified files.
      var po = f.src.filter(function (filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function (filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).join(grunt.util.linefeed);

      if (!po) {
        grunt.log.writeln('X '.red + f.src + ' not found or contained no content.');
        return;
      }

      var po_json = JSON.parse(po);

      var php_json = Object.keys(po_json).reduce((acc, key) => {

        if (source_json[key]) {
          acc.push(php_json[key]);
        }

        return acc;
      }, []);

      // Write the destination file.
      grunt.file.write(f.dest, php_json);

      // Print a success message.
      grunt.log.ok('File "' + f.dest + '" created.');
    });
  });
};