'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var forever = require('./forever');
var queue = require('queue-async');

function Batch(jobSubscriber, jobQueuePool, jobRunner, jobCanceller) {
    EventEmitter.call(this);
    this.jobSubscriber = jobSubscriber;
    this.jobQueuePool = jobQueuePool;
    this.jobRunner = jobRunner;
    this.jobCanceller = jobCanceller;
}
util.inherits(Batch, EventEmitter);

Batch.prototype.start = function () {
    this._subscribe();
};

Batch.prototype._subscribe = function () {
    var self = this;

    this.jobSubscriber.subscribe(function (channel, host) {
        var queue = self.jobQueuePool.getQueue(host);

        // there is nothing to do. It is already running jobs
        if (queue) {
            return;
        }
        queue = self.jobQueuePool.createQueue(host);

        // do forever, it does not throw a stack overflow
        forever(function (next) {
            self._consumeJobs(host, queue, next);
        }, function (err) {
            self.jobQueuePool.removeQueue(host);

            if (err.name === 'EmptyQueue') {
                return console.log(err.message);
            }

            console.error(err);
        });
    });
};

Batch.prototype.drain = function (callback) {
    var self = this;

    var queues = this.jobQueuePool.list();

    var batchQueues = queue(queues.length);

    queues.forEach(function (host) {
        batchQueues.defer(self._drainJob.bind(self), host);
    });

    batchQueues.awaitAll(function (err) {
        if (err) {
            console.error('Something went wrong draining', err);
        } else {
            console.log('Drain complete');
        }

        callback();
    });
};

Batch.prototype._drainJob = function (host, callback) {
    var self = this;
    var job_id = self.jobQueuePool.getCurrentJobId(host);

    if (!job_id) {
        return process.nextTick(function () {
            return callback();
        });
    }

    var queue = self.jobQueuePool.getQueue(host);

    this.jobCanceller.drain(job_id, function (err) {
        if (err && err.name === 'CancelNotAllowedError') {
            return callback();
        }

        if (err) {
            return callback(err);
        }

        queue.enqueueFirst(job_id, host, callback);
    });
};

Batch.prototype.stop = function () {
    this.jobSubscriber.unsubscribe();
};

Batch.prototype._consumeJobs = function (host, queue, callback) {
    var self = this;

    queue.dequeue(host, function (err, job_id) {
        if (err) {
            return callback(err);
        }

        if (!job_id) {
            var emptyQueueError = new Error('Queue ' + host + ' is empty');
            emptyQueueError.name = 'EmptyQueue';
            return callback(emptyQueueError);
        }

        self.jobQueuePool.setCurrentJobId(host, job_id);

        self.jobRunner.run(job_id, function (err, job) {
            self.jobQueuePool.removeCurrentJobId(host);

            if (err && err.name === 'InvalidJobStatus') {
                console.log(err.message);
                return callback();
            }

            if (err) {
                return callback(err);
            }

            if (job.status === 'failed') {
                console.log('Job %s %s in %s due to: %s', job_id, job.status, host, job.failed_reason);
            } else {
                console.log('Job %s %s in %s', job_id, job.status, host);
            }

            self.emit('job:' + job.status, job_id);

            callback();
        });
    });
};

module.exports = Batch;
