const _ = require("lodash");
const jwt = require("jsonwebtoken");

module.exports = function (opts = {}) {

    return function (req, res, next) {
        res.OK = true;
        res.GAGAL = false;
        res.ERROR = "ERROR";

        var json_to_send = {
            data: [],
            status: res.OK,
            message: "",
            error: "",
            waktu_eksekusi: null,
            f_post: opts.showPost ? req.body : undefined,
            f_get: opts.showGet ? req.query : undefined
        };
        var should_go = true;
        var start_time = new Date();

        res.setStatus = function (status) {
            json_to_send.status = status;
            return res;
        }

        res.setData = function (data = {} || []) {
            json_to_send.data = data;
            return res;
        }

        res.setMessage = function (message = "") {
            json_to_send.message = message;
            return res;
        }

        res.setError = function (which = "", err = {}) {
            json_to_send.error = `${which} --> ${err.stack}`;
            return res;
        }

        res.setRequiredGet = function (fields = []) {
            var fieldGagal = [];
            var get = new Object(req.query);
            for (var i = 0; i < fields.length; i++) {
                if (!get.hasOwnProperty(fields[i])) {
                    fieldGagal.push(fields[i]);
                }
            }
            if (!_.isEmpty(fieldGagal)) {
                let err = `Field GET ${fieldGagal.join(",")} harus dikirim`;
                res.setStatus(res.GAGAL);
                res.setMessage(err);
                res.go();
                should_go = false;
                throw new Error(err);
            }
        }

        res.setRequiredPost = function (fields = []) {
            var fieldGagal = [];
            var post = new Object(req.body);
            for (var i = 0; i < fields.length; i++) {
                if (!post.hasOwnProperty(fields[i])) {
                    fieldGagal.push(fields[i]);
                }
            }
            if (!_.isEmpty(fieldGagal)) {
                let err = `Field POST ${fieldGagal.join(",")} harus dikirim`;
                res.setStatus(res.GAGAL);
                res.setMessage(err);
                res.go();
                should_go = false;
                throw new Error(err);
            }
        }

        res.filterFields = function (method = "GET", keys = []) {
            var fields = (method.toUpperCase() === "GET") ? new Object(req.query) : new Object(req.body);
            for (var prop in fields) {
                if (fields.hasOwnProperty(prop)) {
                    if (keys.indexOf(prop) == -1) {
                        delete fields[prop];
                    }
                }
            }
            return fields;
        }

        res.handleReject = function (reason) {
            res.setStatus(res.ERROR);
            res.setError(reason);
            res.go();
            should_go = false;
            throw new Error(reason);
        }

        res.throw = function (error) {
            res.setStatus(res.GAGAL);
            res.setMessage(`Terjadi kesalahan : ${error}`);
            res.go();
            should_go = false;
            throw new Error(error);
        }

        res.allow = function (include = [], sessionKey = "userdata", fieldKey = "level") {
            if (typeof req.session == "undefined") return res.throw(`Modul session tidak ditemukan`);
            if (typeof req.session[sessionKey] == "undefined") return res.throw(`Session key ${sessionKey} tidak ditemukan`);
            if (include.indexOf(req.session[sessionKey][fieldKey]) == -1) return res.throw(`Level ${req.session[sessionKey][fieldKey]} tidak memiliki hak akses di endpoint ini`);
        }

        res.restrict = function (exclude = [], sessionKey = "userdata", fieldKey = "level") {
            if (typeof req.session == "undefined") return res.throw(`Modul session tidak ditemukan`);
            if (typeof req.session[sessionKey] == "undefined") return res.throw(`Session key ${sessionKey} tidak ditemukan`);
            if (include.indexOf(req.session[sessionKey][fieldKey]) == -1) return res.throw(`Level ${req.session[sessionKey][fieldKey]} tidak memiliki hak akses di endpoint ini`);
        }

        res.go = function () {
            if (should_go) {
                if (json_to_send.status === res.OK) {
                    delete json_to_send.message;
                    delete json_to_send.error;
                } else if (json_to_send.status === res.GAGAL) {
                    delete json_to_send.data;
                    delete json_to_send.error;
                } else if (json_to_send.status === res.ERROR) {
                    delete json_to_send.data;
                    delete json_to_send.message;
                }

                var end_time = new Date();
                json_to_send.waktu_eksekusi = (end_time.getTime() - start_time.getTime()) / 1000;

                res.json(json_to_send);
            }
        }

    }

}