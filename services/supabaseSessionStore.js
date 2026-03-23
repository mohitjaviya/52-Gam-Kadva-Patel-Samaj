const session = require('express-session');
const { supabase } = require('../database/init');

class SupabaseStore extends session.Store {
    constructor(options = {}) {
        super(options);
    }

    async get(sid, callback) {
        try {
            const { data, error } = await supabase
                .from('sessions')
                .select('sess, expire')
                .eq('sid', sid)
                .single();

            if (error || !data) return callback(null, null);

            // Check if expired
            if (new Date(data.expire) < new Date()) {
                await this.destroy(sid, () => {});
                return callback(null, null);
            }

            return callback(null, data.sess);
        } catch (err) {
            return callback(err);
        }
    }

    async set(sid, sess, callback) {
        try {
            const expire = new Date(sess.cookie.expires || Date.now() + 86400000).toISOString();
            const { error } = await supabase
                .from('sessions')
                .upsert({ sid, sess, expire });

            if (error) return callback(error);
            return callback(null);
        } catch (err) {
            return callback(err);
        }
    }

    async destroy(sid, callback) {
        try {
            const { error } = await supabase
                .from('sessions')
                .delete()
                .eq('sid', sid);

            if (error) return callback(error);
            return callback(null);
        } catch (err) {
            return callback(err);
        }
    }

    async touch(sid, sess, callback) {
        try {
            const expire = new Date(sess.cookie.expires || Date.now() + 86400000).toISOString();
            // In touch, we often just update the expiry, but we can also update sess just in case
            const { error } = await supabase
                .from('sessions')
                .update({ expire })
                .eq('sid', sid);

            if (error) return callback(error);
            return callback(null);
        } catch (err) {
            return callback(err);
        }
    }
}

module.exports = SupabaseStore;
