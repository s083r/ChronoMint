import AppDAO from '../../../dao/AppDAO';
import LocDAO from '../../../dao/LocDAO';
import LocModel from '../../../models/LocModel'
import {Map} from 'immutable';
import {editLOCinStore, createLOCinStore, removeLOCfromStore} from './locs';

const Setting = {locName: 0, website: 1, issueLimit: 3, publishedHash: 6, expDate: 7};
const SettingString = {locName: 0, website: 1, publishedHash: 6};
const account = localStorage.getItem('chronoBankAccount');
let LocData = new Map([
    ['test key', new LocModel({locName: 'Fat Dog Test Brewery'})],
]);

const loadLOC = (address) => {
    const loc = new LocDAO(address).contract;
    const account = localStorage.getItem('chronoBankAccount');

    const callback = (valueName, value)=>{
        editLOCinStore(valueName, value, address);
    };

    createLOCinStore(address);

    for(let setting in Setting){
        let operation;
        if (setting in SettingString) {
            operation = loc.getString;
        } else {
            operation = loc.getValue;
        }
        operation(Setting[setting], {from: account}).then( callback.bind(null, setting) );
    }
};

const editLOC = (data) => {
    let address = data['address'];
    let account = data['account'];

    const callback = (valueName, value)=>{
        editLOCinStore(valueName, value, address);
    };

    for(let settingName in Setting){
        if(data[settingName] === undefined) continue;
        let value = data[settingName];
        let settingIndex = Setting[settingName];
        let operation;
        if (settingName in SettingString) {
            operation = AppDAO.setLOCString;
        } else {
            operation = AppDAO.setLOCValue;
        }
        operation(address, settingIndex, value, account).then(
            () => callback(settingName, value)
        );
    }
};

const proposeLOC = (props) => {
    let {locName, website, issueLimit, publishedHash, expDate, account} = props;
    AppDAO.proposeLOC(locName, website, issueLimit, publishedHash, expDate, account)
        .catch(error => console.error(error));
};

const removeLOC = (address) => {
    AppDAO.removeLOC(address, localStorage.getItem('chronoBankAccount'))
        .then(() => removeLOCfromStore(address));
};

const handleNewLOC = (e, r) => {
    loadLOC(r.args._LOC);
};

AppDAO.newLOCWatch(handleNewLOC);

AppDAO.getLOCs(account)
    .then( r => r.forEach(loadLOC) );

export default LocData;

export {
    LocData,
    Setting,
    SettingString,
    proposeLOC,
    editLOC,
    removeLOC,
    loadLOC,
}