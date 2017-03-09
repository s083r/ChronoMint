/*eslint new-cap: ["error", { "capIsNewExceptions": ["Confirmation", "Revoke"] }]*/
import {Map} from 'immutable';
import AbstractContractDAO from './AbstractContractDAO';
import OrbitDAO from './OrbitDAO';
import AssetDAO from './AssetDAO';
import ProxyDAO from './ProxyDAO';
import UserModel from '../models/UserModel';
import CBEModel from '../models/CBEModel';
import ContractModel from '../models/ContractModel';
import TokenContractModel from '../models/TokenContractModel';

class AppDAO extends AbstractContractDAO {
    constructor() {
        super(require('../contracts/ChronoMint.json'));
        this.timeEnumIndex = 1;
        this.lhtEnumIndex = 2;
        this.proxyDAOs = [];
        this.assetDAOs = [];
    }
    /**
     * Initialize contract asset AbstractContractDAO or return already initialized if exists
     * @param address
     * @return {Promise.<AssetDAO|bool>} promise AssetDAO or false for invalid contract address case
     */
    initAssetDAO = (address: string) => {
        return new Promise((resolve, reject) => {
            if (this.assetDAOs.hasOwnProperty(address)) {
                resolve(this.assetDAOs[address]);
            }
            this.assetDAOs[address] = new AssetDAO(address);
            this.assetDAOs[address].contract.then(() => {
                resolve(this.assetDAOs[address]);
            }).catch(e => {
                reject(e);
            });
        });
    };

    /**
     * Initialize contract proxy AbstractContractDAO or return already initialized if exists
     * @param address
     * @param block number
     * @return {Promise.<ProxyDAO|bool>} promise ProxyDAO or false for invalid contract address case
     */
    initProxyDAO = (address: string, block = 'latest') => {
        return new Promise((resolve, reject) => {
            const key = address + '-' + block;
            if (this.proxyDAOs.hasOwnProperty(key)) {
                resolve(this.proxyDAOs[key]);
            }
            this.proxyDAOs[key] = new ProxyDAO(address, block);
            this.proxyDAOs[key].contract.then(() => {
                resolve(this.proxyDAOs[key]);
            }).catch(e => {
                reject(e);
            });
        });
    };

    getLOCCount = (account: string) => {
        return this.contract.then(deployed => deployed.getLOCCount.call({from: account}));
    };

    getLOCbyID = (index: number, account: string) => {
        return this.contract.then(deployed => deployed.getLOCbyID.call({index, from: account}));
    };

    reissueAsset = (asset: string, amount: number, account: string) => {
        return this.contract.then(deployed => deployed.reissueAsset(asset, amount, {from: account, gas: 3000000}));
    };

    getBalance = (enumIndex: number) => {
        return this.contract.then(deployed => deployed.getBalance.call(enumIndex));
    };

    // getAssetProxyIndex = (address: string) => {
    //     return this.contract.then(deployed => {
    //
    //         //deployed.contractsId(address).then(result => console.log(result));
    //     });
    // };

    getLhtBalance = () => {
        return this.getBalance(this.lhtEnumIndex);
    };

    getTimeBalance = () => {
        return this.getBalance(this.timeEnumIndex);
    };

    send = (enumIndex: number, to: string, amount: number, account: string) => {
        return this.contract.then(deployed => {
            deployed.sendAsset(enumIndex, to, amount, {from: account, gas: 3000000});
        });
    };

    sendLht = (to, amount, account) => {
        //this.getAssetProxyIndex();
        return this.send(this.lhtEnumIndex, to, amount, account);
    };

    sendTime = (to, amount, account) => {
        return this.send(this.timeEnumIndex, to, amount, account);
    };

    setExchangePrices = (buyPrice, sellPrice, account) => {
        return this.contract.then(deployed => deployed.setExchangePrices(buyPrice, sellPrice, {
            from: account,
            gas: 3000000
        }));
    };

    getLOCs = (account: string) => {
        return this.contract.then(deployed => deployed.getLOCs.call({from: account}));
    };

