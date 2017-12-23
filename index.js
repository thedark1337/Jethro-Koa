'use strict';

const chalk = require('chalk');
const Counter = require('passthrough-counter');
const humanFormat = require('human-format');
const Jethro = require('jethro');
const logger = new Jethro();
const httpServer = logger.HttpServer;
const util = require('util');

logger.setTimeStampFormat(undefined, 'MMM DD HH:mm:ss');

function time(start) {
    return humanFormat(new Date() - start, {
        seperator: '',
        unit: 'ms'
    });
}

function KoaLogger() {
    httpServer.call(this);

    return this;
}

util.inherit(KoaLogger, httpServer);

KoaLogger.prototype.input = function() {
    return function log(ctx, next) {
        const start = new Date();
        const IP = ctx.headers['x-forwarded-for'] || ctx.headers['X-Real-IP'] || ctx.ip || '0.0.0.0';

        return next().then(() => {

            // calculate the length of a streaming response by intercepting the stream with a counter. Only necessary if a content-length header is currently not set.
            const length = ctx.response.length;
            const body = ctx.body;
            let counter;

            if (length == null && body && body.readable) {
                ctx.body = body
                    .pipe(counter = new Counter())
                    .on('error', ctx.onerror);
            }
            const res = ctx.res;

            function done() {

                /* eslint-disable no-use-before-define */
                res.removeListener('finish', onfinish);
                res.removeListener('close', onclose);

                /* eslint-enable no-use-before-define */
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
                } else if (len == null) {
                    responseLength = '-';
                } else {
                    responseLength = humanFormat(len, {
                        seperator: '',
                        unit: 'B'
                    });
                }
                logger[level]('KoaJS', `${IP} ${status} ${method} ${ctx.originalUrl} ${time(start)} ${responseLength}`);
            }

            // Logs when the response is finished or closed, whichever happens first.
            const onfinish = done.bind(null, 'finish');
            const onclose = done.bind(null, 'close');

            res.once('finish', onfinish);
            res.once('close', onclose);
        })
            .catch((err) => {
                logger('error', 'KoaJS', `${IP} ${ctx.method} ${ctx.originalUrl} ${ctx.status} ${time(start)} ${process.env.NODE_ENV === 'production' ? err.message : err.stack}`);
            });
    };
};

module.exports = KoaLogger;
