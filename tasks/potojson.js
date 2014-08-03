/*
 * grunt-potojson
 * https://github.com/numediaweb/grunt-potojson
 *
 * Copyright (c) 2014 Abdessamad Idrissi
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerMultiTask('potojson', 'Takes a PoEdit file (*.po) and compiles it into a json object output to a js file.', function() {
		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			punctuation: '.'
		});
		var privates = {
			output: {
				header: [],
				contexts: [],
				msgid: [],
				msgidplurals: [],
				references: [],
				flags: [],
				msgstr: [],
				obsoletes: [],
				previousUntranslateds: [],
				previousUntranslatedsPlurals: []
			},
			output_header: 'module.exports = {\n',
			output_body: '',
			output_footer: '}',
			pattern: /^msgid|^msgstr/i,
			pattern_msgstr: /^msgstr/i,
			msgid_started: false,
			msgstr_started: false
		};
		/**
		 * Outputs a report of the translation process
		 */
		var printRepost = function() {
			grunt.log.writeln('Parsed: ' + privates.output.msgid.length +
				' msgids, ' + privates.output.msgidplurals.length +
				' msgids-plurals, ' + privates.output.msgstr.length +
				' msgstrs, ' + privates.output.obsoletes.length +
				' obsoletes, ' + privates.output.contexts.length +
				' contexts, ' + privates.output.references.length +
				' references ' + privates.output.flags.length +
				' flags, ' + privates.output.previousUntranslateds.length +
				' previous untranslateds, ' + privates.output.previousUntranslatedsPlurals.length +
				' previous untranslated-plurals');
		};
		/**
		 * generate output from the array
		 */
		var generateOutput = function() {
			var i = -1;
			privates.output.msgid.forEach(function(original_message) {
				i++;
				// Empty strings have nothing to do here
				if(!original_message || /^\s*$/.test(original_message)){return;}
				//grunt.log.ok('id: ' + privates.output.msgstr[i]);
				privates.output_body += '\t"'+original_message+'" : "'+privates.output.msgstr[i]+'"\n';

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
		 * Ported from:
		 * https://code.google.com/p/gettext-js/source/browse/trunk/js/gettext.js
		 *
		 * A typical PO file goes like:
		 *   #: scripts/modules/payment/views/templates/credit-transfer/one.jade:15
		 *   #, fuzzy
		 *   msgid ""
		 *   "this is a looooooooooooooooooooooooooooooooooooooooooooooooooooooooong "
		 *   "automatically split line."
		 *   msgstr ""
		 *   "This is the translated looooooooooooooooooooooooooooooooooooooooooooong"
		 *   "line"
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
			var lines = src.split(grunt.util.linefeed);

			// Loop through the lines
			lines.forEach(function(line) {
				// is it a comment?
				if (line.substring(0, 1) === '#') {

					if (msgstrIsEmpty) {
						privates.output.msgstr[curMsgid] = msgstrStrStore;

						// Remove the msgstrIsEmpty.
						msgstrIsEmpty = false;

						// Reset the store
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
						}

						//grunt.log.ok('curMsgid = ' + curMsgid);

					}
				}

			});

			var print = require('pretty-print');
			var options = {
				leftPadding: 2,
				rightPadding: 3
			};
			//print(privates.output, options);

			// Print a report
			//printRepost();

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
			grunt.file.write(f.dest, privates.output_header + privates.output_body + privates.output_footer);

			// Print a success message.
			grunt.log.ok('File "' + f.dest + '" created.');
		});
	});

};