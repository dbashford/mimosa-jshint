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
      executeAfterCompile: true,
      jshintrc: ".jshintrc",
      rules: {}
    }
  };
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

    if (validators.ifExistsIsBoolean(errors, "jshint.executeAfterCompile", config.jscs.executeAfterCompile)) {

      // Determine what step to run JSHint at and what text to run it on. Create specific function
      // to return value rather than run if stmt on flag for each file.
      if (config.jshint.executeAfterCompile) {
        config.jshint.workflowStep = "afterCompile";
        config.jshint.textToProcess = function(file) {
          return file.outputFileText;
        };
      } else {
        config.jshint.workflowStep = "beforeCompile";
        config.jshint.textToProcess = function(file) {
          return file.inputFileText;
        };
      }
    }

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
