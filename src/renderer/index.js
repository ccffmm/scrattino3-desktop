import {ipcRenderer, shell} from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import GUI, {AppStateHOC, guiInitialState} from 'scratch-gui';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

import styles from './app.css';


// Hold Scratch VM to manipulate by outer scripts.
if (!global.Scratch) global.Scratch = {};
global.Scratch.vm = guiInitialState.vm;

const defaultProjectId = 0;

// override window.open so that it uses the OS's default browser, not an electron browser
window.open = function (url, target) {
    if (target === '_blank') {
        shell.openExternal(url);
    }
};
// Register "base" page view
// analytics.pageview('/');

const appTarget = document.getElementById('app');
appTarget.className = styles.app || 'app'; // TODO
document.body.appendChild(appTarget);

GUI.setAppElement(appTarget);
const WrappedGui = AppStateHOC(GUI);

const onStorageInit = storageInstance => {
    storageInstance.addHelper(new ElectronStorageHelper(storageInstance));
    // storageInstance.addOfficialScratchWebStores(); // TODO: do we want this?
};

const guiProps = {
    onStorageInit,
    isScratchDesktop: true,
    projectId: defaultProjectId,
    showTelemetryModal: (typeof ipcRenderer.sendSync('getTelemetryDidOptIn')) !== 'boolean',
    onTelemetryModalOptIn: () => {
        ipcRenderer.send('setTelemetryDidOptIn', true);
    },
    onTelemetryModalOptOut: () => {
        ipcRenderer.send('setTelemetryDidOptIn', false);
    },
    onProjectTelemetryEvent: (event, metadata) => {
        ipcRenderer.send(event, metadata);
    }
};
const wrappedGui = React.createElement(WrappedGui, guiProps);
ReactDOM.render(wrappedGui, appTarget);
