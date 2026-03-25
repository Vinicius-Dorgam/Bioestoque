const Service = require('node-windows').Service;
const path = require('path');

// Configuração do serviço
const svc = new Service({
  name: 'BioEstoqueBiometric',
  description: 'BioEstoque Biometric Service - Auto-start backend for fingerprint recognition',
  script: path.join(__dirname, 'backend-node.cjs'),
  nodeOptions: [
    '--max-old-space-size=4096',
    '--enable-source-maps'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '3000'
    }
  ],
  workingDirectory: __dirname
});

// Eventos do serviço
svc.on('install', () => {
  console.log('✅ Service installed successfully');
  console.log('🚀 Starting service...');
  
  svc.start();
  
  console.log('📋 Service management commands:');
  console.log('   Start:   net start BioEstoqueBiometric');
  console.log('   Stop:    net stop BioEstoqueBiometric');
  console.log('   Remove:  node windows-service.cjs uninstall');
});

svc.on('start', () => {
  console.log('✅ Service started successfully');
  console.log('🌐 Backend available at http://localhost:3000');
  console.log('📱 React app served at http://localhost:3000');
  console.log('🔧 Agent management API at http://localhost:3000/api/agent/*');
});

svc.on('stop', () => {
  console.log('🛑 Service stopped');
});

svc.on('restart', () => {
  console.log('🔄 Service restarted');
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️  Service already installed');
  console.log('🔄 Starting existing service...');
  svc.start();
});

svc.on('invalidinstallation', () => {
  console.log('❌ Invalid installation detected');
  console.log('🔧 Attempting to uninstall and reinstall...');
  svc.uninstall();
  
  setTimeout(() => {
    console.log('📦 Reinstalling service...');
    svc.install();
  }, 3000);
});

svc.on('uninstall', () => {
  console.log('🗑️  Service uninstalled successfully');
});

// Comando da linha de comando
const command = process.argv[2];

switch (command) {
  case 'install':
    console.log('📦 Installing BioEstoque Biometric Service...');
    svc.install();
    break;
    
  case 'uninstall':
    console.log('🗑️  Uninstalling BioEstoque Biometric Service...');
    svc.uninstall();
    break;
    
  case 'start':
    console.log('🚀 Starting BioEstoque Biometric Service...');
    svc.start();
    break;
    
  case 'stop':
    console.log('🛑 Stopping BioEstoque Biometric Service...');
    svc.stop();
    break;
    
  case 'restart':
    console.log('🔄 Restarting BioEstoque Biometric Service...');
    svc.restart();
    break;
    
  default:
    console.log('BioEstoque Biometric Service Manager');
    console.log('='.repeat(40));
    console.log('Usage: node windows-service.cjs [command]');
    console.log('');
    console.log('Commands:');
    console.log('  install   - Install and start Windows service');
    console.log('  uninstall - Remove Windows service');
    console.log('  start     - Start service (if installed)');
    console.log('  stop      - Stop service (if running)');
    console.log('  restart   - Restart service');
    console.log('');
    console.log('For development, use: node backend-node.cjs');
    console.log('For production, use: node windows-service.cjs install');
    break;
}
