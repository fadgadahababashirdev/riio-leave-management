const Account = require('./account');

const Leaves = require('./leaves');

const models = { Account, Leaves };

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
