class Promise {
    #value;
    #status;
    #callbackQueue;

    constructor(func){
        this.#status = 'pending';
        this.#callbackQueue = [];
        func((value) => this.#resolve(value), (error) => this.#reject(error));
    }

    static resolve(value){
        return new MyPromise((resolve) => resolve(value));
    }
    static reject(error){
        return new MyPromise((resolve, reject) => reject(error));
    }
    static race(array){
        return new MyPromise((resolve, reject) => {
            array.map(promise => promise.then(value => resolve(value)).catch(error => reject(error)));
        });
    }
    static all(array){
        return new MyPromise((resolve, reject) => {
            if(!array.length)
                resolve([]);
            let counter = 0;
            let values  = Array.from({ length: array.length });
            array.map((promise, i) => {
                promise.then(value => {
                    counter++;
                    values[i] = value;
                    if(values.length == counter)
                        resolve(values);
                });
                promise.catch(e => reject(e));
            });
        });
    }

    #resolve(value){
        this.#handleFinish(value, 'success');
    }
    #reject(value){
        this.#handleFinish(value, 'error');
    }
    #handleFinish(value, status){
        if(this.#status != 'pending')
            return;
        if(this.#callbackQueue.length){
            let callback = this.#callbackQueue.shift();
            if(value instanceof MyPromise  || value instanceof Promise) {
                let promise = value[callback.type == 'success' ? 'then' : 'catch'](callback.func);
                this.#handleFinish(promise);
            } else if(callback.type == status){
                try{
                    let newValue = callback.func(value);
                    this.#resolve(newValue);
                } catch(e) {
                    this.#reject(e);
                }
            } else
                this.#handleFinish(value, status);
        } else {
            this.#status = status == 'success' ? 'resolved' : 'rejected';
            this.#value = value;
        }
    }

    then(func){
        if(this.#status == 'pending')
            this.#callbackQueue.push({ type: 'success', func: func });
        else if(this.#status == 'resolved')
            func(this.#value);
        return this;
    }
    catch(func){
        if(this.#status == 'pending')
            this.#callbackQueue.push({ type: 'error', func: func });
        else if(this.#status == 'rejected')
            func(this.#value);
        return this;
    }
}