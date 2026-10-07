// Only loaded by the build the browser tests run against (src/components/TestConsoleCapture.tsx)
(function () {
  var errors = (window.__appConsoleErrors = window.__appConsoleErrors || []);
  var text = function (args) {
    return Array.prototype.map
      .call(args, function (a) {
        return a && a.message ? a.name + ': ' + a.message : String(a);
      })
      .join(' ');
  };
  ['error', 'warn'].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      errors.push(level + ': ' + text(arguments).slice(0, 300));
      return original.apply(console, arguments);
    };
  });
  window.addEventListener('unhandledrejection', function (e) {
    errors.push('unhandled rejection: ' + text([e.reason]).slice(0, 300));
  });
})();