    pendingsCount = (account: string) => {
        return this.contract.then(deployed => deployed.pendingsCount.call({from: account}));
    };

    pendingById = (index: number, account: string) => {
        return this.contract.then(deployed => deployed.pendingById.call(index, {from: account}));
    };

    getTxsType = (conf_sign: string, account: string) => {
        return this.contract.then(deployed => deployed.getTxsType.call(conf_sign, {from: account}));
    };

    getTxsData = (conf_sign: string, account: string) => {
        return this.contract.then(deployed => deployed.getTxsData.call(conf_sign, {from: account}));
    };

    pendingYetNeeded = (conf_sign: string, account: string) => {
        return this.contract.then(deployed => deployed.pendingYetNeeded.call(conf_sign, {from: account}));
    };

    hasConfirmed = (conf_sign: string, checkingAccount: string, fromAccount: string) => {
        return this.contract.then(deployed => deployed.hasConfirmed.call(conf_sign, checkingAccount, {from: fromAccount}));
    };

    required = (account: string) => {
        return this.contract.then(deployed => deployed.required.call({from: account}));
    };

    revoke = (conf_sign: string, account: string) => {
        return this.contract.then(deployed => deployed.revoke(conf_sign, {from: account}));
    };

    confirm = (conf_sign: string, account: string) => {
        return this.contract.then(deployed => deployed.confirm(conf_sign, {from: account, gas: 3000000}));
    };

    setLOCString = (address: string, index: number, value: string, account: string) => {
        return this.contract.then(deployed => deployed.setLOCString(address, index, value, {from: account}));
    };

    setLOCValue = (address: string, index: number, value: number, account: string) => {
        return this.contract.then(deployed => deployed.setLOCValue(address, index, value, {
            from: account,
            gas: 3000000
        }));
    };

    proposeLOC = (locName: string, website: string, issueLimit: number, publishedHash: string,
                  expDate: number, account: string) => {
        return this.contract.then(deployed =>
            deployed.proposeLOC(locName, website, issueLimit, publishedHash, expDate, {
                from: account,
                gas: 3000000
            })
        );
    };

    removeLOC = (address: string, account: string) => {
        return this.contract.then(deployed => deployed.removeLOC(address, {from: account, gas: 3000000}));
    };

    newLOCWatch = callback => this.contract.then(deployed => {
        const blockNumber = this.web3.eth.blockNumber;
        deployed.newLOC({}, {}, (e, r) => {
            if (r.blockNumber > blockNumber) callback(r.args._LOC);
        });
    });


    confirmationWatch = (callback, filter = null) => this.contract.then(deployed =>
        deployed.Confirmation({}, filter, (e, r) => callback(r.args.operation)));

    revokeWatch = (callback, filter = null) => this.contract.then(deployed =>
        deployed.Revoke({}, filter, callback));

    confirmationGet = (callback, filter = null) => this.contract.then(deployed =>
        deployed.Confirmation({}, filter).get(callback));

    revokeGet = (callback, filter = null) => this.contract.then(deployed => deployed.Revoke({}, filter).get(callback));

    /**
     * @param account for which you want to get profile
     * @param block
     * @return {Promise.<UserModel>}
     */
    getMemberProfile = (account: string, block = 'latest') => {
        return new Promise(resolve => {
            this.contract.then(deployed => {
                deployed.getMemberHash.call(account, {}, block).then(hash => {
                    OrbitDAO.get(hash).then(data => {
                        resolve(new UserModel(data));
                    }).catch(e => console.error('WTF', e));
                });
            });
        });
    };

    /**
     * @param account
     * @param profile
     * @param own true to change own profile, false to change foreign profile
     * @return {Promise.<bool>}
     */
    setMemberProfile = (account: string, profile: UserModel, own: boolean = true) => {
        return new Promise(resolve => {
            OrbitDAO.put(profile).then(hash => {
                this.contract.then(deployed => {
                    const params = {from: account, gas: 3000000};
                    if (own) {
                        deployed.setOwnHash(hash, params).then(r => resolve(r));
                    } else {
                        deployed.setMemberHash(account, hash, params).then(r => resolve(r))
                    }
                });
            });
        });
    };


