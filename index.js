'use strict';

const chalk = require('chalk');
const Counter = require('passthrough-counter');
const humanize = require('humanize');
const logger = require('jethro');
const prettyMs = require('pretty-ms');

logger.set({
    quickStart: true,
    timeformat: 'MMM DD HH:mm:ss'
});

function time(start) {
    const delta = new Date() - start;
    return prettyMs(delta);
}

function mainLog() {
    /** @this KoaJS
     *   @param {object} next KoaJS Ctx Object.
     */
    return function *log(next) {
        // request
        const start = new Date();

        try {
            yield next;
        } catch (err) {
            logger('error', 'KoaJS', this.method + ' ' + this.originalUrl + ' ' + this.status + ' ' + time(start));
            throw err;
        }

        // calculate the length of a streaming response by intercepting the stream with a counter. Only necessary if a content-length header is currently not set.
        const length = this.responseLength;
        const body = this.body;
        let counter;
        if (length == null && body && body.readable) {
            this.body = body
                .pipe(counter = Counter())
                .on('error', this.onerror);
        }

        const ctx = this; //eslint-disable-line
        const res = this.res;

        function done() {
            /*eslint-disable no-use-before-define */
            res.removeListener('finish', onfinish);
            res.removeListener('close', onclose);
            /*eslint-enable no-use-before-define */
            const len = (counter ? counter.length : length);
            let method;
            let responseLength;
            let status;
            let level;
            if (ctx.method === 'POST' || ctx.method === 'PUT') {
                level = 'info';
                method = chalk.yellow(ctx.method);
            } else if (ctx.method === 'DELETE') {
                level = 'warning';
                method = chalk.red(ctx.method);
            } else if (ctx.method === 'GET') {
                level = 'info';
                method = chalk.green(ctx.method);
            } else {
                level = 'info';
                method = chalk.green(ctx.method);
            }
            if (ctx.status >= 500) {
                level = 'error';
                status = chalk.red(ctx.status);
            } else if (ctx.status >= 400) {
                level = 'warning';
                status = chalk.yellow(ctx.status);
            } else if (ctx.status >= 100) {
                level = 'info';
                status = chalk.green(ctx.status);
            }

            if ([204, 205, 304].indexOf(ctx.status) > -1) {
                responseLength = '';
            } else if (typeof len === 'undefined') {
                responseLength = '-';
            } else {
                responseLength = humanize.filesize(len);
            }

            logger(level, 'KoaJS', status + ' ' + method + ' ' + ctx.originalUrl + ' ' + time(start) + ' ' + responseLength);
        }

        // Logs when the response is finished or closed, whichever happens first.
        const onfinish = done.bind(null, 'finish');
        const onclose = done.bind(null, 'close');
        res.once('finish', onfinish);
        res.once('close', onclose);
    };
}

module.exports = mainLog;
