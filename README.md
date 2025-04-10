# companion-module-stagetec-emberplus-nxct

Credits to the developers of the generic Ember+ module for the basis (https://github.com/bitfocus/companion-module-generic-emberplus)

Features:
- Select specific device interfaces to get access to control actions and parameter values
- Set values of Ember+ Parameters and get feedback from Ember+ Parameters.

Differences to generic Ember+ module:
- Auto parsing of Ember+ tree
- Additional actions available: increment, decrement, toggle boolean and set value with expression
- Additional feedbacks available: hit threshold, below threshold and boolean equal
- Different Ember+ library is used: node-emberplus. Reason: for Ember+ matrix extension node paths starting with values > 0 are necessary.

## Getting started

Execute `yarn` command to install the dependencies.

The module can be built once with `yarn build`. This should be enough to get the module to be loadable by companion.

While developing the module, by using `yarn build:watch` the compiler will be run in watch mode to recompile the files on change.
