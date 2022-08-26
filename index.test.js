// Copyright (c)2021 Quinn Michaels
// Pastebin Deva test file

const {expect} = require('chai')
const pastebin = require('./index.js');

describe(pastebin.me.name, () => {
  beforeEach(() => {
    return pastebin.init()
  });
  it('Check the SVARGA Object', () => {
    expect(pastebin).to.be.an('object');
    expect(pastebin).to.have.property('me');
    expect(pastebin).to.have.property('vars');
    expect(pastebin).to.have.property('listeners');
    expect(pastebin).to.have.property('methods');
    expect(pastebin).to.have.property('modules');
  });
})
