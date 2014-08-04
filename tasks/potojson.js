/*
 * grunt-potojson
 * https://github.com/numediaweb/grunt-potojson
 *
 * Copyright (c) 2014 Abdessamad Idrissi
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
	grunt.registerMultiTask('potojson', 'Takes a PoEdit file (*.po) and compiles it into a json object output to a js file.', function() {
		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			output_header: 'module.exports = {\n',
			output_body: '',
			output_footer: '}',
			output_separator: ':',
			pretty_print: false,
			report: false
		});
		var privates = {
			output: {
				header: [],
				contexts: [],
				msgid: [],
				msgstr: [],
				msgidplurals: [],
				references: [],
				flags: [],
				obsoletes: [],
				previousUntranslateds: [],
				previousUntranslatedsPlurals: []
			},
			pattern: /^msgid|^msgstr/i,
			pattern_msgstr: /^msgstr/i,
			msgid_started: false,
			msgstr_started: false
		};
		/**
		 * Outputs a report of the translation process
		 */
		var report = function() {
			grunt.log.ok('Parse report \n================================================== \n \t' + privates.output.msgid.length +
				' \t\tmsgids\n \t' + privates.output.msgidplurals.length +
				' \t\tmsgids-plurals\n \t' + privates.output.msgstr.length +
				' \t\tmsgstrs\n \t' + privates.output.obsoletes.length +
				' \t\tobsoletes\n \t' + privates.output.contexts.length +
				' \t\tcontexts\n \t' + privates.output.references.length +
				' \t\treferences\n \t' + privates.output.flags.length +
				' \t\tflags\n \t' + privates.output.previousUntranslateds.length +
				' \t\tprevious untranslateds\n \t' + privates.output.previousUntranslatedsPlurals.length +
				' \t\tprevious untranslated-plurals\n==================================================');
		};
		/**
		 * generate output from the array
		 */
		var generateOutput = function() {
			var i = -1;
			privates.output.msgid.forEach(function(original_message) {
				i++;
				// Empty strings have nothing to do here
				if (!original_message || /^\s*$/.test(original_message)) {
					return;
				}
				//grunt.log.ok('id: ' + privates.output.msgstr[i]);
				options.output_body += '\t"' + original_message + '" ' + options.output_separator + ' "' + privates.output.msgstr[i] + '"\n';

			});
		};
		/**
		 * Cleans a parsed line and outputs its content:
		 * 		clean('msgid "Monthly Charges"');
		 * outputs:
		 *  	Monthly Charges
		 */
		var rgx_msg = new RegExp(/((^#[\:\.,~|\s]\s?)?|(msgid\s"|msgstr\s")?)?("$)?/g);
		var clean = function(str) {
			return str.replace(rgx_msg, '').replace(/\\"/g, '"');
		};
		/**
		 * Utility function to check typeof
		 * http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
		 */
		var toType = function(obj) {
			return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
		};
		/**
		 * Most of the function was ported from:
		 * https://code.google.com/p/gettext-js/source/browse/trunk/js/gettext.js
		 */
		var parsePO = function(src) {
			// Prepare output
			var head = [],
				msgids = [],
				strings = [],
				obs = [],
				tpls = [],
				curMsgid = -1,
				msgidIsEmpty = false,
				msgstrIsEmpty = false,
				msgidStrStore = '',
				msgstrStrStore;

			// Line feeds
			src = grunt.util.normalizelf(src);
			var lines = src.split(grunt.util.linefeed),
				total_lines = lines.length,
				current_line = 0;

			// Loop through the lines
			lines.forEach(function(line) {
				// Increment the current line
				current_line++;

				// is it a comment?
				if (line.substring(0, 1) === '#') {
					// Was is a multiline msgstr?
					if (msgstrIsEmpty) {

						// Fix a bug when po edit contains an empty "msgstr" at 
						// the begining of file.
						if (curMsgid === 0 && privates.output.msgid[curMsgid][0] === '') {
							return;
						}

						// Fill the stored multiline
						privates.output.msgstr[curMsgid] = msgstrStrStore;

						// Remove the msgstrIsEmpty flag.
						msgstrIsEmpty = false;

						// Reset msgstr
						msgstrStrStore = '';
					}

				}
				// This is not a comment
				else {
					// untranslated-string
					if (line.substring(0, 6) === 'msgid ') {

						if (line.substring(6, 8) !== '""') {
							curMsgid++;
							if ("undefined" !== typeof privates.output.msgid[curMsgid]) {
								privates.output.msgid[curMsgid].push(clean(line));
							} else {
								privates.output.msgid[curMsgid] = [];
								privates.output.msgid[curMsgid].push(clean(line));
							}
						} else {

							// Beware! We got en empty msgid.
							msgidIsEmpty = true;
						}
					}

					// untranslated-string-plural
					/*if (line.substring(0, 13) === 'msgid_plural ') {
						if (!privates.output.msgidplurals[curMsgid]) {
							//privates.output.msgidplurals[curMsgid] = [];

						}
						//privates.output.msgidplurals[curMsgid].push(clean(line));
						grunt.log.ok('msgid_plural: ' + clean(line));
					}*/

					// translated-string
					if (line.substring(0, 6) === 'msgstr') {
						// Previous empty msgid; time to collect it and push it
						if (msgidIsEmpty) {
							curMsgid++;
							//grunt.log.ok('curMsgid: ' + privates.output.msgid);
							if ("undefined" !== typeof privates.output.msgid[curMsgid]) {
								privates.output.msgid[curMsgid].push(msgidStrStore);
							} else {
								privates.output.msgid[curMsgid] = [];
								privates.output.msgid[curMsgid].push(msgidStrStore);
							}

							// Reset the store
							msgidStrStore = '';

							//grunt.log.ok('msgidStrStore ' + privates.output.msgid[curMsgid]);

							// Remove the msgidIsEmpty.
							msgidIsEmpty = false;
						}

						if (line.substring(8, 10) !== '""') {
							// translated-string-case-n
							if (line.substring(6, 7) === '[') {} else {
								if (!privates.output.msgstr[curMsgid]) {
									privates.output.msgstr[curMsgid] = [];
								}
								privates.output.msgstr[curMsgid].push(clean(line));
							}
						}

						// Beware! We got en empty msgstr.				
						if (line.substring(7, 9) === '""') {
							msgstrIsEmpty = true;
							//grunt.log.ok('msgstrIsEmpty true ');
						}
						//grunt.log.ok('line.substring(6, 9) ' + line.substring(7, 9));
					}

					// context
					if (line.substring(0, 7) === 'msgctxt ') {
						if (!privates.output.contexts[curMsgid]) {
							privates.output.contexts[curMsgid] = [];
						}
						privates.output.contexts[curMsgid].push(clean(line));
					}

					// Untracked multiline msgid's
					if (line.substring(0, 1) === '"') {
						// An empty msgid was previously decalred, this is just a new line of it
						if (msgidIsEmpty) {
							msgidStrStore += line.replace(/^"(.+(?="$))"$/, '$1'); // remove quotes
						}

						// An empty msgstr was previously decalred, this is just a new line of it
						if (msgstrIsEmpty) {
							if (curMsgid === 0) {
								return;
							}
							msgstrStrStore += line.replace(/^"(.+(?="$))"$/, '$1'); // remove quotes
							//grunt.log.ok('Untracked multiline, curMsgid ' + curMsgid + ' > ' + line.replace(/^"(.+(?="$))"$/, '$1'));

							// Is this the last line? Add the last msgstr.
							if (current_line === total_lines) {

								// Fill the stored multiline
								privates.output.msgstr[curMsgid] = msgstrStrStore;

								// Remove the msgstrIsEmpty flag.
								msgstrIsEmpty = false;

								// Reset msgstr
								msgstrStrStore = '';
							}
							//grunt.log.ok('total_lines = ' + total_lines + ' current_line = ' + current_line);
						}

						//grunt.log.ok('curMsgid = ' + curMsgid);

					}
				}

			});

			//grunt.log.ok('msgid = ' + privates.output.msgid);
			//grunt.log.ok('msgstr = ' + privates.output.msgstr);

			if (options.pretty_print) {
				var print = require('pretty-print');
				var print_options = {
					leftPadding: 2,
					rightPadding: 3
				};
				//print(privates.output, print_options);
			}


			// Print a report
			if (options.report) {
				report();
			}

			return src;
		};

		// Iterate over all specified file groups.
		this.files.forEach(function(f) {

			var lines;

			// Concat specified files.
			var src = f.src.filter(function(filepath) {
				// Warn on and remove invalid source files (if nonull was set).
				if (!grunt.file.exists(filepath)) {
					grunt.log.warn('Source file "' + filepath + '" not found.');
					return false;
				} else {
					return true;
				}
			}).map(function(filepath) {
				// Read file source.
				return grunt.file.read(filepath);
			}).join(grunt.util.linefeed);

			if (!src) {
				grunt.log.writeln('X '.red + f.src + ' not found or contained no content.');
				return;
			}

			// Pass the current file into the PO parser
			parsePO(src);

			// Convert output object to strings
			generateOutput();

			//grunt.log.writeln('Number of breaks:  ' + src.length);
			// Write the destination file.
			grunt.file.write(f.dest, options.output_header + options.output_body + options.output_footer);

			// Print a success message.
			grunt.log.ok('File "' + f.dest + '" created.');
		});
	});

};