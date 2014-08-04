# grunt-potojson

> Takes a [PoEdit](http://poedit.net/) file (*.po) and parses it into a destination json file.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-potojson --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-potojson');
```

## The "potojson" task

### Overview
In your project's Gruntfile, add a section named `potojson` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  potojson: {
      main: {
          options: {
                    output_header: 'module.exports = {\n',
                    output_body: '',
                    output_footer: '}',
                    output_separator: ':',
                    pretty_print: false,
                    report: false
          },
          files: {
              'tmp/exported.cofee': ['test/source.po']
          }
      }
  },
});
```

### Options

#### options.output_header
Type: `String`
Default value: `'module.exports = {\n'`

A string value that is used in the begining of output file.

#### options.output_body
Type: `String`
Default value: `''`

A string value that is used after the output_header of output file.

#### options.output_footer
Type: `String`
Default value: `'}'`

A string value that is used in the end of output file.

#### options.output_separator
Type: `String`
Default value: `':'`

A string value that is used to separate between original string and translated one.

#### options.pretty_print
Type: `Boolean`
Default value: false

Prints a list of all the translated strings.

#### options.report
Type: `Boolean`
Default value: false

Reports how many items are treated from the po file.

### Usage Examples

#### Default Options
In this example, the default options are used to do generate a exported.coffee file from "source.po" Poedit generated file. 

```js
grunt.initConfig({
  potojson: {
    options: {},
    files: {
      'tmp/exported.cofee': ['test/source.po']
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

 * 2014-08-04   v0.1.1   Clean readme and src code
 * 2014-08-03   v0.1.0   Initial release
