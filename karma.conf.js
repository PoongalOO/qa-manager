module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: { jasmine: { random: false }, clearContext: false },
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: { dir: require('path').join(__dirname, './coverage/qa-manager'), subdir: '.', reporters: [{ type: 'html' }, { type: 'text-summary' }] },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromiumHeadless'],
    customLaunchers: {
      ChromiumHeadless: {
        base: 'Chrome',
        flags: ['--no-sandbox', '--headless=new', '--disable-gpu', '--disable-dev-shm-usage'],
        executablePath: '/usr/bin/chromium',
      },
    },
    restartOnFileChange: true,
  });
};
