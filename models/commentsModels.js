const knex = require("../db/connection");

const fetchVotes = (params, body) => {
  const { comment_id } = params;
  const { inc_votes } = body;
  return knex("comments")
    .select("*")
    .where({ comment_id })
    .increment("votes", inc_votes)
    .returning("*")
    .then(response => {
      if (response.length === 0) {
        return Promise.reject({
          status: 404,
          msg: `No comments found for id ${comment_id}`
        });
      }
      return response;
    });
};

const fetchDeleteComment = params => {
  const { comment_id } = params;
  return knex("comments")
    .where({ comment_id })
    .del();
};

module.exports = { fetchVotes, fetchDeleteComment };
