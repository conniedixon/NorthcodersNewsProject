const knex = require("../db/connection");

const fetchUser = username => {
  return knex("users")
    .first("*")
    .where({ username })
    .then(user => {
      if (!user) {
        return Promise.reject({
          status: 404,
          msg: `No user found for username: ${username}`
        });
      }
      return user;
    });
};

const checkUserExists = user => {
  return knex("users")
    .select("*")
    .modify(query => {
      if (user) query.where("username", user);
    })
    .then(user => {
      if (user.length === 0) {
        return Promise.reject({ status: 404, msg: `user not found` });
      } else return user
    });
};

module.exports = { fetchUser, checkUserExists };