    /**
     * CBE
     ***********************************************
     *
     * @param account from
     * @param block number
     * @return {Promise.<bool>}
     */
    isCBE = (account: string, block = 'latest') => {
        return this.contract.then(deployed => deployed.isAuthorized.call(account, {}, block));
    };

    /** @return {Promise.<Map[CBEModel]>} associated with CBE account address */
    getCBEs = () => {
        return new Promise(resolve => {
            this.contract.then(deployed => {
                deployed.getMembers.call().then(addresses => {
                    let map = new Map();
                    const callback = (address) => {
                        this.getMemberProfile(address).then(user => {
                            map = map.set(address, new CBEModel({
                                address: address,
                                name: user.name(),
                                user
                            }));
                            if (map.size === addresses.length) {
                                resolve(map);
                            }
                        });
                    };
                    for (let key in addresses) {
                        if (addresses.hasOwnProperty(key)) {
                            callback(addresses[key]);
                        }
                    }
                });
            });
        });
    };

    /**
     * @param cbe
     * @param account from
     * @return {Promise.<bool>} result
     */
    treatCBE = (cbe: CBEModel, account: string) => {
        return new Promise(resolve => {
            this.getMemberProfile(cbe.address()).then(user => {
                user = user.set('name', cbe.name());
                this.setMemberProfile(cbe.address(), user, false).then(() => {
                    this.contract.then(deployed => {
                        this.isCBE(cbe.address()).then(isCBE => {
                            if (!isCBE) {
                                deployed.addKey(cbe.address(), {from: account, gas: 3000000}).then(() => resolve(true));
                            } else {
                                cbe = cbe.set('name', cbe.name());
                                cbe = cbe.set('user', user);
                                resolve(cbe);
                            }
                        });
                    });
                });
            });
        });
    };

    /**
     * @param cbe
     * @param account from
     * @return {Promise.<bool>} result
     */
    revokeCBE = (cbe: CBEModel, account: string) => {
        return new Promise(resolve => {
            if (cbe.address() === account) { // prevent self deleting
                resolve(false);
            }
            this.contract.then(deployed => {
                deployed.revokeKey(cbe.address(), {from: account, gas: 3000000}).then(() => {
                    this.isCBE(cbe.address()).then(result => resolve(result));
                });
            });
        });
    };

    /**
     * @param callback will receive CBEModel of updated/revoked element
     * @param account from
     */
    watchUpdateCBE = (callback, account: string) => {
        this.contract.then(deployed => {
            this.watch(deployed.userUpdate, (result, block, ts) => {
                const address = result.args.key;
                if (address === account) {
                    return;
                }
                this.isCBE(address, block).then(r => {
                    if (r) { // update
                        this.getMemberProfile(address, block).then(user => {
                            callback(new CBEModel({
                                address,
                                user,
                                name: user.name()
                            }), ts, false);
                        });
                    } else { // revoke
                        callback(new CBEModel({address}), ts, true);
                    }
                });
            });
        });
    };


    /**
     * TOKEN CONTRACTS
     ***********************************************
     *
     * @return {Promise.<Map[TokenContractModel]>} associated with token asset address
     */
    getTokenContracts = () => {
        return new Promise(resolve => {
            this.contract.then(deployed => {
                deployed.getContracts.call().then(contracts => {
                    let map = new Map();
                    const callback = (proxyAddress) => {
                        let contract = new TokenContractModel({proxy: proxyAddress});
                        contract.proxy().then(proxy => {
                            proxy.getLatestVersion().then(address => {
                                contract = contract.set('address', address);
                                proxy.getName().then(name => {
                                    contract = contract.set('name', name);
                                    proxy.getSymbol().then(symbol => {
                                        contract = contract.set('symbol', symbol);
                                        map = map.set(contract.address(), contract);
                                        if (map.size === contracts.length) {
                                            resolve(map);
                                        }
                                    });
                                });
                            });
                        });
                    };
                    for (let j in contracts) {
                        if (contracts.hasOwnProperty(j)) {
                            callback(contracts[j]);
                        }
                    }
                });
            });
        });
    };

