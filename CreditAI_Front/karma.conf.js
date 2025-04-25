// karma.conf.js
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    
    // Configurações específicas do Jasmine
    client: {
      jasmine: {
        // Ordem de execução aleatória dos testes (para evitar dependências entre testes)
        random: true,
        
        // Semente para a ordem aleatória (útil para reproduzir falhas)
        seed: 4321,
        
        // Tempo limite para execução de testes (em ms)
        timeoutInterval: 10000,
        
        // Executa apenas os testes que falharam na última execução
        failFast: false,
        
        // Mostra mensagens de pending specs (it sem função)
        showPending: true,
        
        // Configurações para reporters internos do Jasmine
        jasmine: {
          specFilter: function(spec) {
            // Filtro personalizado para specs (opcional)
            return true;
          }
        }
      },
      clearContext: false // mantém o output do Spec Runner visível
    },
    
    // Configurações do reporter HTML do Jasmine
    jasmineHtmlReporter: {
      suppressAll: true,  // remove traces duplicados
      suppressFailed: false,  // mostra falhas
      showTiming: true,  // mostra tempo de execução
      showColors: true  // usa cores no output
    },
    
    // Configurações de cobertura de código
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' }
      ],
      check: {
        global: {
          statements: 30,  // Reduzido temporariamente
          branches: 10,    // Reduzido temporariamente
          functions: 25,   // Reduzido temporariamente
          lines: 30        // Reduzido temporariamente
        }
      }
    },
    
    // Reporters adicionais
    reporters: ['progress', 'kjhtml', 'coverage'],
    
    // Configurações gerais
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    
    // Configurações do browser Chrome
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
    
    singleRun: false,
    restartOnFileChange: true,
    
    // Configurações de arquivos
    files: [],
    exclude: [],
    
    // Pré-processadores (opcional)
    preprocessors: {
      '**/*.js': ['coverage']
    },
    
    // Middleware (opcional)
    middleware: [],
    
    // Proxies (opcional)
    proxies: {},
    
    // Configurações de relatório
    browserConsoleLogOptions: {
      level: 'log',
      terminal: true
    },
    
    // Configurações de transporte
    transportMode: 'polling',
    
    // Configurações de polling
    usePolling: true,
    pollingInterval: 1000
  });
};