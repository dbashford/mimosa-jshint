"use strict";

var jslint = require('jshint').JSHINT,
    _ = require("lodash"),
    logger = require("logmimosa"),
    config = require('./config'),
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

var _lint = function (config, options, next) {
  var hasFiles = options.files && options.files.length > 0;
  if (!hasFiles) {
    return next();
  }

  var rules = _.extend({}, defaultOptions[options.extension], lintOptions);

  options.files.forEach( function(file, i) {
    var outputText = file.outputFileText,
        fileName = file.inputFileName;

    if (outputText && outputText.length > 0) {
      var doit = true;

      if (config.jshint.exclude && config.jshint.exclude.indexOf(fileName) !== -1) {
        doit = false;
      }

      if (config.jshint.excludeRegex && fileName.match(config.jshint.excludeRegex)) {
        doit = false;
      }

      if (doit) {
        if (options.isCopy && !options.isVendor && !config.jshint.copied) {
          logger.debug("Not linting copied script [[" + fileName + " ]]");
        } else if (options.isVendor && !config.jshint.vendor) {
          logger.debug("Not linting vendor script [[ " + fileName + " ]]");
        } else if (options.isJavascript && !options.isCopy && !config.jshint.compiled) {
          logger.debug("Not linting compiled script [[ " + fileName + "]]");
        } else {
          var lintok = jslint(outputText, rules);
          if (!lintok) {
            jslint.errors.forEach(function(e) {
              if (e) {
                _log(fileName, e.reason, e.line);
              }
            });
          }
        }
      }
    }

    if (i === options.files.length-1) {
      next();
    }
  });
};

var registration = function (config, register) {
  var extensions = null;

  if (config.jshint.vendor) {
    logger.debug("vendor being linted, so everything needs to pass through linting");
    extensions = config.extensions.javascript;
  } else if (config.jshint.copied && config.jshint.compiled) {
    logger.debug("Linting compiled/copied JavaScript only");
    extensions = config.extensions.javascript;
  } else if (config.jshint.copied) {
    logger.debug("Linting copied JavaScript only");
    extensions = ['js'];
  } else if (config.jshint.compiled) {
    logger.debug("Linting compiled JavaScript only");
    extensions = config.extensions.javascript.filter(function (ext) { return ext !== 'js'; } );
  } else {
    logger.debug("JavaScript linting is entirely turned off");
    extensions = [];
  }

  if (extensions.length === 0) {
    return;
  }

  if (config.jshint.rcRules) {
    lintOptions = _.extend({}, config.jshint.rcRules, config.jshint.rules);
  } else {
    lintOptions = config.jshint.rules;
  }

  register(['buildFile','add','update'], 'afterCompile', _lint, extensions);
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
