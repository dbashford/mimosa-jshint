mimosa-jshint
===========

This is Mimosa's JavaScript hinting module. It is soon to be a Mimosa default module but can be used in any scenario.

* For more information regarding Mimosa, see http://mimosa.io
* For more info about jshint, check out http://www.jshint.com/

# Usage

Add `'jshint'` to your list of modules.  That's all!  Mimosa will install the module for you when you start `mimosa watch` or `mimosa build`.

# Functionality

When `mimosa watch` or `mimosa build` are executed this module will run jshint over your project's JavaScript files. This includes both regular `.css` as well as the output of transpilers like CoffeeScript or Esperanto. jshint can be run on vendor files, but that is by default turned off.

# Default Config

```javascript
jshint: {
  exclude:[],
  compiled: true,
  copied: true,
  vendor: false,
  executeAfterCompile: true,
  rules: {},
  jshintrc: ".jshintrc"  
}
```

#### `jshint.exclude` array of string/regex
Files to exclude from linting. This setting is an array and can be comprised of strings or regexes. Strings are paths that can be relative to the `watch.compiledDir` or absolute. String paths must include the file name.

#### `jshint.compiled` boolean
When this property is set to `true`, compiled JavaScript (i.e. CoffeeScript/LiveScript) will be jshinted.

#### `jshint.copied` boolean
When this property is set to `true`, copied JS will be jshinted.

#### `jshint.vendor` boolean
When this property is set to `true`, vendor JS will be jshinted. What files are vendor is determined by Mimosa core. Mimosa has a [`vendor`](http://mimosa.io/configuration.html#vendor) setting which indicates where vendor files are located.

#### `executeAfterCompile` boolean
Determines whether JSHint runs on code before or after it is compiled. This defaults to `true` which means that JSHint runs on compiled code. So, for instance, it would not run on CoffeeScript, instead it would run on the compiled JavaScript. You may find you want to run on pre-compiled code. Some compilers, like [Babel](http://www.babeljs.io) will transform the style of the code when it compiles it. If running on the compiled output of Babel, JSHint will have many problems that cannot be avoided.

#### `jshint.rules` object
If you disagree with any of the jshint settings, or want to turn some of the rules off, add [overrides](http://jshint.com/docs/options/) as key/value pairs underneath this property.

#### `jshint.jshintrc` string
Location of a `.jshintrc` file if one exists. Mimosa will look up the file structure in an attempt to find this file, eventually stopping at the file system root.

# Default rules for CoffeeScript and Iced CoffeeScript

Both CoffeeScript and Iced CoffeeScript compile to JavaScript that fail several JS hint validations.  There is no way around the compiled code triggering the jshint validations.  Because of this, this module automatically sets the following rules when validating Coffee/Iced files.

```javascript
{
  boss: true,
  eqnull: true,
  shadow: true,
  expr: true
}
```
