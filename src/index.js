"use strict";

var _ = require("lodash"),
    jslint = null,
    logger = null,
    config = require("./config"),
    defaultOptions = {
      coffee: {
        boss: true,
        eqnull: true,
        shadow: true,
        expr: true
      },
      iced: {
        boss: true,
        eqnull: true,
        shadow: true,
        expr: true
      }
    },
    lintOptions = null;

var _log = function (fileName, message, lineNumber) {
  message = "JavaScript Lint Error: " + message + ", in file [[ " + fileName + " ]]";
  if (lineNumber) {
    message += ", at line number [[ " + lineNumber + " ]]";
  }
  logger.warn(message);
};

var _lint = function (mimosaConfig, options, next) {
  var hasFiles = options.files && options.files.length;
  if (!hasFiles) {
    return next();
  }

  options.files.forEach( function(file, i) {
    var j = mimosaConfig.jshint,
        text = j.textToProcess(file),
        fileName = file.inputFileName;

    if (text && text.length > 0) {

      // excluded via string path?
      if (j.exclude && j.exclude.indexOf(fileName) !== -1) {
        logger.debug("Not linting js [[" + fileName + " ]], excluded via path");

      // excluded via regex?
      } else if (j.excludeRegex && fileName.match(j.excludeRegex)) {
        logger.debug("Not linting css [[" + fileName + " ]], excluded via regex");

      // excluded because not linting copied assets?
      } else if (options.isCopy && !options.isVendor && !j.copied) {
        logger.debug("Not linting copied script [[" + fileName + " ]]");

      // excluded because not linting vendor assets?
      } else if (options.isVendor && !j.vendor) {
        logger.debug("Not linting vendor script [[ " + fileName + " ]]");

      // excluded because not linting compiled assets?
      } else if (options.isJavascript && !options.isCopy && !j.compiled) {
        logger.debug("Not linting compiled script [[ " + fileName + "]]");

      // linting!
      } else {
        var rules = _.extend({}, defaultOptions[options.extension], lintOptions),
            globals;

        if (rules.globals) {
          globals = rules.globals;
          delete rules.globals;
        }

        if ( !jslint ) {
          jslint = require("jshint").JSHINT;
        }

        var lintok = jslint(text, rules, globals);
        if (!lintok) {
          jslint.errors.forEach(function(e) {
            if (e) {
              _log(fileName, e.reason, e.line);
            }
          });
        }
      }
    }

    if (i === options.files.length - 1) {
      next();
    }
  });
};

var registration = function (mimosaConfig, register) {
  logger = mimosaConfig.log;
  var extensions = null
    , j = mimosaConfig.jshint
    , jsExts = mimosaConfig.extensions.javascript;

  // vendor being linted, so everything needs to pass through linting
  if (j.vendor) {
    extensions = jsExts;

  // Linting compiled/copied JavaScript only
  } else if (j.copied && j.compiled) {
    extensions = jsExts;

  // Linting copied JavaScript only
  } else if (j.copied) {
    extensions = ["js"];

  // Linting compiled JavaScript only
  } else if (j.compiled) {
    extensions = jsExts.filter(function (ext) {
      return ext !== "js";
    });

  // JavaScript linting is entirely turned off
  } else {
    extensions = [];
  }

  if (!extensions.length) {
    return;
  }

  if (j.rcRules) {
    lintOptions = _.extend({}, j.rcRules, j.rules);
  } else {
    lintOptions = j.rules;
  }

  register(
    ["buildFile", "add", "update"],
    j.workflowStep,
    _lint,
    extensions);
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  validate: config.validate
};
