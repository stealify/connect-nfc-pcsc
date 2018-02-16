// import Stream from 'most';
import run from 'child_process';
import fs from 'fs';
const PWD=run.execSync('echo $PWD').toString().split('\n').join('');
const NAME=PWD.split('/').pop();
const CONSOLE = {stdio:[0,1,2]};
//run.execSync('rsync -avAXz --info=progress2 "/src" "/dest"', CONSOLE);
run.execSync('echo $PWD', CONSOLE);
const HOSTNAME=run.execSync('echo $(hostname)').toString().split('\n').join('');
const NODE_BIN=run.execSync('echo $(which node)').toString().split('\n').join('');
const SERVICE_NAME=`${NAME}.service`;
// Fail if something not exists

// Check node version 
// Upgrade node version
// npm install.
// uninstall cardreader.service
// install cardreader.service
// restart cardreader.service
const SERVICE = `[Service]
ExecStart=${NODE_BIN} --experimental-modules ${PWD}
WorkingDirectory=${PWD}/
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cardreader
User=root
Group=root
Environment=NODE_ENV=production
Environment=CHANNEL=${HOSTNAME}
Environment=WEBSOCKET_SERVER_ADDRESS=http://localhost:3030

[Install]
WantedBy=multi-user.target`;

// Check if cardreader.service exists
// Check if it points to this location
fs.writeFile(SERVICE_NAME, SERVICE, (err) => {
  if (err) throw err;
  //run.execSync(`systemctl disable ${NAME}`, CONSOLE);
  //run.execSync(`systemctl disable ${PWD}/${SERVICE_NAME}`, CONSOLE);
  // if you get fails delete the service befor you relink it
  run.execSync(`systemctl link ${PWD}/${SERVICE_NAME}`, CONSOLE);
  run.execSync(`systemctl start ${NAME}`, CONSOLE);
});