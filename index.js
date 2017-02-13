"use strict";
function P (fn) {
    this._state = 'pending'
    this._onFulFilledList = [];
    this._onRejectedList = [];
    fn((value) => {
       resolve(this, value) 
    }, (reason) => {
       reject(this, reason) 
    })
}

P.prototype.then = function(onFulFilled, onRejected) { 
    var newPromise = new P(function(){});
    this._onFulFilledList.push(typeof onFulFilled === 'function' ? onFulFilled : null)
    this._onRejectedList.push(typeof onRejected === 'function' ? onRejected : null)
    this._newPromise = newPromise;
    handleThen(this)
    return newPromise;
}
function handleThen(promise) {
    try{
        if (promise._state === 'fulfilled') {
            promise._onFulFilledList.forEach((onFulFilled)=>{
                if (typeof onFulFilled !== 'function') {
                    return fulfill(promise._newPromise, promise._value);    
                }
                var result = onFulFilled(promise._value);    
                resolve(promise._newPromise, result) 
            })
        }
        if (promise._state === 'rejected') {
            promise._onRejectedList.forEach((onRejected)=>{
                if (typeof onRejected !== 'function') {
                    return reject(promise._newPromise, promise._reason);    
                }
                var result = onRejected(promise._reason);    
                resolve(promise._newPromise, result) 
            })
        }
    } catch(e) {
        reject(promise._newPromise, e)
    }
}
function resolve(promise, x) {
    if (promise === x) {
        reject(promise, new Error('TypeError'))     
    } 
    else if (x && x instanceof P) {
        if (x._state == 'pending') {
            x.then(function(value) {
               resolve(promise, value) 
            }, function(reason) {
               reject(promise, reason) 
            })
        }
        if (x._state == 'fulfilled') {
            resolve(promise, x._value)    
        }
        if (x._state == 'rejected') {
            reject(promise, x._reason)    
        }
    }
    else if (typeof x == 'Object' || typeof x == 'function') {
        var then = x.then;
        if (typeof then == 'function') {
            var called = false;
            try {
                then.call(x, function(y) {
                    if (called) return;
                    called = true
                    resolve(promise, y) 
                }, function(r){
                    if (called) return;
                    called = true
                    reject(promise, r) 
                })    
            } catch(e) {
                if (called) return;
                reject(promise, e)    
            }    
        } else {
            fulfill(promise, x)    
        }
    } else {
        fulfill(promise, x)    
    }
    
}
function reject(promise, r) {
    promise._state = 'rejected';    
    promise._reason = r;
    handleThen(promise);
}
function fulfill(promise, v) {
    promise._state = 'fulfilled';    
    promise._value = v;    
    handleThen(promise);
}
module.exports = P;
