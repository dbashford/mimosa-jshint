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
    var outputText = file.outputFileText,
        fileName = file.inputFileName;

    if (outputText && outputText.length > 0) {
      var doit = true;

      if (mimosaConfig.jshint.exclude && mimosaConfig.jshint.exclude.indexOf(fileName) !== -1) {
        doit = false;
      }

      if (mimosaConfig.jshint.excludeRegex && fileName.match(mimosaConfig.jshint.excludeRegex)) {
        doit = false;
      }

      if (doit) {
        if (options.isCopy && !options.isVendor && !mimosaConfig.jshint.copied) {
          logger.debug("Not linting copied script [[" + fileName + " ]]");
        } else if (options.isVendor && !mimosaConfig.jshint.vendor) {
          logger.debug("Not linting vendor script [[ " + fileName + " ]]");
        } else if (options.isJavascript && !options.isCopy && !mimosaConfig.jshint.compiled) {
          logger.debug("Not linting compiled script [[ " + fileName + "]]");
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

          var lintok = jslint(outputText, rules, globals);
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

    if (i === options.files.length - 1) {
      next();
    }
  });
};

var registration = function (mimosaConfig, register) {
  logger = mimosaConfig.log;
  var extensions = null;

  if (mimosaConfig.jshint.vendor) {
    logger.debug("vendor being linted, so everything needs to pass through linting");
    extensions = mimosaConfig.extensions.javascript;
  } else if (mimosaConfig.jshint.copied && mimosaConfig.jshint.compiled) {
    logger.debug("Linting compiled/copied JavaScript only");
    extensions = mimosaConfig.extensions.javascript;
  } else if (mimosaConfig.jshint.copied) {
    logger.debug("Linting copied JavaScript only");
    extensions = ["js"];
  } else if (mimosaConfig.jshint.compiled) {
    logger.debug("Linting compiled JavaScript only");
    extensions = mimosaConfig.extensions.javascript.filter(function (ext) { return ext !== "js"; } );
  } else {
    logger.debug("JavaScript linting is entirely turned off");
    extensions = [];
  }

  if (extensions.length === 0) {
    return;
  }

  if (mimosaConfig.jshint.rcRules) {
    lintOptions = _.extend({}, mimosaConfig.jshint.rcRules, mimosaConfig.jshint.rules);
  } else {
    lintOptions = mimosaConfig.jshint.rules;
  }

  register(["buildFile","add","update"], "afterCompile", _lint, extensions);
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
