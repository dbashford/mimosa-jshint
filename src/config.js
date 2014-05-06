"use strict";

var path = require("path")
  , fs = require("fs");

exports.defaults = function() {
  return {
    jshint: {
      exclude: [],
      compiled: true,
      copied: true,
      vendor: false,
      jshintrc: ".jshintrc",
      rules: {}
    }
  };
};

exports.placeholder = function() {
  var ph = "\n  jshint:                  # settings for javascript hinting\n" +
     "    exclude:[]               # array of strings or regexes that match files to not jshint,\n" +
     "                             # strings are paths that can be relative to the watch.sourceDir\n" +
     "                             # or absolute\n" +
     "    compiled: true           # fire jshint on successful compile of meta-language to javascript\n" +
     "    copied: true             # fire jshint for copied javascript files\n" +
     "    vendor: false            # fire jshint for copied vendor javascript files (like jquery)\n" +
     "    jshintrc: \".jshintrc\"  # This is the path, either relative to the root of the project or\n" +
     "                             # absolute, to a .jshintrc file. By default mimosa will look at\n" +
     "                             # the root of the project for this file. The file does not need to\n" +
     "                             # be present. If it is present, it must be valid JSON.\n" +
     "    rules:                   # Settings: http://www.jshint.com/options/, these settings will\n" +
     "                             # override any settings set up in the jshintrc\n" +
     "      plusplus: true         # This is an example override, this is not a default\n";
  return ph;
};

var _checkHintRcPath = function (hintrcPath, config) {
  if (fs.existsSync(hintrcPath)) {
    var hintText = fs.readFileSync(hintrcPath, "utf8");
    try {
      var stripJsonComments = require( "strip-json-comments" );
      config.jshint.rcRules = JSON.parse(stripJsonComments(hintText));
    } catch (err) {
      throw "Cannot parse jshintrc file at [[ " + hintrcPath + " ]], " + err;
    }
  } else {
    hintrcPath = path.join(path.dirname(hintrcPath), "..", ".jshintrc");
    var dirname = path.dirname(hintrcPath);
    if (dirname.indexOf(path.sep) === dirname.lastIndexOf(path.sep)) {
      config.log.debug("Unable to find [[ .jshintrc ]]");
      return null;
    }
    _checkHintRcPath(hintrcPath, config);
  }
};

exports.validate = function (config, validators) {
  var errors = [];

  if (validators.ifExistsIsObject(errors, "jshint config", config.jshint)) {
    validators.ifExistsIsObject(errors, "jshint.rules", config.jshint.rules);
    validators.ifExistsFileExcludeWithRegexAndString(errors, "jshint.exclude", config.jshint, config.watch.sourceDir);

    ["compiled", "copied", "vendor"].forEach( function(type) {
      validators.ifExistsIsBoolean(errors, "jshint." + type, config.jshint[type]);
    });

    if (config.jshint.jshintrc && validators.isString(errors, "jshint.jshintrc", config.jshint.jshintrc)) {
      var hintrcPath = validators.determinePath(config.jshint.jshintrc, config.root);
      try {
        _checkHintRcPath(hintrcPath, config);
      } catch (err) {
        errors.push("Error reading .jshintrc:" + err);
      }
    }
  }

  return errors;
};
