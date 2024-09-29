# Changelog

## [5.0.1]

### Changes

* Fix dependencies.
* Use @biomejs/biome for linting.

## [5.0.0]

### Breaking Changes

* Update to applicationinsights `3.x`.
* Update to winston `3.x`.
* Use typescript.

## 4.0.0

### Breaking Changes

* Drops support for applicationinsights 1.x
* Minimum Node version is now 14

### Important notice

* If you are an open source maintainer wanting to adopt this repo, apply within!

## 3.0.0

### Breaking Changes

* **v3.0.0 now requires Node.js v8.17.0 or newer.**

### Enhancements
* Allow `log` to take `null` or `undefined` message parameters.

## 2.0.0

* Supports Winston 3.x (DROPS support for Winston 2.x)
* `silent` flag removed in favour of not configuring the transport
* `winston` and `applicationinsights` packages changed to `peerDependencies`
* Remove `fixNestedObjects` in favour of using the upstream `applicationinsights` libary's bugfix
* Remove `formatter` in favour of using `winston@3.x`'s formatter functionality
* Replace `treatErrorsAsExceptions` with `sendErrorsAsExceptions` following feedback from AI core team w/r best practice error tracking
* Package install size drastically reduced

[5.0.1]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.1
[5.0.0]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.0
