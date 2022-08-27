// Copyright (c)2022 Quinn Michaels
// The Pastaebin Deva

const fs = require('fs');
const path = require('path');
const request = require('request');

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const Deva = require('@indra.ai/deva');
const PASTEBIN = new Deva({
  agent: {
    uid: agent.uid,
    key: agent.key,
    name: agent.name,
    describe: agent.describe,
    prompt: agent.prompt,
    voice: agent.voice,
    profile: agent.profile,
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim().replace(/\xCC\xB6/gm, '').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
    }
  },
  vars,
  listeners: {},
  modules: {},
  deva: {},
  func: {
    /**************
    func: view
    params: opts
    describe: View a pastebin post with it's id as the text parameter.
    ***************/
    view(opts) {
      return new Promise((resolve, reject) => {
        this.question(`#web get ${this.vars.api.raw}${opts.text}`).then(result => {
          return resolve({
            text: result.a.text,
            html: `<pre><code>${this.agent.parse(result.a.text)}</code></pre>`,
          })
        }).catch(reject);
      });
    },

    /**************
    func: post
    params: packet
    describe: Post to paste bin if you have alraedy set the access key in client
    services file.
    ***************/
    post(packet) {
      return new Promise((resolve, reject) => {
        if (!this.running) return resolve(false);
        if (!this.client.services.pasatebin.api_user_key) resolve({text:this.vars.messages.service});
        request.post(this.vars.api.post, {
          form: {
            api_dev_key: this.client.services.pastebin.api_dev_key,
            api_user_key: this.client.services.pastebin.api_user_key,
            api_option: 'paste',
            api_paste_code: packet.q.data.content,
            api_paste_name: packet.q.data.title,
            api_paste_format: this.vars.api_paste_format,
          }
        }, (err, res, data) => {
          if (err) reject(err)
          resolve(data);
        });
      });
    },

    /**************
    func: login
    params: none
    describe: Login to pastebin api using the keys set in the client file.
    ***************/
    login() {
      return new Promise((resolve, reject) => {
        if (!this.client.services.pasatebin.api_user_key) return resolve({text:this.vars.messages.service});
        request.post(this.vars.api.login, {
          form: {
            api_dev_key: this.client.services.pastebin.api_dev_key,
            api_user_name: this.client.services.pastebin.username,
            api_user_password: this.client.services.pastebin.password,
          }
        }, (err, res, data) => {
          if (err) reject(err);
          resolve(data);
        });
      });
    },
  },
  methods: {
    /**************
    method: view
    params: packet
    describe: Call the view function to return a paste.
    ***************/
    view(packet) {
      return this.func.view(packet.q);
    },

    /**************
    method: post
    params: packet
    describe: Post the contents of a packet to pastebin.
    ***************/
    post(packet) {
      return this.func.post(packet);
    },

    /**************
    method: uid
    params: packet
    describe: Generate a unique id
    ***************/
    uid(packet) {
      return Promise.resolve({text:this.uid()});
    },

    /**************
    method: status
    params: packet
    describe: Return the current statusof the deva.
    ***************/
    status(packet) {
      return this.status();
    },

    /**************
    method: help
    params: packet
    describe: Return the help file for the deva.
    ***************/
    help(packet) {
      return new Promise((resolve, reject) => {
        this.lib.help(packet.q.text, __dirname).then(help => {
          return this.question(`#feecting parse ${help}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          });
        }).catch(reject);
      });
    }
  },

  /**************
  func: onInit
  params: none
  describe: The procedure to run when the deva initializes. If there is a
  pastebin key in the client services object it will log the user into pastebin
  and allow posting.
  ***************/
  onInit() {
    this.prompt(this.vars.messages.init);
    // login to pastebin if there is an api key
    if (this.client.services.pastebin.api_dev_key) this.func.login().then(api_user_key => {
      this.prompt(this.vars.messages.login);
      this.client.services.pasatebin.api_user_key = api_user_key;
      return this.start();
    }).catch(err => {
      return this.error(err);
    });
    else return this.start();
  },
});
module.exports = PASTEBIN