    getTokenBalances = (symbol, offset, length) => {
        offset++;
        return new Promise(resolve => {
            this.contract.then(deployed => {
                deployed.getAssetBalances.call(symbol, offset, length).then(result => {
                    let addresses = result[0];
                    let balances = result[1];
                    let map = new Map();
                    for (let key in addresses) {
                        if (addresses.hasOwnProperty(key) && balances.hasOwnProperty(key)
                            && !this.isEmptyAddress(addresses[key])) {
                            map = map.set(addresses[key], balances[key].toNumber());
                        }
                    }
                    resolve(map);
                });
            });
        });

    };

    isTokenAdded = (proxyAddress) => {
        return new Promise(resolve => {
            this.contract.then(deployed => {
                deployed.getContracts.call().then(contracts => {
                    for (let key in contracts) {
                        if (contracts.hasOwnProperty(key)) {
                            if (contracts[key] === proxyAddress) {
                                resolve(true);
                                return;
                            }
                        }
                    }
                    resolve(false);
                });
            });
        });
    };

    /**
     * @param current will be removed from list
     * @param newAddress proxy or asset
     * @param account from
     * @return {Promise.<bool>} result
     */
    treatToken = (current: TokenContractModel, newAddress: string, account: string) => {
        return new Promise(resolve => {
            if (current.address() === newAddress || current.proxyAddress() === newAddress) {
                resolve(false);
            }
            const callback = (proxyAddress) => {
                this.isTokenAdded(proxyAddress).then(isTokenAdded => {
                    if (isTokenAdded) { // to prevent overriding of already added addresses
                        resolve(false);
                        return;
                    }
                    this.initProxyDAO(proxyAddress).then(() => {
                        this.contract.then(deployed => {
                            const params = {from: account, gas: 3000000};
                            deployed.setAddress(proxyAddress, params).then(() => {
                                // if current is null then we don't need to remove it
                                if (!current.address()) {
                                    resolve(true);
                                } else {
                                    deployed.removeAddress(current.proxyAddress(), params)
                                        .then(() => resolve(true))
                                }
                            });
                        });
                    }).catch(() => resolve(false));
                });
            };
            // we need to know whether the newAddress is proxy or asset
            this.initAssetDAO(newAddress).then(asset => {
                asset.getProxyAddress()
                    .then(proxyAddress => callback(proxyAddress))
                    .catch(() => callback(newAddress));
            }).catch(() => resolve(false));
        });
    };

    /** @param callback will receive TokenContractModel */
    watchUpdateToken = (callback) => {
        this.contract.then(deployed => {
            this.watch(deployed.updateContract, (result, block, ts) => {
                const proxyAddress = result.args.contractAddress;
                this.initProxyDAO(proxyAddress, block).then(proxy => {
                    proxy.getLatestVersion().then(address => {
                        proxy.getSymbol().then(symbol => {
                            this.isTokenAdded(proxyAddress).then(isTokenAdded => {
                                callback(new TokenContractModel({
                                    address: address,
                                    proxy: proxyAddress,
                                    symbol
                                }), ts, !isTokenAdded);
                            });
                        });
                    });
                });
            });
        });
    };


    /**
     * OTHER CONTRACTS
     ***********************************************
     *
     * @return {Promise.<Map[ContractModel]>} associated with contract address
     */
    getOtherContracts = () => {
        return new Promise(resolve => {
            this.contract.then(deployed => {
                deployed.getOtherContracts.call().then(contracts => {
                    let map = new Map();
                    for (let j in contracts) {
                        if (contracts.hasOwnProperty(j)) {
                            map = map.set(contracts[j], new ContractModel({
                                address: contracts[j],
                                name: 'Unknown'
                            }));
                            if (map.size === contracts.length) {
                                resolve(map);
                            }
                        }
                    }
                });
            });
        });
    };
}

export default new AppDAO();