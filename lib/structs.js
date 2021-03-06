

const Codec = require('./crypto/codec');
const Signature = require('./crypto/signature');
const sha3 = require('sha3');
const KeyPair = require('./crypto/key_pair');

class Tx {
    constructor(gasPrice, gasLimit, delay) {
        this.gasPrice = gasPrice * 100;
        this.gasLimit = gasLimit;
        this.delay = delay;
        this.actions = [];
        this.signers = [];
        this.signs = [];
        this.publisher = "";
        this.publisher_sigs = [];
    }

    addAction(contract, abi, args) {
        this.actions.push({
            contract: contract,
            actionName: abi,
            data: args,
        })
    }

    setTime(expirationInSecound, delay) {
        let date = new Date();
        this.time = date.getMilliseconds() * 10e6;
        this.expiration = this.time + expirationInSecound * 10e9;
        this.delay = delay;
    }

    _base_hash() {
        const hash = sha3.SHA3(256);
        hash.update(this._bytes(0));
        return hash.digest("binary");
    }

    addSign(kp) {
        const sig = new Signature(this._base_hash(), kp);
        this.signs.push(sig)
    }

    _publish_hash() {
        const hash = sha3.SHA3(256);
        hash.update(this._bytes(1));
        return hash.digest("binary");
    }

    addPublishSign(publisher, kp) {
        this.publisher = publisher;
        const info = this._publish_hash();
        const sig = new Signature(info, kp);
        this.publisher_sigs.push(sig)
    }

    _bytes(n) {
        let c = new Codec();
        c.pushInt64(this.time);
        c.pushInt64(this.expiration);
        c.pushInt64(this.gasPrice);
        c.pushInt64(this.gasLimit);
        c.pushInt64(this.delay);
        c.arrayStart();
        for (let i = 0; i < this.signers.length; i++) {
            c.pushString(this.signers[i])
        }
        c.arrayEnd();
        c.arrayStart();
        for (let i = 0; i < this.actions.length; i++) {
            let c2 = new Codec();
            c2.pushString(this.actions[i].contract);
            c2.pushString(this.actions[i].actionName);
            c2.pushString(this.actions[i].data);
            c.pushBytes(c2._buf)
        }
        c.arrayEnd();

        if (n > 0) {
            c.arrayStart();
            for (let i = 0; i < this.signs.length; i ++) {
                c.pushBytes(this.signs[i]._bytes())
            }
            c.arrayEnd();
        }

        if (n > 1) {
            // todo
        }
        return c._buf
    }
}

module.exports = {Tx: Tx};

